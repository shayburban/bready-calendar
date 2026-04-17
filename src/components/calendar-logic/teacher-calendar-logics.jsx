// Teacher Calendar Logic
// Extends BaseCalendar with teacher-specific functionality
// Integrates with existing teacher registration availability data

import { 
  BaseCalendar, 
  syncManager, 
  conflictDetector 
} from './calendar-base.js';

import { 
  CalendarEvent, 
  TimeSlot, 
  RecurrenceRule, 
  SyncState, 
  ConflictType,
  EventType,
  ValidationResult,
  ConflictResult
} from './calendar-types.js';

import { CalendarUtils } from './calendar-utils.js';

// Teacher-specific calendar event type
export class TeacherAvailabilitySlot extends CalendarEvent {
  constructor(data) {
    super({
      ...data,
      type: EventType.AVAILABILITY,
      metadata: {
        ...data.metadata,
        isTeacherSlot: true,
        canBeBooked: true,
        maxStudents: data.metadata?.maxStudents || 1,
        subjects: data.metadata?.subjects || [],
        hourlyRate: data.metadata?.hourlyRate || 0
      }
    });
  }

  // Check if slot can accommodate booking
  canAcceptBooking() {
    return this.status === 'active' && 
           this.metadata.canBeBooked && 
           !this.isPast();
  }

  // Get available capacity
  getAvailableCapacity() {
    const bookedCount = this.metadata.bookedStudents?.length || 0;
    return Math.max(0, this.metadata.maxStudents - bookedCount);
  }
}

// External calendar event key for sync
export class ExternalEventKey {
  constructor(calendarId, eventId) {
    this.calendarId = calendarId;
    this.eventId = eventId;
    this.key = `${calendarId}:${eventId}`;
  }

  static fromString(keyString) {
    const [calendarId, eventId] = keyString.split(':');
    return new ExternalEventKey(calendarId, eventId);
  }

  toString() {
    return this.key;
  }
}

// Teacher calendar configuration
export class TeacherCalendarConfig {
  constructor({
    timezone = CalendarUtils.Timezone.getUserTimezone(),
    availabilityWindow = { preference: 2, preferenceType: 'Weeks' },
    farAdvanceBooking = { preference: 4, preferenceType: 'Weeks' },
    breakAfterClassHours = 0,
    weeklySchedule = {},
    syncSettings = {
      googleCalendarEnabled: false,
      selectedCalendarId: null,
      syncDirection: 'bidirectional', // 'read', 'write', 'bidirectional'
      conflictResolution: 'prompt' // 'prompt', 'override', 'skip'
    }
  }) {
    this.timezone = timezone;
    this.availabilityWindow = availabilityWindow;
    this.farAdvanceBooking = farAdvanceBooking;
    this.breakAfterClassHours = breakAfterClassHours;
    this.weeklySchedule = weeklySchedule;
    this.syncSettings = syncSettings;
  }

  // Convert to format expected by teacher registration
  toTeacherRegistrationFormat() {
    return {
      availability_timezone: this.timezone,
      availability_window: this.availabilityWindow,
      advance_booking_policy: this.farAdvanceBooking,
      break_after_class_hours: this.breakAfterClassHours,
      availability_schedule: this.weeklySchedule
    };
  }

  // Create from teacher registration data
  static fromTeacherRegistration(regData) {
    return new TeacherCalendarConfig({
      timezone: regData.availability_timezone,
      availabilityWindow: regData.availability_window,
      farAdvanceBooking: regData.advance_booking_policy,
      breakAfterClassHours: regData.break_after_class_hours,
      weeklySchedule: regData.availability_schedule || {}
    });
  }
}

// Main Teacher Calendar Manager
export class TeacherCalendar extends BaseCalendar {
  constructor(teacherId, teacherData = {}) {
    super(teacherId, 'teacher');
    
    // Teacher-specific configuration
    this.teacherConfig = TeacherCalendarConfig.fromTeacherRegistration(teacherData);
    
    // Teacher-specific state
    this.bookings = [];
    this.syncedEvents = [];
    this.recurringRules = [];
    this.bulkChangeQueue = [];
    
    // Google Calendar integration
    this.googleSync = new GoogleCalendarSync(this);
    
    // Sync status for teacher-specific features
    this.teacherSyncStatus = {
      lastAvailabilitySync: null,
      pendingRecurrenceUpdates: 0,
      conflictsAwaitingResolution: []
    };

    // Initialize health check interval
    this.startHealthCheck();
  }

