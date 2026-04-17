
// AI_COMPONENT: TeacherReducers
// AI_FUNCTION: State management for teacher registration form
// AI_DEPENDENCIES: None
// AI_SEARCH_IMPACT: Manages data that affects student search functionality

// REDUCERS LOGIC START

//* SUBJECT CATEGORY
export const subCategoryReducer = (state, action) => {
  if (action.type === "CAT_SEARCH") {
    return {
      name: action.value,
    };
  }
  if (action.type === "SELECT_CAT") {
    return {
      name: action.value[0].name,
      subjectCategoryId: action.value[0].subjectCategoryId,
    };
  }

  return {
    name: "",
    subjectCategoryId: "",
  };
};

//* ALL SUBJECT REDUCER
export const teachingReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_SUBJECT':
            // Check if subject already exists
            const exists = state.some(subject =>
                subject.subject === action.payload.subject &&
                subject.level === action.payload.level
            );
            if (exists) return state;
            return [...state, action.payload];
        case 'REMOVE_SUBJECT':
            return state.filter(subject => subject.id !== action.payload);
        case 'UPDATE_SUBJECT':
            return state.map(subject =>
                subject.id === action.payload.id ? { ...subject, ...action.payload } : subject
            );
        default:
            return state;
    }
};

//* CURRENT SELECTED SUBJECT REDUCER
export const subjectReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SUBJECT':
            return {
                ...state,
                subject: action.payload.subject || '',
                id: action.payload.id || '',
                isCustom: action.payload.isCustom || false
            };
        case 'SET_LEVEL':
            return { ...state, level: action.payload || '' };
        case 'RESET':
            return { subject: '', level: '', id: '', isCustom: false };
        default:
            return state;
    }
};

//* CURRENT CUSTOM SUBJECT REDUCER
export const typeSubReducer = (state, action) => {
  if (action.type === "SUBJECT") {
    return {
      ...state,
      subject: action.value,
    };
  }
  if (action.type === "SELECT_LEVEL") {
    return {
      ...state,
      level: action.value,
    };
  }
  if (action.type === "RESET") {
    return {
      subject: "",
      level: "",
      isCustom: true,
    };
  }
  return {
    subject: "",
    level: "",
    isCustom: true,
  };
};

//* ALL SPECILIZATIONS REDUCER
export const specsReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_SPEC':
            // Check if specialization already exists
            const exists = state.some(spec =>
                spec.specialization === action.payload.specialization &&
                spec.subject === action.payload.subject &&
                spec.level === action.payload.level
            );
            if (exists) return state;
            return [...state, action.payload];
        case 'REMOVE_SPEC':
            return state.filter(spec => spec.id !== action.payload);
        case 'UPDATE_SPEC':
            return state.map(spec =>
                spec.id === action.payload.id ? { ...spec, ...action.payload } : spec
            );
        default:
            return state;
    }
};

//* current specilization reducer
export const specReducer = (state, action) => {
    switch (action.type) {
        case 'SET_SPEC':
            return {
                ...state,
                specialization: action.payload.specialization || '',
                subject: action.payload.subject || '',
                id: action.payload.id || '',
                isCustom: action.payload.isCustom || false
            };
        case 'SET_LEVEL':
            return { ...state, level: action.payload || '' };
        case 'SET_DESCRIPTION':
            return { ...state, description: action.payload || '' };
        case 'RESET':
            return { subject: '', specialization: '', level: '', description: '', isCustom: false };
        default:
            return state;
    }
};

//* CUSTOM CURRENT SPECIALIZATION REDUCER
export const customSpecReducer = (state, action) => {
  if (action.type === "CUSTOM_SPEC") {
    return {
      ...state,
      specialization: action.value,
    };
  }
  if (action.type === "SUBJECT") {
    return {
      ...state,
      subject: action.value,
    };
  }

  if (action.type === "SELECT_LEVEL") {
    return {
      ...state,
      level: action.value,
    };
  }
  if (action.type === "SPEC_DESCRIPTION") {
    return {
      ...state,
      description: action.value,
    };
  }
  return {
    subject: "",
    specialization: "",
    level: "",
    description: "",
    isCustom: true,
  };
};

//* BOARD SELECT REDUCER
export const boardReducer = (state, action) => {
  if (action.type === "BOARD") {
    return {
      ...state,
      boardName: action.value,
    };
  }

  if (action.type === "SELECT_BOARD") {
    return {
      ...state,
      boardName: action.value.board,
      id: action.value.id,
    };
  }

  if (action.type === "SELECT_SUBJECT") {
    return {
      ...state,
      subject: action.value,
    };
  }
  return {
    boardName: "",
    subject: "",
    isCustom: false,
  };
};

export const customBoardReducer = (state, action) => {
  if (action.type === "CUSTOM_BOARD") {
    return {
      ...state,
      boardName: action.value,
    };
  }

  if (action.type === "SELECT_SUBJECT") {
    return {
      ...state,
      subject: action.value,
    };
  }
  return {
    boardName: "",
    subject: "",
    isCustom: true,
  };
};

