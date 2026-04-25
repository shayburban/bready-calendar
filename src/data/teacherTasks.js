// Shared "database" for teacher tasks.
// Both the Task Manager page (TeacherTasks.jsx) and the compact Task Manager
// panel inside the Teacher Calendar sidebar read from (and mutate) this module,
// so edits made in one place show up in the other until a real backend
// entity replaces it.

export const TITLE_OPTIONS = [
  { id: 'booked', label: 'Booked', color: 'bg-orange-400' },
  { id: 'not-reviewed', label: 'Not Reviewed', color: 'bg-red-500' },
  { id: 'availability', label: 'Availability', color: 'bg-green-500' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-600' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
  { id: 'synced', label: 'Synced Calendar Events', color: 'bg-blue-500' },
  { id: 'waiting', label: 'Waiting For Confirmation', color: 'bg-amber-300' },
];

export const OUTER_TABS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'student', label: 'As A Student (S)' },
  { value: 'teacher', label: 'As A Teacher (T)' },
];

export const TODO_ROWS = {
  all: [
    { id: 't1', name: 'Aman R.', type: 'Booked(T)', typeColor: 'bg-orange-400', date: '19.07.2021', time: '15:00 - 16:00', service: 'Online Classes', referred: true, duration: '3 Hours', rate: '10 $', total: '10 $ * 3 Hr = 30 $', deposited: true, subject: 'Maths', perspective: 'T', oldRate: '5 $ for 1 Hr. till 03.08.2021' },
    { id: 't2', name: 'Aman R.', type: 'Booked(T)', typeColor: 'bg-orange-400', date: '19.07.2021', time: '15:00 - 16:00', service: 'Online Classes', referred: false, duration: '3 Hours', rate: '10 $', total: '10 $ * 3 Hr = 30 $', deposited: false, subject: 'Maths', perspective: 'T', oldRate: '5 $ for 1 Hr. till 03.08.2021' },
    { id: 't3', name: 'Aman R.', type: 'Booked(T)', typeColor: 'bg-orange-400', date: '19.07.2021', time: '15:00 - 16:00', service: 'Online Classes', referred: true, duration: '3 Hours', rate: '10 $', total: '10 $ * 3 Hr = 30 $', deposited: true, subject: 'Maths', perspective: 'T', oldRate: '5 $ for 1 Hr. till 03.08.2021' },
    { id: 't4', name: 'Alice K.', type: 'Waiting For Confirmation', typeColor: 'bg-amber-300', date: '18.08.2021', time: '10:00 – 11:00', service: 'In-Person', referred: true, duration: '1 Hour', rate: '20 $', total: '1 * 20 $ = 20 $', deposited: false, subject: '', perspective: 'T', oldRate: '' },
  ],
  teacher: [
    { id: 't1', name: 'Aman R.', type: 'Booked(T)', typeColor: 'bg-orange-400', date: '19.07.2021', time: '15:00 - 16:00', service: 'Online Classes', referred: true, duration: '3 Hours', rate: '10 $', total: '10 $ * 3 Hr = 30 $', deposited: true, subject: 'Maths', perspective: 'T', oldRate: '5 $ for 1 Hr. till 03.08.2021' },
    { id: 't5', name: 'Sarah M.', type: 'Availability', typeColor: 'bg-green-500', date: '20.08.2021', time: '08:00 – 12:00', service: 'Online Classes', referred: true, duration: '4 Hours', rate: '10 $', total: '4 * 10 $ = 40 $', deposited: false, subject: '', perspective: 'T', oldRate: '' },
  ],
  student: [
    { id: 't6', name: 'John Doe', type: 'Booked(S)', typeColor: 'bg-orange-400', date: '16.08.2021', time: '09:00 – 14:00', service: 'Online Classes', referred: false, duration: '5 Hours', rate: '10 $', total: '5 * 10 $ = 50 $', deposited: false, subject: '', perspective: 'S', oldRate: '' },
  ],
};

export const DONE_ROWS = {
  all: [
    { id: 'd1', name: 'John Doe', type: 'Completed', typeColor: 'bg-emerald-600', date: '10.08.2021', time: '09:00 – 14:00', service: 'Online Classes', referred: true, duration: '5 Hours', rate: '10 $', total: '5 * 10 $ = 50 $', deposited: true, subject: 'Maths', perspective: 'T', oldRate: '' },
    { id: 'd2', name: 'John Doe', type: 'Cancelled', typeColor: 'bg-gray-500', date: '08.08.2021', time: '09:00 – 14:00', service: 'Online Classes', referred: false, duration: '5 Hours', rate: '10 $', total: '5 * 10 $ = 50 $', deposited: false, subject: '', perspective: 'T', oldRate: '' },
  ],
  teacher: [
    { id: 'd3', name: 'Maria L.', type: 'Completed', typeColor: 'bg-emerald-600', date: '05.08.2021', time: '16:00 – 17:00', service: 'In-Person', referred: true, duration: '1 Hour', rate: '25 $', total: '1 * 25 $ = 25 $', deposited: true, subject: '', perspective: 'T', oldRate: '' },
  ],
  student: [
    { id: 'd4', name: 'John Doe', type: 'Completed', typeColor: 'bg-emerald-600', date: '02.08.2021', time: '18:00 – 20:00', service: 'Online Classes', referred: false, duration: '2 Hours', rate: '15 $', total: '2 * 15 $ = 30 $', deposited: true, subject: '', perspective: 'S', oldRate: '' },
  ],
};

const listeners = new Set();
let version = 0;

export function subscribeTeacherTasks(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTeacherTasksVersion() {
  return version;
}

function notify() {
  version += 1;
  listeners.forEach((l) => {
    try {
      l();
    } catch (err) {
      console.error('teacherTasks listener error', err);
    }
  });
}

function findBucket(id) {
  for (const bucket of [TODO_ROWS, DONE_ROWS]) {
    for (const tab of Object.keys(bucket)) {
      const idx = bucket[tab].findIndex((r) => r.id === id);
      if (idx !== -1) return { bucket, tab, idx };
    }
  }
  return null;
}

export function updateTeacherTask(id, patch) {
  const updates = [];
  for (const bucket of [TODO_ROWS, DONE_ROWS]) {
    for (const tab of Object.keys(bucket)) {
      const idx = bucket[tab].findIndex((r) => r.id === id);
      if (idx !== -1) {
        bucket[tab][idx] = { ...bucket[tab][idx], ...patch };
        updates.push(true);
      }
    }
  }
  if (updates.length) notify();
}

export function deleteTeacherTask(id) {
  let removed = false;
  for (const bucket of [TODO_ROWS, DONE_ROWS]) {
    for (const tab of Object.keys(bucket)) {
      const idx = bucket[tab].findIndex((r) => r.id === id);
      if (idx !== -1) {
        bucket[tab].splice(idx, 1);
        removed = true;
      }
    }
  }
  if (removed) notify();
}
