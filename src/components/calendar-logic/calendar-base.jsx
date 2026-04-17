// Global Calendar Base Logic
// Shared functionality for all calendar types (Teacher, Student, Outside Users)

import { 
  CalendarEvent, 
  TimeSlot, 
  SyncState, 
  SyncStatus, 
  ConflictResult,
  ConflictType,
  ValidationResult 
} from './calendar-types.js';

import { CalendarUtils } from './calendar-utils.js';

// Base Calendar Manager - Extended by specific user types
export class BaseCalendar {
  constructor(userId, userRole) {
    this.userId = userId;
    this.userRole = userRole;
    this.events = [];
    this.syncStatus = new SyncStatus();
    this.offlineQueue = [];
    this.auditLog = [];
    this.config = this.getDefaultConfig();
  }

  // Default configuration
  getDefaultConfig() {
    return {
      timezone: CalendarUtils.Timezone.getUserTimezone(),
      minSessionDuration: 15, // minutes
      maxSessionDuration: 480, // minutes  
      bufferTime: 15, // minutes between sessions
      maxDailyHours: 12, // maximum hours per day
      allowPastEdits: false,
      autoSync: true,
      syncInterval: 600000 // 10 minutes
    };
  }

  // Event Management
  async addEvent(eventData) {
    try {
      // Validate the event
      const validation = this.validateEvent(eventData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for conflicts
      const conflict = await this.detectConflicts(eventData);
      if (conflict.hasConflict && !conflict.canProceed) {
        throw new Error(conflict.message);
      }

      // Create the event
      const event = new CalendarEvent({
        ...eventData,
        id: this.generateEventId(),
        userId: this.userId
      });

      // Store in UTC
      const utcEvent = event.toUTC();
      this.events.push(utcEvent);
      
      // Log the action
      this.logAction('EVENT_CREATED', { eventId: event.id, event: utcEvent });
      
      // Queue for sync if online
      if (this.isOnline()) {
        this.queueSync('create', utcEvent);
      } else {
        this.addToOfflineQueue('create', utcEvent);
      }

      return utcEvent;
    } catch (error) {
      this.logAction('EVENT_CREATE_FAILED', { error: error.message, eventData });
      throw error;
    }
  }

  async updateEvent(eventId, updates) {
    try {
      const eventIndex = this.events.findIndex(e => e.id === eventId);
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }

      const currentEvent = this.events[eventIndex];
      const updatedData = { ...currentEvent, ...updates, updatedAt: new Date().toISOString() };

      // Validate updates
      const validation = this.validateEvent(updatedData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for conflicts (excluding current event)
      const conflict = await this.detectConflicts(updatedData, [eventId]);
      if (conflict.hasConflict && !conflict.canProceed) {
        throw new Error(conflict.message);
      }

      // Update the event
      this.events[eventIndex] = updatedData;
      
      // Log the action
      this.logAction('EVENT_UPDATED', { 
        eventId, 
        oldEvent: currentEvent, 
        newEvent: updatedData 
      });

      // Queue for sync
      if (this.isOnline()) {
        this.queueSync('update', updatedData);
      } else {
        this.addToOfflineQueue('update', updatedData);
      }

      return updatedData;
    } catch (error) {
      this.logAction('EVENT_UPDATE_FAILED', { eventId, error: error.message });
      throw error;
    }
  }

  async deleteEvent(eventId) {
    try {
      const eventIndex = this.events.findIndex(e => e.id === eventId);
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }

      const event = this.events[eventIndex];
      
      // Remove from local array
      this.events.splice(eventIndex, 1);
      
      // Log the action
      this.logAction('EVENT_DELETED', { eventId, event });

      // Queue for sync
      if (this.isOnline()) {
        this.queueSync('delete', { id: eventId });
      } else {
        this.addToOfflineQueue('delete', { id: eventId });
      }

      return true;
    } catch (error) {
      this.logAction('EVENT_DELETE_FAILED', { eventId, error: error.message });
      throw error;
    }
  }

  // Event Validation
  validateEvent(eventData) {
    const result = new ValidationResult();

    // Required fields
    if (!eventData.startTime) {
      result.addError('Start time is required');
    }
    if (!eventData.endTime) {
      result.addError('End time is required');
    }

    // Format validation
    if (eventData.startTime && !CalendarUtils.Validation.isValidDateTime(eventData.startTime)) {
      result.addError('Invalid start time format');
    }
    if (eventData.endTime && !CalendarUtils.Validation.isValidDateTime(eventData.endTime)) {
      result.addError('Invalid end time format');
    }

    // Time range validation
    if (eventData.startTime && eventData.endTime) {
      const startTime = new Date(eventData.startTime);
      const endTime = new Date(eventData.endTime);
      
      if (endTime <= startTime) {
        result.addError('End time must be after start time');
      }

      const durationMinutes = (endTime - startTime) / (1000 * 60);
      if (durationMinutes < this.config.minSessionDuration) {
        result.addError(`Minimum duration is ${this.config.minSessionDuration} minutes`);
      }
      if (durationMinutes > this.config.maxSessionDuration) {
        result.addError(`Maximum duration is ${this.config.maxSessionDuration} minutes`);
      }

      // Past date check
      if (!this.config.allowPastEdits && CalendarUtils.DateTime.isPast(eventData.startTime)) {
        result.addError('Cannot create events in the past');
      }
    }

    return result;
  }