//* ALL BOARD REDUCER
export const allBoardsReducer = (state, action) => {
  if (action.type === "ADD_BOARD") {
    return [...state, action.value];
  }

  if (action.type === "ADD_CUSTOM_BOARD") {
    return [...state, action.value];
  }

  if (action.type === "RESET_BOARD") {
    return action.value;
  }

  if (action.type === "DELETE_BOARD") {
    const filteredBoards = state?.filter((board) => {
      return board.boardName !== action.value;
    });
    return [...filteredBoards];
  }

  if (action.type === "DELETE_CUSTOM_BOARD") {
    const filteredBoards = state?.filter((board) => {
      return board.boardName !== action.value;
    });
    return [...filteredBoards];
  }

  return [];
};

//* EXAM SELECT REDUCER
export const examReducer = (state, action) => {
  if (action.type === "EXAM") {
    return {
      ...state,
      examName: action.value,
    };
  }

  if (action.type === "SELECT_EXAM") {
    return {
      ...state,
      examName: action.value.exam,
      id: action.value.id,
    };
  }

  if (action.type === "SELECT_SUBJECT") {
    return {
      ...state,
      subject: action.value,
    };
  }
  return {
    examName: "",
    subject: "",
    isCustom: false,
  };
};

//* CUSTOM EXAM REDUCER
export const customExamReducer = (state, action) => {
  if (action.type === "CUSTOM_EXAM") {
    return {
      ...state,
      examName: action.value,
    };
  }

  if (action.type === "SELECT_SUBJECT") {
    return {
      ...state,
      subject: action.value,
    };
  }
  return {
    examName: "",
    subject: "",
    isCustom: true,
  };
};

//* ALL EXAM REDUCERS
export const allExamReducer = (state, action) => {
  // Ensure state is initialized to an array if undefined
  const currentState = state === undefined ? [] : state;

  switch (action.type) {
    case 'ADD_EXAM': // Kept for legacy if needed
      return [...currentState, action.value];
    case 'ADD_CUSTOM_EXAM': // Kept for legacy if needed
      return [...currentState, action.value];
    case 'DELETE_EXAM': // Kept for legacy if needed
      const filteredLegacyExams = currentState.filter((exam) => {
        return exam.examName !== action.value;
      });
      return [...filteredLegacyExams];
    
    // --- NEW LOGIC FOR COUNTRY-BASED EXAMS ---
    case 'ADD_EXAM_LINK':
      const exists = currentState.some(link => 
          link.exam.id === action.payload.exam.id &&
          (link.subject?.id || null) === (action.payload.subject?.id || null)
      );
      if (exists) return currentState; // Prevent duplicates
      return [...currentState, action.payload];
      
    case 'REMOVE_EXAM_LINK':
      return currentState.filter(link => link.id !== action.payload);

    // --- LEGACY RESET/DELETE ---
    case 'RESET_EXAM':
      return action.value;
    case 'DELETE_CUSTOM_EXAM':
      const filteredExams = currentState.filter((exam) => {
        return exam.examName !== action.value;
      });
      return [...filteredExams];
    default:
      return currentState;
  }
};

// --- MERGED AVAILABILITY REDUCER ---

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const availabilityInitialState = {
  timezone: '',
  // Set the initial state for slots to have one open row for each day
  slots: daysOfWeek.reduce((acc, day) => {
    acc[day] = [{ start: '', end: '', error: null }];
    return acc;
  }, {}),
  availabilityWindow: {
    preference: 2,
    preferenceType: 'Weeks',
  },
  farAdvanceBookingFromStudent: {
    preference: 4,
    preferenceType: 'Weeks',
  },
  breakAfterClassInHours: 0
};

export const availabilityReducer = (state, action) => {
  const { type, payload } = action;

  switch (type) {
    case 'SET_AVAILABILITY':
      return { ...state, ...payload };
      
    case 'SET_WINDOW':
      return { ...state, availabilityWindow: payload };

    case 'SET_ADVANCE_BOOKING':
      return { ...state, farAdvanceBookingFromStudent: payload };

    case 'SET_BREAK_TIME':
      return { ...state, breakAfterClassInHours: payload };

    case 'ADD_SLOT': {
      const { day } = payload;
      const daySlots = state.slots[day] ? [...state.slots[day]] : [];
      daySlots.push({ start: '', end: '', error: null });
      return { ...state, slots: { ...state.slots, [day]: daySlots } };
    }

    case 'REMOVE_SLOT': {
      const { day, index } = payload;
      const daySlots = [...state.slots[day]];
      daySlots.splice(index, 1);
      return { ...state, slots: { ...state.slots, [day]: daySlots } };
    }

    case 'UPDATE_SLOT': {
      const { day, index, update } = payload;
      const daySlots = [...state.slots[day]];
      const newSlot = { ...daySlots[index], ...update };
      
      // Clear error when user makes a change
      if(newSlot.error) newSlot.error = null;

      daySlots[index] = newSlot;
      return { ...state, slots: { ...state.slots, [day]: daySlots } };
    }
    
    case 'SET_SLOT_ERROR': {
        const { day, index, error } = payload;
        const daySlots = [...state.slots[day]];
        daySlots[index] = { ...daySlots[index], error };
        return { ...state, slots: { ...state.slots, [day]: daySlots } };
    }

    default:
      return state;
  }
};
