// Single source of truth for the admin "perspective" (a.k.a. view-as) and the
// optional sample-data toggle.
//
// PERSPECTIVE ("wearing a hat"): a REAL admin can put on another role's hat
// (teacher / student / guest) WITHOUT losing admin. User.me() swaps the
// EFFECTIVE role while keeping the admin's own id/email
// (see base44Client.applyAdminPerspective). Returning to admin just clears the
// key. Only an actual admin is ever affected — a non-admin setting these keys
// changes nothing, because the swap is gated on the real role being 'admin'.
//
// SAMPLE DATA: an independent, default-OFF toggle. When ON, demo-capable pages
// (Statistics, Task Manager) show clearly-labelled sample data instead of the
// real account data. It does NOT change the perspective and is never on by
// default — you always start on your real data.
//
// Consumers: base44Client (User.me), GlobalAdminBanner, AdminHeader,
// AdminDashboard, and the Teacher Statistics / Tasks data hooks.

const VIEW_AS_KEY = 'adminViewAsMode';
const IMPERSONATION_KEY = 'adminImpersonation';
const SAMPLE_KEY = 'breadyShowSampleData';

// Roles a perspective can switch INTO. 'admin' is the home role (cleared state),
// never a "view-as" target.
export const SWITCHABLE_ROLES = ['teacher', 'student', 'guest'];
const SWITCHABLE = new Set(SWITCHABLE_ROLES);

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Broadcast so the banner / header / Layout re-read state without a full reload
// when that is enough; callers that need every page to re-resolve User.me()
// (i.e. switching role) navigate + reload explicitly.
const notify = () => {
  try {
    window.dispatchEvent(new CustomEvent('adminBannerStateChange'));
  } catch {
    /* no window (tests) */
  }
};

// The active perspective role, or null when in plain admin mode.
export function getViewAsRole() {
  try {
    const p = safeParse(localStorage.getItem(VIEW_AS_KEY));
    return p && p.active && SWITCHABLE.has(p.role) ? p.role : null;
  } catch {
    return null;
  }
}

// Enter a perspective (teacher | student | guest). adminId is audit metadata only.
export function setViewAsRole(role, adminId = null) {
  if (!SWITCHABLE.has(role)) return;
  try {
    localStorage.setItem(VIEW_AS_KEY, JSON.stringify({ active: true, role, adminId }));
    // Perspective and impersonation are mutually exclusive — never both at once.
    localStorage.removeItem(IMPERSONATION_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

// Return to plain admin (clears both perspective and impersonation).
export function clearPerspective() {
  try {
    localStorage.removeItem(VIEW_AS_KEY);
    localStorage.removeItem(IMPERSONATION_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

export function isSampleData() {
  try {
    return localStorage.getItem(SAMPLE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSampleData(on) {
  try {
    if (on) localStorage.setItem(SAMPLE_KEY, '1');
    else localStorage.removeItem(SAMPLE_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

// The landing page for a given role.
export function homePathForRole(role) {
  switch (role) {
    case 'teacher':
      return '/TeacherDashboard';
    case 'student':
      return '/StudentDashboard';
    case 'admin':
      return '/AdminDashboard';
    default:
      return '/Home';
  }
}