  // Conflict Detection
  async detectConflicts(eventData, excludeEventIds = []) {
    const conflicts = new ConflictResult();
    const startTime = new Date(eventData.startTime);
    const endTime = new Date(eventData.endTime);

    // Check against existing events
    for (const existingEvent of this.events) {
      if (excludeEventIds.includes(existingEvent.id)) continue;

      const existingStart = new Date(existingEvent.startTime);
      const existingEnd = new Date(existingEvent.endTime);

      if (CalendarUtils.Conflict.timeRangesOverlap(startTime, endTime, existingStart, existingEnd)) {
        conflicts.hasConflict = true;
        conflicts.conflictingEvents.push(existingEvent);

        // Determine conflict type and if it can proceed
        if (existingEvent.type === 'booking') {
          conflicts.conflictType = ConflictType.BOOKING_CONFLICT;
          conflicts.canProceed = false;
          conflicts.message = CalendarUtils.Errors.getConflictMessage('booking_conflict', {
            studentName: existingEvent.metadata?.studentName
          });
        } else if (existingEvent.type === 'availability') {
          conflicts.conflictType = ConflictType.AVAILABILITY_OVERLAP;
          conflicts.canProceed = false;
          conflicts.message = CalendarUtils.Errors.getConflictMessage('availability_overlap');
        } else if (existingEvent.type === 'synced') {
          conflicts.conflictType = ConflictType.EXTERNAL_CALENDAR_CONFLICT;
          conflicts.canProceed = true; // Can proceed with confirmation
          conflicts.message = CalendarUtils.Errors.getConflictMessage('external_calendar_conflict', {
            eventTitle: existingEvent.title
          });
        }
        
        break; // Stop at first conflict
      }
    }

    // Check buffer time with adjacent events
    const bufferViolations = this.checkBufferTimeViolations(startTime, endTime, excludeEventIds);
    if (bufferViolations.length > 0) {
      conflicts.hasConflict = true;
      conflicts.conflictType = ConflictType.BUFFER_TIME_VIOLATION;
      conflicts.canProceed = false;
      conflicts.message = CalendarUtils.Errors.getConflictMessage('buffer_time_violation', {
        buffer: this.config.bufferTime
      });
    }

    return conflicts;
  }

  // Buffer time validation
  checkBufferTimeViolations(startTime, endTime, excludeEventIds = []) {
    const violations = [];
    const bufferMs = this.config.bufferTime * 60 * 1000;

    for (const event of this.events) {
      if (excludeEventIds.includes(event.id)) continue;
      if (event.type !== 'booking' && event.type !== 'availability') continue;

      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check if new event starts too soon after existing event ends
      if (startTime > eventEnd && startTime - eventEnd < bufferMs) {
        violations.push({
          type: 'insufficient_gap_after',
          conflictingEvent: event,
          requiredGap: this.config.bufferTime,
          actualGap: Math.floor((startTime - eventEnd) / (1000 * 60))
        });
      }

      // Check if new event ends too close to existing event start
      if (endTime < eventStart && eventStart - endTime < bufferMs) {
        violations.push({
          type: 'insufficient_gap_before',
          conflictingEvent: event,
          requiredGap: this.config.bufferTime,
          actualGap: Math.floor((eventStart - endTime) / (1000 * 60))
        });
      }
    }

    return violations;
  }

  // Sync Management
  async startSync() {
    if (this.syncStatus.state === SyncState.SYNCING) return;
    
    this.syncStatus.state = SyncState.SYNCING;
    this.logAction('SYNC_STARTED');

    try {
      // Process offline queue first
      await this.processOfflineQueue();
      
      // Sync with external calendar
      await this.syncWithExternalCalendar();
      
      this.syncStatus.state = SyncState.IDLE;
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.isHealthy = true;
      this.syncStatus.errorMessage = '';
      
      this.logAction('SYNC_COMPLETED');
    } catch (error) {
      this.syncStatus.state = SyncState.ERROR;
      this.syncStatus.errorMessage = error.message;
      this.syncStatus.isHealthy = false;
      
      this.logAction('SYNC_FAILED', { error: error.message });
      throw error;
    }
  }

  // Process queued offline changes
  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;

