import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Star } from 'lucide-react';

const StarRating = ({ rating, count }) => (
  <div className="flex items-center">
    <p className="text-sm font-bold mr-1">{rating.toFixed(1)}</p>
    <div className="flex items-center text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-current' : ''}`} />
      ))}
    </div>
    <p className="text-sm text-gray-500 ml-2">({count})</p>
  </div>
);

export default function TeacherProfilePreview({ teacher }) {
  return (
    <div className="flex items-start">
      <div className="mr-3 relative shrink-0">
        <a href="#">
          <img src={teacher.profileImage} alt={teacher.name} className="w-16 h-16 rounded-full shadow border-2 border-white"/>
        </a>
        <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" title="Online"></div>
      </div>
      <div className="flex-1">
        <div className="flex items-center">
          <h4 className="font-bold text-lg"><a href="#">{teacher.name}</a></h4>
          <span className="ml-2 cursor-pointer bg-blue-100 text-blue-800 rounded-full w-4 h-4 flex items-center justify-center text-xs font-serif italic" title={teacher.bio}>i</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <a href="#" className="flex items-center text-sm text-gray-700 my-1">
              <img src={teacher.subjects[0].icon} alt="" className="w-4 h-4 mr-2" />
              {teacher.subjects[0].name}
              <ChevronDown className="w-4 h-4 ml-1" />
            </a>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {teacher.subjects.map(sub => (
              <DropdownMenuItem key={sub.name}>
                <img src={sub.icon} alt={sub.name} className="w-4 h-4 mr-2" />
                {sub.name} ({sub.level})
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <StarRating rating={teacher.rating} count={teacher.reviews} />
        {teacher.tag && <h3 className="text-sm font-semibold text-blue-600 mt-1">{teacher.tag}</h3>}
      </div>
    </div>
  );
}