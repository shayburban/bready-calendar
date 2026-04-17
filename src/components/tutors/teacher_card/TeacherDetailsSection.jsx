import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const SpecializationsRow = ({ specializations }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const firstRowLimit = 3;
  const secondRowLimit = 2;

  const firstRowSpecs = specializations.slice(0, firstRowLimit);
  const remainingSpecs = specializations.slice(firstRowLimit);
  const secondRowSpecs = remainingSpecs.slice(0, secondRowLimit);
  const overflowSpecs = remainingSpecs.slice(secondRowLimit);

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Specializations</h3>
      <div className="flex gap-2 mb-3">
        {firstRowSpecs.map((spec, index) => (
          <button key={index} type="button" className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs whitespace-nowrap border-none">{spec}</button>
        ))}
      </div>
      {remainingSpecs.length > 0 && (
        <div className="flex gap-2">
          {secondRowSpecs.map((spec, index) => (
            <button key={index} type="button" className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs whitespace-nowrap border-none">{spec}</button>
          ))}
          {overflowSpecs.length > 0 && (
            <div onMouseEnter={() => setIsMenuOpen(true)} onMouseLeave={() => setIsMenuOpen(false)}>
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <button type="button" className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs whitespace-nowrap border-none flex items-center gap-1">
                            +{overflowSpecs.length} More <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={5}>
                        {overflowSpecs.map((spec, index) => (
                        <DropdownMenuItem key={index}><span className="text-sm">{spec}</span></DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExperienceRow = ({ experience }) => (
  <div className="mb-8">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Experience</h4>
    <div className="flex text-center">
      <div className="flex-1 flex flex-col items-center">
        <span className="text-sm font-medium">{experience.online}yr</span>
        <span className="text-xs text-gray-500">Online</span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-sm font-medium">{experience.offline}yr</span>
        <span className="text-xs text-gray-500">Offline</span>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <span className="text-sm font-medium">{experience.industry}yr</span>
        <span className="text-xs text-gray-500">Industry</span>
      </div>
    </div>
  </div>
);

const CancellationPolicyRow = ({ cancellation }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-700 mb-2">Cancellation Policy</h4>
    <div className="text-sm" style={{ color: '#3d3d3d', fontWeight: 400 }}>
      <span>
        {cancellation.percentage}%, Free Before {cancellation.days} days and {cancellation.hours} hours
      </span>
    </div>
  </div>
);

export default function TeacherDetailsSection({ teacher }) { 
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <SpecializationsRow specializations={teacher.specializations} />
            <ExperienceRow experience={teacher.experience} />
            <CancellationPolicyRow cancellation={teacher.cancellation} />
        </div>
    );
}