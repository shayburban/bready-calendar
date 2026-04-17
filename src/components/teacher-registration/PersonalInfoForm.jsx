
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, BookOpen, Sparkles, GraduationCap, Briefcase, BookUser, Languages, MapPin, CheckCircle, Award, FileText } from 'lucide-react';

import ProfileForm from './personalinfo/ProfileForm';
import LanguageSelector from './LanguageSelector';
import SubjectSelector from './SubjectSelector';
import SpecializationSelector from './SpecializationSelector';
import CoursesExamsSelector from './CoursesExamsSelector';
import Education from './personalinfo/Education';
import TeachingExperience from './personalinfo/TeachingExperience';
import IndustryExperience from './personalinfo/IndustryExperience';
import ConfirmAge from './ConfirmAge';
import PendingDataDisplay from './approval/PendingDataDisplay';
import { useTeacher } from './TeacherContext'; // Corrected import path

// Updated AccordionItem signature as per outline.
// Note: isOpen and onToggle are now expected as props, meaning its state management is external.
const AccordionItem = ({ title, icon, children, isOpen, onToggle }) => {
  // This component definition is provided in the outline but not used in the current structure.
  // It's included to match the provided outline precisely.
  return (
    <div>
      <h3>{title}</h3>
      {icon}
      {isOpen && <div>{children}</div>}
    </div>
  );
};

const PersonalInfoForm = () => {
  const { personalInfo, setPersonalInfo } = useTeacher();
  const [languages, setLanguages] = React.useState(Array.isArray(personalInfo?.languages) ? personalInfo.languages : []);

  const handleLanguagesChange = React.useCallback((next) => {
    setLanguages(next);
    // Sync into TeacherContext
    if (setPersonalInfo && typeof setPersonalInfo === 'function') {
      setPersonalInfo(prev => ({ ...prev, languages: next }));
    }
  }, [setPersonalInfo]);

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <User className="w-5 h-5 mr-3 text-gray-800" />
                Profile Information
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ProfileForm />
        </CardContent>
      </Card>

      {/* Pending Data Display */}
      <PendingDataDisplay />

      {/* Languages Section */}
      <LanguageSelector 
        value={languages} 
        onChange={handleLanguagesChange}
      />

      {/* Teaching Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <BookOpen className="w-5 h-5 mr-3 text-gray-800" />
                Teaching Subjects
            </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
            Select the subjects you are proficient in teaching. This is a crucial part of your profile.
          </p>
          <SubjectSelector />
        </CardContent>
      </Card>

      {/* Specialization Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <Sparkles className="w-5 h-5 mr-3 text-gray-800" />
                Specializations
            </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
            Select your specialized areas of expertise. These help students find teachers with specific skills.
          </p>
          <SpecializationSelector />
        </CardContent>
      </Card>

      {/* Courses & Exams Section */}
      <CoursesExamsSelector />

      {/* Professional Info Section */}
       <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                    <Briefcase className="w-5 h-5 mr-3 text-gray-800" />
                    Professional Background
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="education" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                        <TabsTrigger value="education">
                            <GraduationCap className="w-4 h-4 mr-2" /> Education
                        </TabsTrigger>
                        <TabsTrigger value="teaching">
                            <BookUser className="w-4 h-4 mr-2" /> Teaching Experience
                        </TabsTrigger>
                        <TabsTrigger value="industry">
                            <Briefcase className="w-4 h-4 mr-2" /> Industry Experience
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="education" className="pt-6">
                        <Education />
                    </TabsContent>
                    <TabsContent value="teaching" className="pt-6">
                        <TeachingExperience />
                    </TabsContent>
                    <TabsContent value="industry" className="pt-6">
                        <IndustryExperience />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>

      {/* Final Checks Section - GSTInfo relocated here */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                <CheckCircle className="w-5 h-5 mr-3 text-gray-800" />
                Final Checks
            </CardTitle>
        </CardHeader>
        <CardContent>
            <ConfirmAge />
            
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalInfoForm;
