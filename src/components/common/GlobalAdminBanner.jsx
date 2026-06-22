import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import {
  getViewAsRole,
  setViewAsRole,
  clearPerspective,
  isSampleData,
  setSampleData,
  homePathForRole,
  SWITCHABLE_ROLES,
} from '@/lib/perspective';

// Shown whenever a real admin is "wearing a hat" (view-as a teacher/student/
// guest) or impersonating a specific user. It is the universal, always-visible
// control to SWITCH perspective, toggle sample data, and RETURN TO ADMIN — so
// the admin can never get stuck in another role.
export default function GlobalAdminBanner() {
  const [bannerState, setBannerState] = useState({ visible: false, mode: null, target: '' });
  const [sample, setSample] = useState(false);

  useEffect(() => {
    const checkBannerState = () => {
      let impersonationRaw = null;
      try {
        impersonationRaw = localStorage.getItem('adminImpersonation');
      } catch {
        /* storage unavailable (private mode / sandboxed iframe) */
      }
      if (impersonationRaw) {
        try {
          const parsed = JSON.parse(impersonationRaw);
          if (parsed.active) {
            setBannerState({ visible: true, mode: 'impersonation', target: parsed.targetUserEmail || parsed.targetUserId });
            setSample(isSampleData());
            return;
          }
        } catch {
          /* ignore malformed */
        }
      }

      const role = getViewAsRole();
      if (role) {
        setBannerState({ visible: true, mode: 'role', target: role });
        setSample(isSampleData());
        return;
      }

      setBannerState({ visible: false, mode: null, target: '' });
      setSample(isSampleData());
    };

    checkBannerState();
    window.addEventListener('storage', checkBannerState);
    window.addEventListener('adminBannerStateChange', checkBannerState);
    return () => {
      window.removeEventListener('storage', checkBannerState);
      window.removeEventListener('adminBannerStateChange', checkBannerState);
    };
  }, []);

  // Return to plain admin — always available so a perspective is never a trap.
  const handleReturnToAdmin = () => {
    clearPerspective();
    window.location.href = '/AdminDashboard';
  };

  // Switch directly between perspectives without going back to admin first.
  const handleSwitchRole = (role) => {
    setViewAsRole(role);
    window.location.href = homePathForRole(role);
  };

  // Toggle sample data; reload so every data hook re-reads the flag.
  const handleToggleSample = (e) => {
    const on = e.target.checked;
    setSampleData(on);
    setSample(on);
    window.location.reload();
  };

  if (!bannerState.visible) {
    return null;
  }

  const label =
    bannerState.mode === 'role'
      ? `Viewing as ${bannerState.target}`
      : `Impersonating ${bannerState.target}`;

  return (
    <div
      className="fixed top-0 left-0 right-0 bg-orange-500 text-white px-3 flex items-center justify-center gap-3 shadow-lg overflow-x-auto"
      style={{ zIndex: 9999, height: '40px' }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <span className="font-semibold whitespace-nowrap">{label}</span>

      {/* Quick-switch chips (role perspective only) */}
      {bannerState.mode === 'role' && (
        <span className="flex items-center gap-1">
          {SWITCHABLE_ROLES.filter((r) => r !== bannerState.target).map((r) => (
            <button
              key={r}
              onClick={() => handleSwitchRole(r)}
              className="text-xs capitalize bg-orange-600 hover:bg-orange-700 rounded-full px-2 py-0.5 font-medium whitespace-nowrap"
            >
              View as {r}
            </button>
          ))}
        </span>
      )}

      {/* Optional sample data (default off) */}
      <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
        <input type="checkbox" checked={sample} onChange={handleToggleSample} className="accent-white" />
        Sample data
      </label>

      <Button
        variant="link"
        className="text-white hover:text-orange-100 font-bold underline whitespace-nowrap px-1"
        onClick={handleReturnToAdmin}
      >
        Return to Admin
      </Button>
    </div>
  );
}
