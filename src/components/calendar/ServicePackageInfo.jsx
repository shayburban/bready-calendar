import React from 'react';

// Shared single-service / package line for the calendar popup cards (Task 3).
// Replaces the old hardcoded multi-service list (Online Classes / Consulting /
// Technical Interview / Packages …). Shows ONLY the one service the student/teacher
// selected; if it's part of a package, the remaining balance is noted alongside it.
//
// TODO: This is currently hardcoded mock data. Needs to be wired to the live
// database to display only the single specific service/package selected by the
// student/teacher (and, when it is part of a package, the remaining "X Hrs. left
// on this package" balance). Pass the real value in via the `service` prop.
const MOCK_SERVICE = {
  name: 'Online Classes',
  price: '10 $ for 1 Hr.',
  packageNote: '4 Hrs. left on this package',
};

export default function ServicePackageInfo({ service = MOCK_SERVICE, className = '' }) {
  if (!service) return null;
  return (
    <div className={`text-xs space-y-1 mb-4 opacity-75 ${className}`}>
      <p>
        <span className="font-bold">{service.name}:</span> {service.price}
        {service.packageNote ? <span> · {service.packageNote}</span> : null}
      </p>
    </div>
  );
}