    this.logAction('PROCESSING_OFFLINE_QUEUE', { queueLength: this.offlineQueue.length });

    for (const queuedAction of this.offlineQueue) {
      try {
        await this.executeSyncAction(queuedAction);
        this.logAction('OFFLINE_ACTION_SYNCED', { action: queuedAction.type, eventId: queuedAction.data.id });
      } catch (error) {
        this.logAction('OFFLINE_ACTION_FAILED', { 
          action: queuedAction.type, 
          eventId: queuedAction.data.id, 
          error: error.message 
        });
        // Keep failed items in queue for retry
        continue;
      }
    }

    // Clear successfully processed items
    this.offlineQueue = this.offlineQueue.filter(action => action.failed);
    this.syncStatus.queuedChanges = this.offlineQueue.length;
  }

  // Add action to offline queue
  addToOfflineQueue(action, data) {
    this.offlineQueue.push({
      id: this.generateId(),
      type: action,
      data: data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      failed: false
    });
    
    this.syncStatus.queuedChanges = this.offlineQueue.length;
    this.logAction('ADDED_TO_OFFLINE_QUEUE', { action, eventId: data.id });
  }

  // Queue sync action when online
  queueSync(action, data) {
    // Implement immediate sync or batch sync logic here
    // For now, just log the action
    this.logAction('QUEUED_FOR_SYNC', { action, eventId: data.id });
  }

  // External calendar sync (to be implemented by specific calendar types)
  async syncWithExternalCalendar() {
    // Override in specific calendar implementations
    this.logAction('EXTERNAL_SYNC_SKIPPED', { reason: 'Not implemented in base class' });
  }

  // Utility Methods
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  isOnline() {
    return navigator.onLine;
  }

  // Audit Logging
  logAction(action, data = {}) {
    const logEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId: this.userId,
      userRole: this.userRole,
      action,
      data,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    this.auditLog.push(logEntry);
    
    // Keep only last 1000 log entries to prevent memory issues
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Calendar ${this.userRole}]`, action, data);
    }
  }

  getSessionId() {
    if (!this._sessionId) {
      this._sessionId = `session_${this.generateId()}`;
    }
    return this._sessionId;
  }

  // Health Check
  async performHealthCheck() {
    try {
      // Check if external services are accessible
      const healthStatus = {
        timestamp: new Date().toISOString(),
        online: this.isOnline(),
        syncHealth: this.syncStatus.isHealthy,
        queuedChanges: this.syncStatus.queuedChanges,
        lastSync: this.syncStatus.lastSync,
        eventCount: this.events.length
      };

      this.logAction('HEALTH_CHECK', healthStatus);
      return healthStatus;
    } catch (error) {
      this.logAction('HEALTH_CHECK_FAILED', { error: error.message });
      throw error;
    }
  }

  // Event Queries
  getEventsByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= end && eventEnd >= start;
    });
  }

  getEventsForDate(date) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    return this.getEventsByDateRange(startOfDay, endOfDay);
  }

  getUpcomingEvents(limit = 10) {
    const now = new Date();
    return this.events
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, limit);
  }

  // Configuration Management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.logAction('CONFIG_UPDATED', { 
      oldConfig: this.config, 
      newConfig: this.config 
    });
  }

  getConfig() {
    return { ...this.config };
  }

  // Cleanup
  cleanup() {
    // Clear any intervals or timeouts
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Clear large data structures
    this.events = [];
    this.auditLog = [];
    this.offlineQueue = [];
    
    this.logAction('CALENDAR_CLEANUP_COMPLETED');
  }
}

// Export sync queue manager
export class SyncQueueManager {
  constructor() {
    this.queues = new Map();
  }

  getQueue(userId) {
    if (!this.queues.has(userId)) {
      this.queues.set(userId, []);
    }
    return this.queues.get(userId);
  }

  addToQueue(userId, action) {
    const queue = this.getQueue(userId);
    queue.push({
      ...action,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });
  }

  processQueue(userId) {
    const queue = this.getQueue(userId);
    // Implementation for processing sync queue
    return Promise.all(queue.map(action => this.executeAction(action)));
  }

  executeAction(action) {
    // Implementation for executing individual sync actions
    return Promise.resolve(action);
  }
}

// Export conflict detector
export class ConflictDetector {
  static detectEventConflicts(events, newEvent, excludeIds = []) {
    // Implementation for detecting conflicts between events
    const conflicts = [];
    // Add conflict detection logic here
    return conflicts;
  }

  static validateTimeSlot(timeSlot, rules = {}) {
    // Implementation for validating time slots
    const validation = new ValidationResult();
    // Add validation logic here
    return validation;
  }
}

// Global instances
export const syncManager = new SyncQueueManager();
export const conflictDetector = ConflictDetector;