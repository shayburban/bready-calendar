// Centralized role/page options and live-preview loaders
import React from 'react';

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'guest', label: 'Guest' },
];

// Mark which pages can be dynamically loaded into the live preview.
export const PAGE_OPTIONS = [
  // Live-previewable pages (must have loader below)
  { value: 'Home',                label: 'Home Page',            previewable: true },
  { value: 'TeacherRegistration', label: 'Teacher Registration', previewable: true },
  { value: 'FindTutors',          label: 'Find Tutors',          previewable: true },
  { value: 'AdminDashboard',      label: 'Admin Dashboard',      previewable: true },
  { value: 'TeacherCalendar',     label: 'Teacher Calendar',     previewable: true },
  { value: 'MyProfile',           label: 'My Profile',           previewable: true },
  { value: 'PostRequirement',     label: 'Post Requirement',     previewable: true },
  { value: 'TeacherDashboard',    label: 'Teacher Dashboard',    previewable: true },
  { value: 'StudentDashboard',    label: 'Student Dashboard',    previewable: true },
  { value: 'LiveSession',         label: 'Live Session',         previewable: true },
  { value: 'BookingCalendar',     label: 'Booking Calendar',     previewable: true },

  // Non-live-previewable (still useful for static preview frames / mapping)
  { value: 'AdminSystemDesign',      label: 'Admin System Design',      previewable: false },
  { value: 'AdminRoleManagement',    label: 'Admin Role Management',    previewable: false },
  { value: 'AdminAnalytics',         label: 'Admin Analytics',          previewable: false },
  { value: 'AdminPricingManagement', label: 'Admin Pricing Management', previewable: false },
  { value: 'AllPagesGlobal',         label: 'All Pages (Global)',       previewable: false },
];

// Dynamic imports for live preview pages (keys must match previewable PAGE_OPTIONS values)
// CORRECTED PATHS: from /components/admin/design/constants -> ../../../pages/
export const PAGE_LOADERS = {
  Home:                () => import('../../../../pages/Home'),
  TeacherRegistration: () => import('../../../../pages/TeacherRegistration'),
  FindTutors:          () => import('../../../../pages/FindTutors'),
  AdminDashboard:      () => import('../../../../pages/AdminDashboard'),
  TeacherCalendar:     () => import('../../../../pages/TeacherCalendar'),
  MyProfile:           () => import('../../../../pages/MyProfile'),
  PostRequirement:     () => import('../../../../pages/PostRequirement'),
  TeacherDashboard:    () => import('../../../../pages/TeacherDashboard'),
  StudentDashboard:    () => import('../../../../pages/StudentDashboard'),
  LiveSession:         () => import('../../../../pages/LiveSession'),
  BookingCalendar:     () => import('../../../../pages/BookingCalendar'),
};