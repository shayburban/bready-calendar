import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function GlobalAdminBanner() {
  const [bannerState, setBannerState] = useState({
    visible: false,
    mode: null,
    target: ''
  });

  useEffect(() => {
    const checkBannerState = () => {
      const roleViewData = localStorage.getItem('adminViewAsMode');
      const impersonationData = localStorage.getItem('adminImpersonation');

      if (impersonationData) {
        const parsed = JSON.parse(impersonationData);
        if (parsed.active) {
          setBannerState({
            visible: true,
            mode: 'impersonation',
            target: parsed.targetUserEmail || parsed.targetUserId
          });
          return;
        }
      }
      
      if (roleViewData) {
        const parsed = JSON.parse(roleViewData);
        if (parsed.active) {
          setBannerState({
            visible: true,
            mode: 'role',
            target: parsed.role
          });
          return;
        }
      }
      
      setBannerState({
        visible: false,
        mode: null,
        target: ''
      });
    };

    checkBannerState();
    window.addEventListener('storage', checkBannerState);
    
    // Custom event listener for banner state changes
    window.addEventListener('adminBannerStateChange', checkBannerState);
    
    return () => {
      window.removeEventListener('storage', checkBannerState);
      window.removeEventListener('adminBannerStateChange', checkBannerState);
    };
  }, []);

  const handleExitViewMode = () => {
    localStorage.removeItem('adminViewAsMode');
    localStorage.removeItem('adminImpersonation');
    
    // Trigger custom event to update banner state
    window.dispatchEvent(new CustomEvent('adminBannerStateChange'));
    
    // Reload to ensure all components reset their state
    window.location.reload();
  };

  if (!bannerState.visible) {
    return null;
  }

  const bannerText = bannerState.mode === 'role'
    ? `Admin View Mode Active - Viewing as ${bannerState.target}`
    : `Admin Impersonation Active - Viewing as ${bannerState.target}`;

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-orange-500 text-white p-2 text-center flex items-center justify-center shadow-lg"
      style={{ 
        zIndex: 9999,
        height: '40px'
      }}
    >
      <AlertTriangle className="w-5 h-5 mr-3" />
      <span className="font-semibold">{bannerText}</span>
      <Button
        variant="link"
        className="text-white hover:text-orange-100 font-bold ml-4 underline"
        onClick={handleExitViewMode}
      >
        Exit View Mode
      </Button>
    </div>
  );
}