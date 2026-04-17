import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import TeacherProfileSection from './teacher_card/TeacherProfileSection';
import TeacherDetailsSection from './teacher_card/TeacherDetailsSection';
import TeacherBookingSection from './teacher_card/TeacherBookingSection';
import AvailabilityPanel from './teacher_card/AvailabilityPanel';

export default function TeacherListCard({ teacher, isHovered, onHover, onLeave, showAvailability }) {
  const [expandedDescription, setExpandedDescription] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
      onMouseEnter={() => onHover(teacher.id)}
      onMouseLeave={onLeave}
      style={{ width: '977px', margin: '18px' }}
    >
      <Card 
        className="overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200" 
        style={{ 
          width: '977px', 
          height: expandedDescription ? 'auto' : '337px', 
          minHeight: '337px' 
        }}
      >
        <div className="flex h-full">
          {/* Column 1 - Profile Info (33.33%) */}
          <div 
            className="flex-none overflow-hidden" 
            style={{ width: '33.33%', padding: '16px' }}
          >
            <TeacherProfileSection 
              teacher={teacher}
              expandedDescription={expandedDescription}
              onToggleDescription={() => setExpandedDescription(!expandedDescription)}
            />
          </div>

          {/* Column border 1 - shortened */}
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: '1px' }}>
            <div className="w-px bg-gray-200" style={{ height: 'calc(100% - 40px)' }}></div>
          </div>

          {/* Column 2 - Details (41.67%) */}
          <div 
            className="flex-none overflow-hidden" 
            style={{ width: '41.67%', padding: '16px' }}
          >
            <TeacherDetailsSection teacher={teacher} />
          </div>

          {/* Column border 2 - shortened */}
          <div className="flex items-center justify-center flex-shrink-0" style={{ width: '1px' }}>
            <div className="w-px bg-gray-200" style={{ height: 'calc(100% - 40px)' }}></div>
          </div>

          {/* Column 3 - Booking (25%) */}
          <div 
            className="flex-none overflow-hidden" 
            style={{ width: '25%', padding: '16px' }}
          >
            <TeacherBookingSection teacher={teacher} />
          </div>
        </div>
      </Card>

      {showAvailability && (
        <div className="hidden lg:block absolute top-0 left-full ml-4 z-10">
          <AvailabilityPanel teacher={teacher} />
        </div>
      )}
    </motion.div>
  );
}