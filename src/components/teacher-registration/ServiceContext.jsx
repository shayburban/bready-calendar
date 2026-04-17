
import React, { createContext, useContext } from 'react';

const ServiceContext = createContext();

// Mock data that would eventually come from an API
const mockData = {
  subjectCategories: [
    { id: 'cat-stem', name: 'STEM' },
    { id: 'cat-humanities', name: 'Humanities & Social Studies' },
    { id: 'cat-languages', name: 'Languages' },
    { id: 'cat-business', name: 'Business & Finance' },
    { id: 'cat-arts', name: 'Creative Arts & Design' },
    { id: 'cat-tech', name: 'Computer Science & Technology' },
    { id: 'cat-health', name: 'Health & Wellness' },
    { id: 'cat-test-prep', name: 'Test Preparation' },
  ],
  subjects: [
    { id: 1, subName: 'Mathematics', category: 'STEM', categoryId: 'cat-stem' },
    { id: 2, subName: 'Physics', category: 'STEM', categoryId: 'cat-stem' },
    { id: 3, subName: 'Chemistry', category: 'STEM', categoryId: 'cat-stem' },
    { id: 4, subName: 'Biology', category: 'STEM', categoryId: 'cat-stem' },
    { id: 5, subName: 'English', category: 'Languages', categoryId: 'cat-languages' },
    { id: 6, subName: 'Spanish', category: 'Languages', categoryId: 'cat-languages' },
    { id: 7, subName: 'French', category: 'Languages', categoryId: 'cat-languages' },
    { id: 8, subName: 'History', category: 'Social Studies', categoryId: 'cat-humanities' },
    { id: 9, subName: 'Geography', category: 'Social Studies', categoryId: 'cat-humanities' },
    { id: 10, subName: 'Computer Science', category: 'Technology', categoryId: 'cat-tech' },
    { id: 11, subName: 'Accounting', category: 'Business & Finance', categoryId: 'cat-business'},
    { id: 12, subName: 'Graphic Design', category: 'Creative Arts & Design', categoryId: 'cat-arts'}
  ],
  levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
  specializations: [
    { id: 1, spec: 'Organic Chemistry', subject: 'Chemistry' },
    { id: 2, spec: 'Inorganic Chemistry', subject: 'Chemistry' },
    { id: 3, spec: 'Physical Chemistry', subject: 'Chemistry' },
    { id: 4, spec: 'Analytical Chemistry', subject: 'Chemistry' },
    { id: 5, spec: 'Algebra', subject: 'Mathematics' },
    { id: 6, spec: 'Calculus', subject: 'Mathematics' },
    { id: 7, spec: 'Geometry', subject: 'Mathematics' },
    { id: 8, spec: 'Statistics', subject: 'Mathematics' },
  ],
  boards: [
    { id: 1, board: 'CBSE', subject: 'Mathematics' },
    { id: 2, board: 'CBSE', subject: 'Physics' },
    { id: 3, board: 'CBSE', subject: 'Chemistry' },
    { id: 4, board: 'ICSE', subject: 'Mathematics' },
    { id: 5, board: 'ICSE', subject: 'Physics' },
    { id: 6, board: 'ICSE', subject: 'Chemistry' },
    { id: 7, board: 'IB', subject: 'Mathematics' },
    { id: 8, board: 'IB', subject: 'Physics' },
    { id: 9, board: 'Cambridge', subject: 'Mathematics' },
    { id: 10, board: 'Cambridge', subject: 'Physics' },
  ],
  exams: [
    { id: 1, exam: 'JEE Main', subject: 'Mathematics' },
    { id: 2, exam: 'JEE Main', subject: 'Physics' },
    { id: 3, exam: 'JEE Main', subject: 'Chemistry' },
    { id: 4, exam: 'JEE Advanced', subject: 'Mathematics' },
    { id: 5, exam: 'JEE Advanced', subject: 'Physics' },
    { id: 6, exam: 'JEE Advanced', subject: 'Chemistry' },
    { id: 7, exam: 'NEET', subject: 'Physics' },
    { id: 8, exam: 'NEET', subject: 'Chemistry' },
    { id: 9, exam: 'NEET', subject: 'Biology' },
    { id: 10, exam: 'SAT', subject: 'Mathematics' },
  ],
  languages: [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Mandarin', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian'
  ],
  proficiencyLevels: ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Beginner']
};

export const ServiceProvider = ({ children }) => {
  return (
    <ServiceContext.Provider value={mockData}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useService = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
};
