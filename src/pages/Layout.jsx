

import React, { useState, useEffect } from 'react';
import { AppRole } from '@/api/entities';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import GlobalAdminBanner from './components/common/GlobalAdminBanner';
import { cssVariables } from './components/design-system/Colors';

export default function Layout({ children, currentPageName }) {
  const [bannerActive, setBannerActive] = useState(false);

  useEffect(() => {
    const checkBannerState = () => {
      const roleViewData = localStorage.getItem('adminViewAsMode');
      const impersonationData = localStorage.getItem('adminImpersonation');

      const hasRoleView = roleViewData && JSON.parse(roleViewData).active;
      const hasImpersonation = impersonationData && JSON.parse(impersonationData).active;
      
      setBannerActive(hasRoleView || hasImpersonation);
    };

    checkBannerState();
    window.addEventListener('storage', checkBannerState);
    window.addEventListener('adminBannerStateChange', checkBannerState);
    
    return () => {
      window.removeEventListener('storage', checkBannerState);
      window.removeEventListener('adminBannerStateChange', checkBannerState);
    };
  }, []);

  // Essential Role Seeding System
  useEffect(() => {
    const ensureEssentialRoles = async () => {
      try {
        const existingRoles = await AppRole.list();
        
        // Define essential roles that must exist for the application to function properly
        const requiredRoles = [
          // Internal Roles
          { 
            role_id: 'admin', 
            display_name: 'Administrator', 
            abbreviation_code: 'A', 
            is_primary_role: true, 
            usageContext: 'internal',
            description: 'System administrator with full access'
          },
          { 
            role_id: 'teacher', 
            display_name: 'Teacher', 
            abbreviation_code: 'T', 
            is_primary_role: true, 
            usageContext: 'internal',
            description: 'Teaching professional on the platform'
          },
          { 
            role_id: 'teacher-t', 
            display_name: 'As A Teacher', 
            abbreviation_code: 'T', 
            is_primary_role: false, 
            parent_role_id: 'teacher', 
            usageContext: 'internal',
            description: 'Teacher perspective view'
          },
          { 
            role_id: 'student-s', 
            display_name: 'As A Student', 
            abbreviation_code: 'S', 
            is_primary_role: false, 
            parent_role_id: 'teacher', 
            usageContext: 'internal',
            description: 'Student perspective for teachers'
          },
          { 
            role_id: 'student', 
            display_name: 'Student', 
            abbreviation_code: 'S', 
            is_primary_role: true, 
            usageContext: 'internal',
            description: 'Student learning on the platform'
          },
          // External Roles
          { 
            role_id: 'guest', 
            display_name: 'Guest', 
            abbreviation_code: 'G', 
            is_primary_role: true, 
            usageContext: 'external',
            description: 'External guest user with limited access'
          },
          // Hospital Organization Roles - Updated with specific data as requested
          { 
            role_id: 'hospital-doctor', 
            display_name: 'Doctor', 
            abbreviation_code: 'D', 
            is_primary_role: true, 
            usageContext: 'external',
            organization_group: 'Hospital',
            description: 'Medical professional in Hospital organization'
          },
          { 
            role_id: 'hospital-specialist-doctor', 
            display_name: 'As A Specialist Doctor', 
            abbreviation_code: 'SD', 
            is_primary_role: false, 
            parent_role_id: 'hospital-doctor', 
            usageContext: 'external',
            organization_group: 'Hospital',
            description: 'Specialist Doctor perspective for Hospital doctors'
          },
          { 
            role_id: 'hospital-doctor-as-patient', 
            display_name: 'As A Patient', 
            abbreviation_code: 'P', 
            is_primary_role: false, 
            parent_role_id: 'hospital-doctor', 
            usageContext: 'external',
            organization_group: 'Hospital',
            description: 'Patient perspective for Hospital doctors'
          },
          { 
            role_id: 'hospital-patient', 
            display_name: 'Patient', 
            abbreviation_code: 'P', 
            is_primary_role: true, 
            usageContext: 'external',
            organization_group: 'Hospital',
            description: 'Patient in Hospital organization (no child perspectives for now)'
          }
        ];

        // Check and create missing essential roles
        let seededCount = 0;
        for (const requiredRole of requiredRoles) {
          const found = existingRoles.some(r => r.role_id === requiredRole.role_id);
          if (!found) {
            try {
              await AppRole.create(requiredRole);
              console.log(`✅ Seeded essential role: ${requiredRole.display_name} (${requiredRole.role_id})`);
              seededCount++;
            } catch (error) {
              console.warn(`⚠️ Failed to seed role ${requiredRole.role_id}:`, error);
            }
          }
        }

        if (seededCount > 0) {
          console.log(`🌱 Successfully seeded ${seededCount} essential roles for application stability`);
        } else {
          console.log('✅ All essential roles already exist - application ready');
        }

      } catch (error) {
        console.warn('⚠️ Could not verify essential roles:', error);
        // Don't break the application if seeding fails
      }
    };

    // Run the seeding check
    ensureEssentialRoles();
  }, []); // Empty dependency array - runs once on app start

  // Define constants for header heights
  const HEADER_HEIGHT_DESKTOP = '80px';
  const HEADER_HEIGHT_MOBILE = '70px';
  const BANNER_HEIGHT = '40px';
  
  // Calculate offsets
  const bannerOffset = bannerActive ? BANNER_HEIGHT : '0px';
  const totalMainPadding = bannerActive 
    ? `calc(${HEADER_HEIGHT_DESKTOP} + ${BANNER_HEIGHT})` 
    : HEADER_HEIGHT_DESKTOP;

  const isTeacherRegistrationPage = currentPageName === 'TeacherRegistration';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans" style={{ color: 'var(--color-text-default)' }}>
       <style jsx global>{`
        :root {
          ${Object.entries(cssVariables).map(([key, value]) => `${key}: ${value};`).join('\n          ')}
        }
       `}</style>
      
      {/* Global Admin Banner - renders independently */}
      <GlobalAdminBanner />

      <Header topOffset={bannerOffset} />
      <main 
        className="flex-grow"
        style={{ 
          paddingTop: totalMainPadding
        }}
      >
        {/* Responsive padding for mobile */}
        <style jsx>{`
          @media (max-width: 767px) {
            main {
              padding-top: ${bannerActive ? `calc(${HEADER_HEIGHT_MOBILE} + ${BANNER_HEIGHT})` : HEADER_HEIGHT_MOBILE} !important;
            }
          }
        `}</style>
        {children}
      </main>
      <Footer isTeacherRegistrationPage={isTeacherRegistrationPage} />
    </div>
  );
}

