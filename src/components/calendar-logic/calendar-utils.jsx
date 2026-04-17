// Shared Calendar Utility Functions
// Used across all calendar implementations

// Date and time formatting utilities
export const DateTimeUtils = {
  // Format date for display
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      default:
        return d.toLocaleDateString();
    }
  },

  // Format time for display
  formatTime(time, format = '24h') {
    if (typeof time === 'string' && time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      
      if (format === '12h') {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
      }
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    const d = new Date(time);
    return format === '12h' ? d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
           d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
  },

  // Parse time string to minutes since midnight
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // Convert minutes since midnight to time string
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  },

  // Get current time in HH:MM format
  getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  },

  // Check if a date is today
  isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    return today.toDateString() === checkDate.toDateString();
  },

  // Check if a date is in the past
  isPast(date) {
    return new Date(date) < new Date();
  },

  // Check if a date is in the future
  isFuture(date) {
    return new Date(date) > new Date();
  },

  // Add days to a date
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Get day of week (0 = Sunday, 6 = Saturday)
  getDayOfWeek(date) {
    return new Date(date).getDay();
  },

  // Get week start date (Sunday)
  getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  },

  // Get days in current month
  getDaysInMonth(date = new Date()) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }
};

// Timezone utilities
export const TimezoneUtils = {
  // Get user's timezone
  getUserTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  },

  // Convert UTC to local timezone
  utcToLocal(utcDate, timezone = null) {
    const tz = timezone || this.getUserTimezone();
    return new Date(utcDate).toLocaleString('en-US', { timeZone: tz });
  },

  // Convert local time to UTC
  localToUTC(localDate, timezone = null) {
    const tz = timezone || this.getUserTimezone();
    // Create date assuming it's in the specified timezone
    const date = new Date(localDate);
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utcTime);
  },

  // Get timezone offset in minutes
  getTimezoneOffset(timezone = null) {
    const tz = timezone || this.getUserTimezone();
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (this.getTimezoneOffsetMinutes(tz) * 60000));
    return (localTime.getTime() - now.getTime()) / 60000;
  },

  // Check if timezone observes DST
  observesDST(timezone = null) {
    const tz = timezone || this.getUserTimezone();
    const january = new Date(new Date().getFullYear(), 0, 1);
    const july = new Date(new Date().getFullYear(), 6, 1);
    
    const janOffset = this.getTimezoneOffsetForDate(january, tz);
    const julOffset = this.getTimezoneOffsetForDate(july, tz);
    
    return janOffset !== julOffset;
  },

  // Get timezone offset for specific date
  getTimezoneOffsetForDate(date, timezone) {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone })).getTimezoneOffset();
  },

  // Format timezone for display
  formatTimezone(timezone = null) {
    const tz = timezone || this.getUserTimezone();
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'short'
    });
    
    return formatter.formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value || tz;
  }
};

// Validation utilities
export const ValidationUtils = {
  // Validate time format (HH:MM)
  isValidTimeFormat(time) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  // Validate date format (YYYY-MM-DD)
  isValidDateFormat(date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date) && !isNaN(Date.parse(date));
  },

  // Validate datetime ISO string
  isValidDateTime(datetime) {
    return !isNaN(Date.parse(datetime));
  },

  // Validate time range (end must be after start)
  isValidTimeRange(startTime, endTime) {
    const startMinutes = DateTimeUtils.timeToMinutes(startTime);
    const endMinutes = DateTimeUtils.timeToMinutes(endTime);
    return endMinutes > startMinutes;
  },

  // Validate duration (minimum and maximum limits)
  isValidDuration(startTime, endTime, minMinutes = 15, maxMinutes = 480) {
    const startMinutes = DateTimeUtils.timeToMinutes(startTime);
    const endMinutes = DateTimeUtils.timeToMinutes(endTime);
    const duration = endMinutes - startMinutes;
    
    return duration >= minMinutes && duration <= maxMinutes;
  },

  // Check if date is not in the past
  isNotPast(date) {
    return new Date(date) >= new Date().setHours(0, 0, 0, 0);
  },

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

