import React from 'react';

const ExperienceItem = ({ label, value, unit }) => (
    <div className="text-center">
        <p className="font-bold text-lg text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xs text-gray-500">{unit}</p>
    </div>
);

const CancellationPolicyBox = ({ cancellation }) => (
    <div className="bg-gray-50 border rounded-md p-2 text-center text-xs">
        <p className="font-bold text-gray-700">{cancellation.percentage}% Fee</p>
        <p className="text-gray-500">For cancellation within</p>
        <p className="text-gray-600 font-semibold">{cancellation.days} days {cancellation.hours} hours</p>
    </div>
);

export default function ExperienceAndPolicy({ experience, cancellation }) {
  return (
    <div className="h-full flex flex-col justify-end space-y-4">
        <div className="grid grid-cols-3 gap-2 border rounded-md p-2">
            <ExperienceItem label="Online" value={experience.online} unit="Years" />
            <ExperienceItem label="Offline" value={experience.offline} unit="Years" />
            <ExperienceItem label="Industry" value={experience.industry} unit="Years" />
        </div>
        <CancellationPolicyBox cancellation={cancellation} />
    </div>
  );
}