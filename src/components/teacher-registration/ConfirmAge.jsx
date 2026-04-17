import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTeacher } from './TeacherContext';
import SpeedTest from './SpeedTest';
import Captcha from './Captcha';
import GSTInfo from './personalinfo/GSTInfo';

const ConfirmAge = () => {
  const { isAgeConfirmed, setIsAgeConfirmed } = useTeacher();

  return (
    <div className="space-y-8">
      {/* Age Confirmation - First */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="age-confirm"
            checked={isAgeConfirmed}
            onCheckedChange={setIsAgeConfirmed}
            className="data-[state=checked]:bg-gray-600 data-[state=checked]:border-gray-600" />

          <Label htmlFor="age-confirm" className="text-sm font-medium text-gray-700 cursor-pointer">
            I confirm I'm over 18 years old (required)
          </Label>
        </div>
        
        {/* Terms & Conditions - Second (closer to checkbox) */}
        <p className="text-sm text-gray-700 pl-7">
          Check our{' '}
          <a
            href="/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Terms & Conditions



          </a>
          .
        </p>
      </div>


      {/* GST Information Section - Third */}
      <GSTInfo />

      <SpeedTest />
      <Captcha />
    </div>);

};

export default ConfirmAge;