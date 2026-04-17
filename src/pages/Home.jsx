import React from 'react';
import HeroSection from '../components/home/HeroSection';
import SubjectsSection from '../components/home/SubjectsSection';
import TrendingSection from '../components/home/TrendingSection';
import TeachersSection from '../components/home/TeachersSection';
import JourneySection from '../components/home/JourneySection';
import RequirementSection from '../components/home/RequirementSection';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HomePage() {
  return (
    <div>
      {/* Temporary Admin Dashboard Access Button - Keep only admin access for testing */}
      <div style={{ 
        position: 'fixed', 
        top: '100px', 
        right: '20px', 
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <Link to={createPageUrl('AdminDashboard')}>
          <Button 
            variant="destructive" 
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg"
          >
            🔒 Admin Dashboard
          </Button>
        </Link>
        {/* --- TEMPORARY TEST BUTTON --- */}
        <Link to={createPageUrl('TeacherCalendar')}>
          <Button 
            variant="default" 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg w-full"
          >
            📅 Teacher Calendar
          </Button>
        </Link>
      </div>
      
      <HeroSection />
      <SubjectsSection />
      <TrendingSection />
      <TeachersSection />
      <JourneySection />
      <RequirementSection />
    </div>
  );
}