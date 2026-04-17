export const initialState = {
  searchQuery: "",
  filters: {
    subjects: [],
    specializations: [],
    availability: {},
    priceRange: { min: 0, max: 1000 },
    ratings: { min: 0, max: 5 },
    location: "",
    languages: []
  },
  sortBy: 'default',
  allTeachers: [],
  filteredResults: [],
  pagination: { page: 1, limit: 12, total: 0 },
  loading: false,
  error: null,
};

export const actionTypes = {
  INITIALIZE_TEACHERS: 'INITIALIZE_TEACHERS',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  APPLY_FILTER: 'APPLY_FILTER',
  SET_SORT_BY: 'SET_SORT_BY',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR'
};

const applyAllFilters = (teachers, filters, query) => {
    if (!teachers || !Array.isArray(teachers)) {
        return [];
    }

    const normalizedQuery = query.toLowerCase();

    return teachers.filter(teacher => {
        if (!teacher) return false;

        // Text Search Filter
        const queryMatch = normalizedQuery === '' ||
            (teacher.name && teacher.name.toLowerCase().includes(normalizedQuery)) ||
            (teacher.subjects && teacher.subjects.some(s => s.toLowerCase().includes(normalizedQuery))) ||
            (teacher.specializations && teacher.specializations.some(s => s.toLowerCase().includes(normalizedQuery)));

        // Subject Filter
        const subjectMatch = filters.subjects.length === 0 ||
            (teacher.subjects && filters.subjects.every(filterSubject => teacher.subjects.includes(filterSubject)));

        // Specialization Filter
        const specializationMatch = filters.specializations.length === 0 ||
            (teacher.specializations && filters.specializations.every(filterSpec => teacher.specializations.includes(filterSpec)));

        // Availability Filter
        const selectedDays = Object.keys(filters.availability).filter(day => filters.availability[day]);
        const availabilityMatch = selectedDays.length === 0 ||
            (teacher.availability && selectedDays.some(day => teacher.availability.includes(day)));

        // Price Range Filter
        const priceMatch = teacher.hourlyRate && teacher.hourlyRate.regular &&
            teacher.hourlyRate.regular >= filters.priceRange.min &&
            teacher.hourlyRate.regular <= filters.priceRange.max;

        // Rating Filter
        const ratingMatch = teacher.rating >= filters.ratings.min;

        // Location Filter
        const locationMatch = filters.location === '' ||
            (teacher.location && teacher.location.toLowerCase().includes(filters.location.toLowerCase()));

        // Language Filter
        const languageMatch = filters.languages.length === 0 ||
            (teacher.languages && filters.languages.every(filterLang => teacher.languages.includes(filterLang)));

        return queryMatch && subjectMatch && specializationMatch && availabilityMatch && priceMatch && ratingMatch && locationMatch && languageMatch;
    });
};

const applySorting = (results, sortBy) => {
  if (!results || !Array.isArray(results)) {
    return [];
  }

  const sortedResults = [...results];

  switch (sortBy) {
    case 'price_asc':
      sortedResults.sort((a, b) => (a.hourlyRate?.regular || 0) - (b.hourlyRate?.regular || 0));
      break;
    case 'price_desc':
      sortedResults.sort((a, b) => (b.hourlyRate?.regular || 0) - (a.hourlyRate?.regular || 0));
      break;
    case 'rating_desc':
      sortedResults.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default:
      break;
  }

  return sortedResults;
};

export const searchReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.INITIALIZE_TEACHERS:
      const initialResults = applyAllFilters(action.payload, state.filters, state.searchQuery);
      const sortedInitialResults = applySorting(initialResults, state.sortBy);
      return {
        ...state,
        allTeachers: action.payload || [],
        filteredResults: sortedInitialResults,
        loading: false,
      };
    case actionTypes.SET_SEARCH_QUERY: {
        const newQuery = action.payload;
        const filtered = applyAllFilters(state.allTeachers, state.filters, newQuery);
        const sorted = applySorting(filtered, state.sortBy);
        return {
            ...state,
            searchQuery: newQuery,
            filteredResults: sorted,
        };
    }
    case actionTypes.APPLY_FILTER: {
      const { filterType, value } = action.payload;
      
      if (filterType === 'clear_all') {
        const filtered = applyAllFilters(state.allTeachers, value, state.searchQuery);
        const sorted = applySorting(filtered, state.sortBy);
        return {
          ...state,
          filters: value,
          filteredResults: sorted,
        };
      }

      const newFilters = {
          ...state.filters,
          [filterType]: value,
      };
      const filtered = applyAllFilters(state.allTeachers, newFilters, state.searchQuery);
      const sorted = applySorting(filtered, state.sortBy);
      return {
        ...state,
        filters: newFilters,
        filteredResults: sorted,
      };
    }
    case actionTypes.SET_SORT_BY: {
        const sorted = applySorting(state.filteredResults, action.payload);
        return {
            ...state,
            sortBy: action.payload,
            filteredResults: sorted,
        };
    }
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};