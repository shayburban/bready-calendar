import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Specializations({ specializations }) {
  const visibleSpecializations = specializations.slice(0, 5);
  const hiddenSpecializations = specializations.slice(5);

  return (
    <div>
      <h4 className="font-semibold text-sm mb-2">Specializations</h4>
      <div className="flex flex-wrap gap-2">
        {visibleSpecializations.map(spec => (
          <Badge key={spec} variant="outline" className="font-normal">{spec}</Badge>
        ))}
        {hiddenSpecializations.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge variant="secondary" className="cursor-pointer">+{hiddenSpecializations.length} more</Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {hiddenSpecializations.map(spec => (
                <DropdownMenuItem key={spec}>{spec}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}