// Stage 5b — global checkout-resume host (R6/R8).
//
// The reused auth flow signs in via an OAuth full-page redirect back to the
// site root, so a guest who registered mid-checkout can land on ANY page. This
// host — mounted once in Layout behind instantBookingEnabled() — picks up a
// checkout persisted before the redirect and drives it home (rebind→pay→commit).
// It is completely inert (renders null, makes no calls) when there is nothing
// pending, so it adds no cost to normal navigation.

import { useEffect, useState } from 'react';
import { loadCheckout } from '@/lib/scheduling/checkoutStorage';
import { User } from '@/api/entities';
import CheckoutModal from '@/components/scheduling/CheckoutModal';

export default function CheckoutResumeHost() {
  const [resumeCtx, setResumeCtx] = useState(() => loadCheckout());
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!resumeCtx) return undefined; // nothing to resume — stay inert
    let alive = true;
    (async () => {
      try { const u = await User.me(); if (alive) setCurrentStudentId(u?.id || null); }
      catch { if (alive) setCurrentStudentId(null); }
      finally { if (alive) setAuthReady(true); }
    })();
    return () => { alive = false; };
  }, [resumeCtx]);

  if (!resumeCtx) return null;

  return (
    <CheckoutModal
      open
      slot={resumeCtx.slot}
      resumeCtx={resumeCtx}
      currentStudentId={currentStudentId}
      authReady={authReady}
      onClose={() => setResumeCtx(null)}
    />
  );
}