  // === AVAILABILITY MANAGEMENT ===

  // Create availability slot - integrates with teacher registration data
  async createAvailabilitySlot(slotData) {
    try {
      // Validate the slot
      const validation = this.validateAvailabilitySlot(slotData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for conflicts
      const conflict = await this.detectAvailabilityConflicts(slotData);
      if (conflict.hasConflict && !conflict.canProceed) {
        throw new Error(conflict.message);
      }

      // If synced calendar conflict, prompt for user decision
      if (conflict.hasConflict && conflict.canProceed) {
        const shouldProceed = await this.promptConflictResolution(conflict);
        if (!shouldProceed) {
          throw new Error('Creation cancelled by user');
        }
      }

      // Create the availability slot
      const availabilitySlot = new TeacherAvailabilitySlot({
        ...slotData,
        userId: this.userId,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        timezone: this.teacherConfig.timezone
      });

      // Add to events
      const createdEvent = await this.addEvent(availabilitySlot);
      
      // Handle recurring if specified
      if (slotData.recurrenceRule) {
        await this.createRecurringSeries(createdEvent, slotData.recurrenceRule);
      }

      this.logAction('AVAILABILITY_CREATED', { 
        slotId: createdEvent.id, 
        recurring: !!slotData.recurrenceRule 
      });

      return createdEvent;
    } catch (error) {
      this.logAction('AVAILABILITY_CREATE_FAILED', { error: error.message });
      throw error;
    }
  }

  // Update availability - with booking conflict protection
  async updateAvailabilitySlot(slotId, updates) {
    try {
      const existingSlot = this.events.find(e => e.id === slotId);
      if (!existingSlot || existingSlot.type !== EventType.AVAILABILITY) {
        throw new Error('Availability slot not found');
      }

      // Check if there are bookings for this slot
      const hasBookings = this.hasBookingsForSlot(slotId);
      if (hasBookings && this.wouldConflictWithBookings(existingSlot, updates)) {
        const conflict = new ConflictResult({
          hasConflict: true,
          conflictType: ConflictType.BOOKING_CONFLICT,
          canProceed: false,
          message: 'Cannot modify availability. Students have already booked this time slot.'
        });
        throw new Error(conflict.message);
      }

      // Proceed with update
      const updatedSlot = await this.updateEvent(slotId, updates);
      
      this.logAction('AVAILABILITY_UPDATED', { slotId, updates });
      return updatedSlot;
    } catch (error) {
      this.logAction('AVAILABILITY_UPDATE_FAILED', { slotId, error: error.message });
      throw error;
    }
  }

  // Delete availability - with booking protection
  async deleteAvailabilitySlot(slotId) {
    try {
      const existingSlot = this.events.find(e => e.id === slotId);
      if (!existingSlot) {
        throw new Error('Availability slot not found');
      }

      // Check for bookings
      if (this.hasBookingsForSlot(slotId)) {
        throw new Error('Cannot delete availability. Students have booked this time slot.');
      }

      await this.deleteEvent(slotId);
      
      this.logAction('AVAILABILITY_DELETED', { slotId });
      return true;
    } catch (error) {
      this.logAction('AVAILABILITY_DELETE_FAILED', { slotId, error: error.message });
      throw error;
    }
  }

  // === VIEW RESTRICTIONS ===

  // Get only future and present availability (hide past)
  getFutureAvailability() {
    const now = new Date();
    return this.events
      .filter(event => 
        event.type === EventType.AVAILABILITY && 
        new Date(event.endTime) >= now
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  // Get availability for date range (future only)
  getAvailabilityForDateRange(startDate, endDate) {
    const now = new Date();
    const start = new Date(Math.max(now.getTime(), new Date(startDate).getTime()));
    const end = new Date(endDate);
    
    return this.events.filter(event => {
      if (event.type !== EventType.AVAILABILITY) return false;
      
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart <= end && eventEnd >= start;
    });
  }

  // === CONFLICT DETECTION ===

  // Specialized conflict detection for availability
  async detectAvailabilityConflicts(availabilityData) {
    const conflicts = new ConflictResult();
    const startTime = new Date(availabilityData.startTime);
    const endTime = new Date(availabilityData.endTime);

    // Check against existing bookings
    for (const booking of this.bookings) {
      if (CalendarUtils.Conflict.timeRangesOverlap(
        startTime, endTime,
        new Date(booking.startTime), new Date(booking.endTime)
      )) {
        conflicts.hasConflict = true;
        conflicts.conflictType = ConflictType.BOOKING_CONFLICT;
        conflicts.canProceed = false;
        conflicts.message = CalendarUtils.Errors.getConflictMessage('booking_conflict', {
          studentName: booking.metadata?.studentName
        });
        conflicts.conflictingEvents.push(booking);
        return conflicts;
      }
    }

    // Check against existing availability
    for (const existing of this.events) {
      if (existing.type === EventType.AVAILABILITY && 
          CalendarUtils.Conflict.timeRangesOverlap(
            startTime, endTime,
            new Date(existing.startTime), new Date(existing.endTime)
          )) {
        conflicts.hasConflict = true;
        conflicts.conflictType = ConflictType.AVAILABILITY_OVERLAP;
        conflicts.canProceed = false;
        conflicts.message = CalendarUtils.Errors.getConflictMessage('availability_overlap');
        conflicts.conflictingEvents.push(existing);
        return conflicts;
      }
    }

    // Check against synced calendar events
    for (const syncedEvent of this.syncedEvents) {
      if (CalendarUtils.Conflict.timeRangesOverlap(
        startTime, endTime,
        new Date(syncedEvent.startTime), new Date(syncedEvent.endTime)
      )) {
        conflicts.hasConflict = true;
        conflicts.conflictType = ConflictType.EXTERNAL_CALENDAR_CONFLICT;
        conflicts.canProceed = true; // Can proceed with confirmation
        conflicts.message = `This time conflicts with "${syncedEvent.title}" in your synced calendar. Do you want to proceed anyway?`;
        conflicts.conflictingEvents.push(syncedEvent);
        return conflicts;
      }
    }

    return conflicts;
  }

  // === VALIDATION ===

  // Validate availability slot with teacher-specific rules
  validateAvailabilitySlot(slotData) {
    const result = new ValidationResult();

    // Base validation
    const baseValidation = this.validateEvent(slotData);
    result.errors.push(...baseValidation.errors);
    result.warnings.push(...baseValidation.warnings);

    // Teacher-specific validation
    if (slotData.startTime && slotData.endTime) {
      const startTime = new Date(slotData.startTime);
      const endTime = new Date(slotData.endTime);
      const now = new Date();

      // Cannot create availability in the past
      if (startTime < now) {
        result.addError('Cannot create availability for past times');
      }

      // Check availability window restrictions
      const windowDays = this.teacherConfig.availabilityWindow.preference * 
        (this.teacherConfig.availabilityWindow.preferenceType === 'Weeks' ? 7 : 1);
      const maxFutureDate = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
      
      if (startTime > maxFutureDate) {
        result.addWarning(`Availability is beyond your typical ${windowDays}-day window`);
      }

      // Check for reasonable duration (15 minutes to 8 hours)
      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      if (durationHours < 0.25) {
        result.addError('Minimum availability duration is 15 minutes');
      }
      if (durationHours > 8) {
        result.addError('Maximum availability duration is 8 hours');
      }

      // Check daily limits
      const dailyHours = this.calculateDailyHours(startTime, endTime, slotData.excludeId);
      if (dailyHours > 12) {
        result.addError('Total daily availability cannot exceed 12 hours');
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  // === RECURRING APPOINTMENTS ===

  // Create recurring availability series
  async createRecurringSeries(baseEvent, recurrenceRule) {
    try {
      const rule = new RecurrenceRule(recurrenceRule);
      const occurrences = rule.getNextOccurrences(new Date(baseEvent.startTime), 52); // Max 1 year
      const createdEvents = [];

      for (const occurrenceDate of occurrences) {
        const duration = new Date(baseEvent.endTime) - new Date(baseEvent.startTime);
        const startTime = new Date(occurrenceDate);
        const endTime = new Date(startTime.getTime() + duration);

        const recurringSlot = new TeacherAvailabilitySlot({
          ...baseEvent,
          id: null, // Generate new ID
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          metadata: {
            ...baseEvent.metadata,
            isRecurring: true,
            parentEventId: baseEvent.id,
            recurrenceRule: recurrenceRule
          }
        });

        const createdEvent = await this.addEvent(recurringSlot);
        createdEvents.push(createdEvent);
      }

      // Store recurrence rule
      this.recurringRules.push({
        parentId: baseEvent.id,
        rule: rule,
        createdEvents: createdEvents.map(e => e.id)
      });

      this.logAction('RECURRING_SERIES_CREATED', {
        parentId: baseEvent.id,
        occurrenceCount: createdEvents.length
      });

      return createdEvents;
    } catch (error) {
      this.logAction('RECURRING_SERIES_FAILED', { error: error.message });
      throw error;
    }
  }

  // === BULK CHANGES ===

  // Start bulk change transaction
  startBulkChange() {
    this.bulkChangeQueue = [];
    this.logAction('BULK_CHANGE_STARTED');
  }

  // Add change to bulk queue
  queueBulkChange(action, data) {
    this.bulkChangeQueue.push({
      id: this.generateId(),
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Preview bulk changes
  previewBulkChanges() {
    return {
      totalChanges: this.bulkChangeQueue.length,
      changes: this.bulkChangeQueue.map(change => ({
        action: change.action,
        description: this.describeBulkChange(change),
        affectedSlots: this.getAffectedSlots(change)
      })),
      estimatedDuration: this.estimateBulkDuration()
    };
  }

  // Execute bulk changes with undo window
  async executeBulkChanges() {
    try {
      const preview = this.previewBulkChanges();
      this.logAction('BULK_CHANGE_EXECUTING', { preview });

      // Store state for undo
      const undoState = this.captureState();
      
      // Execute all changes
      const results = [];
      for (const change of this.bulkChangeQueue) {
        try {
          const result = await this.executeBulkChangeItem(change);
          results.push({ success: true, change, result });
        } catch (error) {
          results.push({ success: false, change, error: error.message });
        }
      }

      // Clear queue
      this.bulkChangeQueue = [];

      // Start undo timer (5-10 seconds)
      this.startUndoTimer(undoState, 8000);

      this.logAction('BULK_CHANGE_COMPLETED', { 
        totalChanges: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      });

      return {
        success: true,
        results,
        undoAvailable: true,
        undoExpiresIn: 8000
      };
    } catch (error) {
      this.logAction('BULK_CHANGE_FAILED', { error: error.message });
      throw error;
    }
  }

  // === GOOGLE CALENDAR SYNC ===

  // Enable Google Calendar sync
  async enableGoogleSync(calendarId) {
    try {
      this.teacherConfig.syncSettings.googleCalendarEnabled = true;
      this.teacherConfig.syncSettings.selectedCalendarId = calendarId;
      
      await this.googleSync.initialize(calendarId);
      
      this.logAction('GOOGLE_SYNC_ENABLED', { calendarId });
      return true;
    } catch (error) {
      this.logAction('GOOGLE_SYNC_ENABLE_FAILED', { error: error.message });
      throw error;
    }
  }

  // Sync with Google Calendar
  async syncWithExternalCalendar() {
    if (!this.teacherConfig.syncSettings.googleCalendarEnabled) {
      return;
    }

    try {
      this.syncStatus.state = SyncState.SYNCING;
      
      // Fetch events from Google Calendar
      const externalEvents = await this.googleSync.fetchEvents();
      
      // Update synced events
      this.syncedEvents = externalEvents.map(event => ({
        ...event,
        externalEventKey: new ExternalEventKey(
          this.teacherConfig.syncSettings.selectedCalendarId,
          event.id
        ).toString()
      }));

      // Push local availability to Google Calendar if bidirectional
      if (this.teacherConfig.syncSettings.syncDirection === 'bidirectional' || 
          this.teacherConfig.syncSettings.syncDirection === 'write') {
        await this.pushAvailabilityToGoogle();
      }

      this.syncStatus.lastSync = new Date().toISOString();
      this.logAction('GOOGLE_SYNC_COMPLETED', { 
        fetchedEvents: externalEvents.length,
        syncDirection: this.teacherConfig.syncSettings.syncDirection
      });

    } catch (error) {
      this.syncStatus.state = SyncState.ERROR;
      this.syncStatus.errorMessage = error.message;
      this.logAction('GOOGLE_SYNC_FAILED', { error: error.message });
      throw error;
    }
  }

  // === HELPER METHODS ===

  // Check if slot has bookings
  hasBookingsForSlot(slotId) {
    return this.bookings.some(booking => 
      booking.metadata?.availabilitySlotId === slotId
    );
  }

  // Check if updates would conflict with existing bookings
  wouldConflictWithBookings(existingSlot, updates) {
    const updatedStartTime = updates.startTime ? new Date(updates.startTime) : new Date(existingSlot.startTime);
    const updatedEndTime = updates.endTime ? new Date(updates.endTime) : new Date(existingSlot.endTime);

    for (const booking of this.bookings) {
      if (booking.metadata?.availabilitySlotId === existingSlot.id) {
        const bookingStart = new Date(booking.startTime);
        const bookingEnd = new Date(booking.endTime);
        
        // Check if booking is outside the updated time range
        if (bookingStart < updatedStartTime || bookingEnd > updatedEndTime) {
          return true;
        }
      }
    }
    return false;
  }

  // Calculate daily hours for validation
  calculateDailyHours(startTime, endTime, excludeId = null) {
    const targetDate = new Date(startTime).toDateString();
    let totalHours = 0;

    // Add hours from existing events on the same day
    for (const event of this.events) {
      if (event.id === excludeId) continue;
      if (event.type !== EventType.AVAILABILITY) continue;
      
      const eventDate = new Date(event.startTime).toDateString();
      if (eventDate === targetDate) {
        const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60 * 60);
        totalHours += duration;
      }
    }

    // Add hours from the new slot
    const newDuration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);
    totalHours += newDuration;

    return totalHours;
  }

  // Prompt user for conflict resolution
  async promptConflictResolution(conflict) {
    // In a real implementation, this would show a modal or dialog
    // For now, return true to proceed (can be overridden by UI)
    return window.confirm(conflict.message);
  }

  // Start health check monitoring
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logAction('HEALTH_CHECK_ERROR', { error: error.message });
      }
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  // Cleanup
  cleanup() {
    super.cleanup();
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
    }
    
    this.googleSync?.cleanup();
    this.logAction('TEACHER_CALENDAR_CLEANUP_COMPLETED');
  }

  // === BULK CHANGE HELPERS ===

  describeBulkChange(change) {
    switch (change.action) {
      case 'create_availability':
        return `Create availability: ${CalendarUtils.DateTime.formatTime(change.data.startTime)} - ${CalendarUtils.DateTime.formatTime(change.data.endTime)}`;
      case 'update_availability':
        return `Update availability slot ${change.data.id}`;
      case 'delete_availability':
        return `Delete availability slot ${change.data.id}`;
      default:
        return `Unknown action: ${change.action}`;
    }
  }

  getAffectedSlots(change) {
    // Return IDs of affected slots
    return change.data.affectedSlotIds || [change.data.id].filter(Boolean);
  }

  estimateBulkDuration() {
    // Estimate processing time
    return this.bulkChangeQueue.length * 100; // 100ms per change
  }

  async executeBulkChangeItem(change) {
    switch (change.action) {
      case 'create_availability':
        return await this.createAvailabilitySlot(change.data);
      case 'update_availability':
        return await this.updateAvailabilitySlot(change.data.id, change.data.updates);
      case 'delete_availability':
        return await this.deleteAvailabilitySlot(change.data.id);
      default:
        throw new Error(`Unknown bulk change action: ${change.action}`);
    }
  }

  captureState() {
    return {
      events: JSON.parse(JSON.stringify(this.events)),
      recurringRules: JSON.parse(JSON.stringify(this.recurringRules)),
      timestamp: new Date().toISOString()
    };
  }

  startUndoTimer(undoState, duration) {
    this.undoTimer = setTimeout(() => {
      this.undoAvailable = false;
      this.logAction('UNDO_EXPIRED');
    }, duration);

    this.undoAvailable = true;
    this.undoState = undoState;
  }

  async undoBulkChanges() {
    if (!this.undoAvailable || !this.undoState) {
      throw new Error('Undo not available');
    }

    try {
      // Restore previous state
      this.events = this.undoState.events;
      this.recurringRules = this.undoState.recurringRules;

      this.undoAvailable = false;
      this.undoState = null;
      
      if (this.undoTimer) {
        clearTimeout(this.undoTimer);
      }

      this.logAction('BULK_CHANGES_UNDONE');
      return true;
    } catch (error) {
      this.logAction('UNDO_FAILED', { error: error.message });
      throw error;
    }
  }
}

// Google Calendar Integration
class GoogleCalendarSync {
  constructor(teacherCalendar) {
    this.calendar = teacherCalendar;
    this.isInitialized = false;
    this.apiClient = null;
  }

  async initialize(calendarId) {
    // Initialize Google Calendar API client
    // This would integrate with actual Google Calendar API
    this.calendarId = calendarId;
    this.isInitialized = true;
    
    this.calendar.logAction('GOOGLE_SYNC_INITIALIZED', { calendarId });
  }

  async fetchEvents(startDate = new Date(), endDate = null) {
    if (!this.isInitialized) {
      throw new Error('Google Calendar sync not initialized');
    }

    try {
      // Mock implementation - would call actual Google Calendar API
      const mockEvents = [
        {
          id: 'google_event_1',
          title: 'Team Meeting',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          description: 'Weekly team sync'
        }
      ];

      return mockEvents;
    } catch (error) {
      this.calendar.logAction('GOOGLE_FETCH_FAILED', { error: error.message });
      throw error;
    }
  }

  async pushAvailabilityToGoogle() {
    if (!this.isInitialized) return;

    try {
      const availability = this.calendar.getFutureAvailability();
      
      for (const slot of availability) {
        // Mock implementation - would push to actual Google Calendar
        this.calendar.logAction('AVAILABILITY_PUSHED_TO_GOOGLE', { slotId: slot.id });
      }
    } catch (error) {
      this.calendar.logAction('GOOGLE_PUSH_FAILED', { error: error.message });
      throw error;
    }
  }

  cleanup() {
    this.isInitialized = false;
    this.apiClient = null;
  }
}

// Export teacher calendar factory
export function createTeacherCalendar(teacherId, teacherData = {}) {
  return new TeacherCalendar(teacherId, teacherData);
}

// Export sync services for use in UI components
export const TeacherCalendarServices = {
  // Availability validation service
  availabilityValidator: {
    validate: (slotData, config) => {
      const calendar = new TeacherCalendar('temp', config);
      return calendar.validateAvailabilitySlot(slotData);
    }
  },

  // Conflict detection service  
  conflictDetector: {
    detectConflicts: async (slotData, existingEvents, config) => {
      const calendar = new TeacherCalendar('temp', config);
      calendar.events = existingEvents;
      return await calendar.detectAvailabilityConflicts(slotData);
    }
  },

  // Recurring rules helper
  recurrenceHelper: {
    generateOccurrences: (baseDate, rule, count = 10) => {
      const recurrence = new RecurrenceRule(rule);
      return recurrence.getNextOccurrences(baseDate, count);
    }
  }
};