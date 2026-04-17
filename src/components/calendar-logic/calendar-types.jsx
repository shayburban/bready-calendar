// Shared Calendar Types and Interfaces
// Used by all calendar implementations (Teacher, Student, Outside Users)

// Base calendar event structure for all users
export const CalendarEventStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export const SyncState = {
  IDLE: 'idle',
  SYNCING: 'syncing', 
  ERROR: 'error',
  RECONNECT_NEEDED: 'reconnect_needed',
  OFFLINE: 'offline'
};

export const ConflictType = {
  BOOKING_CONFLICT: 'booking_conflict',
  AVAILABILITY_OVERLAP: 'availability_overlap',
  EXTERNAL_CALENDAR_CONFLICT: 'external_calendar_conflict',
  PAST_DATE: 'past_date',
  DURATION_INVALID: 'duration_invalid',
  BUFFER_TIME_VIOLATION: 'buffer_time_violation'
};

export const UserRole = {
  TEACHER: 'teacher',
  STUDENT: 'student', 
  OUTSIDE: 'outside'
};

export const EventType = {
  AVAILABILITY: 'availability',
  BOOKING: 'booking',
  SYNCED: 'synced',
  BLOCKED: 'blocked'
};

// Base calendar event structure
export class CalendarEvent {
  constructor({
    id = null,
    title = '',
    description = '',
    startTime = null,
    endTime = null,
    timezone = 'UTC',
    type = EventType.AVAILABILITY,
    status = CalendarEventStatus.ACTIVE,
    userId = null,
    externalEventKey = null,
    recurringRule = null,
    metadata = {}
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.startTime = startTime; // ISO string
    this.endTime = endTime; // ISO string  
    this.timezone = timezone;
    this.type = type;
    this.status = status;
    this.userId = userId;
    this.externalEventKey = externalEventKey; // For synced events
    this.recurringRule = recurringRule;
    this.metadata = metadata; // Additional data per user type
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  // Convert to UTC for storage
  toUTC() {
    return {
      ...this,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString(),
      timezone: 'UTC'
    };
  }

  // Get duration in minutes
  getDurationMinutes() {
    if (!this.startTime || !this.endTime) return 0;
    return (new Date(this.endTime) - new Date(this.startTime)) / (1000 * 60);
  }

  // Check if event is in the past
  isPast() {
    return new Date(this.endTime) < new Date();
  }

  // Check if event is today
  isToday() {
    const today = new Date().toDateString();
    return new Date(this.startTime).toDateString() === today;
  }
}

// Time slot definition
export class TimeSlot {
  constructor({
    start = '',
    end = '',
    dayOfWeek = null, // 0-6, Sunday = 0
    date = null, // Specific date if not recurring
    timezone = 'UTC',
    isRecurring = false
  }) {
    this.start = start; // HH:MM format
    this.end = end; // HH:MM format
    this.dayOfWeek = dayOfWeek;
    this.date = date; // YYYY-MM-DD format
    this.timezone = timezone;
    this.isRecurring = isRecurring;
  }

  // Convert to full datetime
  toDateTime(referenceDate = new Date()) {
    const date = this.date || referenceDate.toISOString().split('T')[0];
    return {
      startTime: `${date}T${this.start}:00`,
      endTime: `${date}T${this.end}:00`
    };
  }

  // Get duration in minutes
  getDurationMinutes() {
    const [startHour, startMin] = this.start.split(':').map(Number);
    const [endHour, endMin] = this.end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  // Check for time overlap with another slot
  overlapsWith(otherSlot) {
    if (this.date && otherSlot.date && this.date !== otherSlot.date) {
      return false;
    }
    
    const thisStart = this.start;
    const thisEnd = this.end;
    const otherStart = otherSlot.start;
    const otherEnd = otherSlot.end;
    
    return thisStart < otherEnd && thisEnd > otherStart;
  }
}

// Recurring rule definition
export class RecurrenceRule {
  constructor({
    frequency = 'weekly', // daily, weekly, monthly
    interval = 1, // Every N weeks
    daysOfWeek = [], // [0,1,2,3,4,5,6] for Sun-Sat
    endDate = null, // When to stop recurring
    maxOccurrences = null // Max number of occurrences
  }) {
    this.frequency = frequency;
    this.interval = interval;
    this.daysOfWeek = daysOfWeek;
    this.endDate = endDate;
    this.maxOccurrences = maxOccurrences;
  }

  // Generate next occurrence dates
  getNextOccurrences(fromDate, count = 10) {
    const occurrences = [];
    let currentDate = new Date(fromDate);
    
    for (let i = 0; i < count && (!this.endDate || currentDate <= new Date(this.endDate)); i++) {
      if (this.frequency === 'weekly') {
        // Find next matching day of week
        while (!this.daysOfWeek.includes(currentDate.getDay())) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        occurrences.push(new Date(currentDate));
        
        // Move to next week for next iteration
        currentDate.setDate(currentDate.getDate() + 7 * this.interval);
      }
    }
    
    return occurrences;
  }
}

// Conflict detection result
export class ConflictResult {
  constructor({
    hasConflict = false,
    conflictType = null,
    conflictingEvents = [],
    message = '',
    canProceed = false,
    resolution = null
  }) {
    this.hasConflict = hasConflict;
    this.conflictType = conflictType;
    this.conflictingEvents = conflictingEvents;
    this.message = message;
    this.canProceed = canProceed; // Can user override this conflict
    this.resolution = resolution; // Suggested resolution
  }
}

// Sync status information
export class SyncStatus {
  constructor({
    state = SyncState.IDLE,
    lastSync = null,
    nextSync = null,
    errorMessage = '',
    queuedChanges = 0,
    isHealthy = true
  }) {
    this.state = state;
    this.lastSync = lastSync;
    this.nextSync = nextSync;
    this.errorMessage = errorMessage;
    this.queuedChanges = queuedChanges;
    this.isHealthy = isHealthy;
  }

  needsReconnection() {
    return this.state === SyncState.RECONNECT_NEEDED || this.state === SyncState.ERROR;
  }

  hasQueuedChanges() {
    return this.queuedChanges > 0;
  }
}

// Validation result
export class ValidationResult {
  constructor({
    isValid = true,
    errors = [],
    warnings = []
  }) {
    this.isValid = isValid;
    this.errors = errors;
    this.warnings = warnings;
  }

  addError(message) {
    this.errors.push(message);
    this.isValid = false;
  }

  addWarning(message) {
    this.warnings.push(message);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasWarnings() {
    return this.warnings.length > 0;
  }
}