// Conflict detection utilities
export const ConflictUtils = {
  // Check if two time ranges overlap
  timeRangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  },

  // Check if time slot overlaps with event
  slotOverlapsWithEvent(timeSlot, event) {
    const slotDateTime = timeSlot.toDateTime();
    return this.timeRangesOverlap(
      new Date(slotDateTime.startTime),
      new Date(slotDateTime.endTime),
      new Date(event.startTime),
      new Date(event.endTime)
    );
  },

  // Find all conflicts in a list of events
  findConflicts(events) {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (this.timeRangesOverlap(
          new Date(events[i].startTime),
          new Date(events[i].endTime),
          new Date(events[j].startTime),
          new Date(events[j].endTime)
        )) {
          conflicts.push({
            event1: events[i],
            event2: events[j],
            type: 'overlap'
          });
        }
      }
    }
    
    return conflicts;
  },

  // Check buffer time between events
  hasAdequateBuffer(event1, event2, bufferMinutes = 15) {
    const end1 = new Date(event1.endTime);
    const start2 = new Date(event2.startTime);
    const diffMinutes = (start2 - end1) / (1000 * 60);
    
    return diffMinutes >= bufferMinutes;
  }
};

// Error message generators
export const ErrorMessages = {
  // Generate conflict error message
  getConflictMessage(conflictType, details = {}) {
    switch (conflictType) {
      case 'booking_conflict':
        return `Cannot change availability. You have a booking with ${details.studentName || 'a student'} at this time.`;
      
      case 'availability_overlap':
        return `You already have availability set for this time slot.`;
      
      case 'external_calendar_conflict':
        return `This time conflicts with "${details.eventTitle || 'an event'}" in your synced calendar.`;
      
      case 'past_date':
        return `Cannot create availability for past dates.`;
      
      case 'duration_invalid':
        return `Session duration must be between ${details.min || 15} and ${details.max || 480} minutes.`;
      
      case 'buffer_time_violation':
        return `Need at least ${details.buffer || 15} minutes between sessions.`;
      
      default:
        return 'There is a scheduling conflict with this time slot.';
    }
  },

  // Generate validation error messages
  getValidationError(field, value, rules = {}) {
    if (!value) {
      return `${field} is required.`;
    }
    
    switch (field.toLowerCase()) {
      case 'time':
        if (!ValidationUtils.isValidTimeFormat(value)) {
          return 'Please enter time in HH:MM format.';
        }
        break;
      
      case 'date':
        if (!ValidationUtils.isValidDateFormat(value)) {
          return 'Please enter date in YYYY-MM-DD format.';
        }
        if (ValidationUtils.isPast(value)) {
          return 'Cannot select past dates.';
        }
        break;
      
      case 'email':
        if (!ValidationUtils.isValidEmail(value)) {
          return 'Please enter a valid email address.';
        }
        break;
    }
    
    return null;
  },

  // Generate sync error messages
  getSyncError(errorType, details = {}) {
    switch (errorType) {
      case 'auth_expired':
        return 'Google Calendar connection expired. Please reconnect your account.';
      
      case 'quota_exceeded':
        return 'Google Calendar API quota exceeded. Please try again later.';
      
      case 'network_error':
        return 'Unable to sync with Google Calendar. Check your internet connection.';
      
      case 'permission_denied':
        return 'Permission denied. Please check your Google Calendar permissions.';
      
      default:
        return 'Sync failed. Please try again or contact support.';
    }
  }
};

// Export utility collections
export const CalendarUtils = {
  DateTime: DateTimeUtils,
  Timezone: TimezoneUtils,
  Validation: ValidationUtils,
  Conflict: ConflictUtils,
  Errors: ErrorMessages
};