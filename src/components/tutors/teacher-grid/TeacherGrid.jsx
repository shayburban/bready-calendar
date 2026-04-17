
import React from 'react';
import MobileTeacherGrid from './MobileTeacherGrid';
import TabletTeacherGrid from './TabletTeacherGrid';
import DesktopTeacherGrid from './DesktopTeacherGrid';

export default function TeacherGrid(props) {
  return (
    <>
      <div className="block md:hidden">
        <MobileTeacherGrid {...props} />
      </div>
      <div className="hidden md:block lg:hidden">
        <TabletTeacherGrid {...props} />
      </div>
      <div className="hidden lg:block">
        <DesktopTeacherGrid {...props} />
      </div>
    </>
  );
}
