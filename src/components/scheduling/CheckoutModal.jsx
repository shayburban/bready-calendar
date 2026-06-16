// Stage 5b — instant-booking checkout modal (R5–R10, §6 flow, §5d display).
//
// Renders the checkout state machine (via useCheckout) and REUSES the existing
// auth modals for the registration gate (R8) — no parallel auth pipeline. During
// the gate we render LoginModal/RegisterModal instead of the checkout dialog to
// avoid nesting two Radix dialogs; the hold + context are persisted just before
// the OAuth full-page redirect so they survive it (R6/R8).
//
// Dormant until a host wires a slot click to it behind instantBookingEnabled().

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';
import { STATES } from '@/lib/scheduling/checkout';
import { useCheckout } from '@/components/scheduling/useCheckout';

const fmtCountdown = (ms) => {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

// Display only (§5d / R-display) — the viewer's local zone. Full dual-zone
// (teacher + viewer side by side) lands in Stage 7; never feeds a comparison.
const fmtSlot = (startUtc, tz) => {
  try {
    return new Date(startUtc).toLocaleString(undefined, {
      timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return startUtc;
  }
};

const Centered = ({ icon, title, sub }) => (
  <div className="flex flex-col items-center text-center gap-3 py-8">
    {icon}
    <p className="text-lg font-semibold">{title}</p>
    {sub ? <p className="text-sm text-muted-foreground">{sub}</p> : null}
  </div>
);

export default function CheckoutModal({ open, slot, resumeCtx = null, currentStudentId = null, authReady = true, teacherTz, viewerTz, onClose }) {
  const { state, remainingMs, start, proceedToIdentity, persistForAuthHandoff, cancelAuth, rehold, abandon, resume } =
    useCheckout({ currentStudentId });
  const [authView, setAuthView] = useState('register');

  // Start a FRESH hold when opened with a slot — but never while resuming a
  // persisted checkout (that path restores the existing hold instead, R10/R6).
  useEffect(() => {
    if (open && slot && !resumeCtx && state.state === STATES.IDLE) start(slot);
  }, [open, slot, resumeCtx, state.state, start]);

  // Resume after the OAuth redirect once auth is known (R6/R8): restore the
  // persisted hold + slot and let the rebind/pay/commit effects carry it home.
  useEffect(() => {
    if (open && resumeCtx && authReady && state.state === STATES.IDLE) {
      resume({
        slot: resumeCtx.slot,
        hold: { id: resumeCtx.hold.id, expiresAt: Date.parse(resumeCtx.hold.expiresAt) },
        studentId: currentStudentId,
      });
    }
  }, [open, resumeCtx, authReady, currentStudentId, state.state, resume]);

  // Persist before the OAuth redirect so the hold survives the page reload (R6/R8).
  useEffect(() => {
    if (state.state === STATES.AUTHENTICATING) persistForAuthHandoff();
  }, [state.state, persistForAuthHandoff]);

  // Reset the gate view each time we re-enter authentication.
  useEffect(() => {
    if (state.state === STATES.AUTHENTICATING) setAuthView('register');
  }, [state.state]);

  const closeAll = () => { abandon(); onClose?.(); };

  // --- Registration gate (R8): reuse the platform auth modals as-is. ---
  if (open && state.state === STATES.AUTHENTICATING) {
    const onGateOpenChange = (isOpen) => { if (!isOpen) cancelAuth(); }; // dismiss → back to HELD
    return (
      <>
        <RegisterModal isOpen={authView === 'register'} onOpenChange={onGateOpenChange} onLoginOpen={() => setAuthView('login')} />
        <LoginModal isOpen={authView === 'login'} onOpenChange={onGateOpenChange} onRegisterOpen={() => setAuthView('register')} />
      </>
    );
  }

  const body = (() => {
    switch (state.state) {
      case STATES.HOLDING:
        return <Centered icon={<Loader2 className="h-8 w-8 animate-spin text-brand-blue" />} title="Reserving your time…" />;

      case STATES.HELD:
        return (
          <div className="space-y-5">
            <div className="rounded-lg border p-4 space-y-1">
              <p className="font-semibold">{slot?.subject || 'Lesson'}</p>
              <p className="text-sm">{fmtSlot(slot?.startUtc, viewerTz)} · {slot?.durationMinutes} min</p>
              <p className="text-xs text-muted-foreground">Your time{viewerTz ? ` · ${viewerTz}` : ''}</p>
              {teacherTz && teacherTz !== viewerTz ? <p className="text-xs text-muted-foreground">Teacher’s time: {fmtSlot(slot?.startUtc, teacherTz)} · {teacherTz}</p> : null}
              {slot?.amount != null ? <p className="text-sm font-medium">Total: {slot.amount}</p> : null}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Held for <span className="font-mono font-semibold text-foreground">{fmtCountdown(remainingMs)}</span>
            </div>
            {state.message ? <p className="text-sm text-red-600 text-center">{state.message}</p> : null}
            <Button className="w-full btn-pill-green" onClick={proceedToIdentity} disabled={!authReady}>
              {authReady ? 'Continue to book' : 'Loading…'}
            </Button>
          </div>
        );

      case STATES.REBINDING:
        return <Centered icon={<Loader2 className="h-8 w-8 animate-spin text-brand-blue" />} title="Confirming your account…" />;

      case STATES.PAYING:
        return <Centered icon={<Loader2 className="h-8 w-8 animate-spin text-brand-blue" />} title="Processing payment…" sub={`Slot held for ${fmtCountdown(remainingMs)}`} />;

      case STATES.COMMITTING:
        return <Centered icon={<Loader2 className="h-8 w-8 animate-spin text-brand-blue" />} title="Finalizing your booking…" />;

      case STATES.BOOKED:
        return (
          <div className="space-y-5">
            <Centered icon={<CheckCircle2 className="h-10 w-10 text-green-600" />} title="You're booked!" sub={`${slot?.subject || 'Lesson'} · ${fmtSlot(slot?.startUtc, viewerTz)}`} />
            <Button className="w-full btn-pill-green" onClick={() => onClose?.()}>Done</Button>
          </div>
        );

      case STATES.EXPIRED:
        return (
          <div className="space-y-5">
            <Centered icon={<AlertTriangle className="h-9 w-9 text-amber-500" />} title="Your hold expired" sub="No charge was made. You can grab the time again if it's still free." />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeAll}>Close</Button>
              <Button className="flex-1 btn-pill-green" onClick={rehold}>Try again</Button>
            </div>
          </div>
        );

      case STATES.FAILED:
        return (
          <div className="space-y-5">
            <Centered icon={<AlertTriangle className="h-9 w-9 text-red-500" />} title="Booking didn't complete" sub={state.message || 'Please try again.'} />
            <Button className="w-full" variant="outline" onClick={closeAll}>Close</Button>
          </div>
        );

      default:
        return null;
    }
  })();

  return (
    <Dialog open={!!open && state.state !== STATES.IDLE} onOpenChange={(isOpen) => { if (!isOpen) closeAll(); }}>
      <DialogContent className="max-w-md w-full p-8">
        <DialogHeader>
          <DialogTitle>Book your lesson</DialogTitle>
          <DialogDescription className="sr-only">Reserve and pay for your lesson slot.</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
