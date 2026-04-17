
import React, { createContext, useContext, useReducer, useState } from 'react';
import {
  subCategoryReducer,
  teachingReducer,
  subjectReducer,
  typeSubReducer,
  specsReducer,
  specReducer,
  customSpecReducer,
  boardReducer,
  customBoardReducer,
  allBoardsReducer,
  examReducer,
  customExamReducer,
  allExamReducer,
  availabilityReducer,
  availabilityInitialState
} from './teacherReducers';

const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
  // Personal Information State - Initialize with empty values to show placeholders
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    country: '',
    timezone: '',
    bio: '',
    profilePicture: '',
    videoIntro: '', 
    phoneVerified: false,
    education: [],
    experience: {
      online_years: 0,
      offline_years: 0,
      industry_years: 0
    },
    languages: [],
  });

  // State for pricing and packages - now centralized
  const [services, setServices] = useState([
    { id: 'trial', title: 'Trial', enabled: true, isTrial: true, trialPercentage: 0, isAlwaysEnabled: true },
    { id: 'consulting', title: 'Consulting', enabled: true, price: null, tooltip: "One-on-one consulting sessions" },
    { id: 'onlineClass', title: 'Online Class', enabled: true, price: null, tooltip: "Interactive online classes" },
    { id: 'technicalInterview', title: 'Technical Interview', enabled: true, price: null, tooltip: "Help students prepare for technical interviews." }
  ]);
  const [packages, setPackages] = useState([
    { id: 'consultingPkg', title: 'Consulting Package', enabled: true, price: null },
    { id: 'onlineClassPkg', title: 'Online Class Package', enabled: true, price: null },
    { id: 'technicalInterviewPkg', title: 'Tech Interview Package', enabled: true, price: null, tooltip: "Package deal for interview preparation." }
  ]);

  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false); 
  const [errors, setErrors] = useState({});

  // Initialize all reducers with proper default values
  const [subCategory, dispatchSubCategory] = useReducer(subCategoryReducer, { name: '', subjectCategoryId: '' });
  const [teachingSubjects, dispatchTeachingSubjects] = useReducer(teachingReducer, []);
  const [currentSubject, dispatchCurrentSubject] = useReducer(subjectReducer, { subject: '', level: '', id: '', isCustom: false });
  const [customSubject, dispatchCustomSubject] = useReducer(typeSubReducer, { subject: '', level: '', isCustom: true });
  
  const [allSpecs, dispatchAllSpecs] = useReducer(specsReducer, []);
  const [currentSpec, dispatchCurrentSpec] = useReducer(specReducer, { subject: '', specialization: '', level: '', description: '', isCustom: false });
  const [customSpec, dispatchCustomSpec] = useReducer(customSpecReducer, { subject: '', specialization: '', level: '', description: '', isCustom: true });
  
  const [currentBoard, dispatchCurrentBoard] = useReducer(boardReducer, { boardName: '', subject: '', isCustom: false });
  const [customBoard, dispatchCustomBoard] = useReducer(customBoardReducer, { boardName: '', subject: '', isCustom: true });
  const [allBoards, dispatchAllBoards] = useReducer(allBoardsReducer, []);
  
  const [currentExam, dispatchCurrentExam] = useReducer(examReducer, { examName: '', subject: '', isCustom: false });
  const [customExam, dispatchCustomExam] = useReducer(customExamReducer, { examName: '', subject: '', isCustom: true });
  const [allExams, dispatchAllExams] = useReducer(allExamReducer, []);

  const [availability, dispatchAvailability] = useReducer(availabilityReducer, availabilityInitialState);

  const value = {
    personalInfo, setPersonalInfo,
    services, setServices, // Add services to context
    packages, setPackages, // Add packages to context
    isAgeConfirmed, setIsAgeConfirmed, 
    errors, setErrors,
    subCategory, dispatchSubCategory,
    teachingSubjects, dispatchTeachingSubjects,
    currentSubject, dispatchCurrentSubject,
    customSubject, dispatchCustomSubject,
    allSpecs, dispatchAllSpecs,
    currentSpec, dispatchCurrentSpec,
    customSpec, dispatchCustomSpec,
    currentBoard, dispatchCurrentBoard,
    customBoard, dispatchCustomBoard,
    allBoards, dispatchAllBoards,
    currentExam, dispatchCurrentExam,
    customExam, dispatchCustomExam,
    allExams, dispatchAllExams,
    availability, dispatchAvailability,
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
};
