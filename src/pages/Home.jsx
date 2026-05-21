import React, { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import SubjectsSection from '../components/home/SubjectsSection';
import TrendingSection from '../components/home/TrendingSection';
import TeachersSection from '../components/home/TeachersSection';
import JourneySection from '../components/home/JourneySection';
import RequirementSection from '../components/home/RequirementSection';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';

export default function HomePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      let currentUser = null;
      try {
        currentUser = await User.me();
      } catch {
        currentUser = null;
      }
      if (cancelled) return;

      const admin = !!currentUser &&
        (currentUser.role === 'admin' || (currentUser.roles && currentUser.roles.includes('admin')));
      setIsAdmin(admin);

      // Right after a Google sign-in we land back here. Send admins straight
      // to the dashboard; everyone else just stays on the homepage. The flag
      // is set at login initiation so a browsing admin is never auto-routed.
      if (sessionStorage.getItem('bready_pending_login')) {
        sessionStorage.removeItem('bready_pending_login');
        if (admin) navigate(createPageUrl('AdminDashboard'));
      }
    };
    init();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div>
      {/* Temporary admin test buttons — only shown to admins (non-admins would
          just be bounced by the page guards). */}
      {isAdmin && (
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
      )}

      <HeroSection />
      <SubjectsSection />
      <TrendingSection />
      <TeachersSection />
      <JourneySection />
      <RequirementSection />
    </div>
  );
}
