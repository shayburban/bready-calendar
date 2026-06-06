// Single source of truth for the Calendar Sidebar checkbox visual
// language. Imported by every sidebar surface that mounts a
// <Checkbox> from `@/components/ui/checkbox`:
//
//   • CalendarSidebar — Legend item, "No end date", weekday filter,
//     "Time Availability" toggle.
//   • CalendarNewBookingPanel — "Days of the week" checkboxes.
//   • CalendarTaskManagerPanel — title filter checkboxes.
//
// Anchored on the saikat reference (style.css `.checkCont/.checkmark`,
// lines ~235-243):
//   - 21-px white box (h-5/w-5, closest Tailwind step to the 21 px in
//     the saikat spec).
//   - 3-px rounded corner.
//   - 1-px #dfdfdf border, hover #737373.
//   - White background even when checked.
//   - Gray #757474 tick (the inner lucide Check is shrunk via
//     `[&_svg]:h-3.5 [&_svg]:w-3.5` so it matches the small saikat
//     tick instead of the default 16-px lucide icon).
//   - #0262c4 focus ring for keyboard accessibility.
//
// Restyling EVERY sidebar checkbox is now a one-line edit here.
export const SIDEBAR_CHECKBOX_CLASS =
  'peer h-5 w-5 shrink-0 rounded-[3px] border border-[#dfdfdf] bg-white hover:border-[#737373] ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0262c4] focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'data-[state=checked]:bg-white data-[state=checked]:text-[#757474] ' +
  '[&_svg]:h-3.5 [&_svg]:w-3.5';
