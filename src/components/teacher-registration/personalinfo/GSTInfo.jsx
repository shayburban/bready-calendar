import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTeacher } from '../TeacherContext';

const GSTInfo = () => {
  const { personalInfo, setPersonalInfo } = useTeacher();
  const [hasGST, setHasGST] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  useEffect(() => {
    if (personalInfo.hasGST !== undefined) {
      setHasGST(personalInfo.hasGST ? 'Yes' : 'No');
    }
    if (personalInfo.gstNumber) {
      setGstNumber(personalInfo.gstNumber);
    }
  }, [personalInfo.hasGST, personalInfo.gstNumber]);

  const handleGSTSave = () => {
    setPersonalInfo((prev) => ({
      ...prev,
      hasGST: hasGST === 'Yes',
      gstNumber: hasGST === 'Yes' ? gstNumber : ''
    }));
  };

  return (
    <Card className="border-0 shadow-none p-0 bg-transparent">
     <CardContent className="p-0">
        <div className="py-3 space-y-4">
          <Label className="text-sm font-medium">Do you have a GST number?</Label>
          <RadioGroup value={hasGST} onValueChange={setHasGST} className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id="gst-yes" />
              <Label htmlFor="gst-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id="gst-no" />
              <Label htmlFor="gst-no">No</Label>
            </div>
          </RadioGroup>
          
          {hasGST === 'Yes' &&
          <div className="space-y-2">
              <Label>GST Number</Label>
              <Input
              placeholder="Enter your GST number"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)} className="bg-gray-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

            </div>
          }
          
          <div className="flex justify-end pt-4 hidden" aria-hidden>
            <Button className="hidden" aria-hidden tabIndex={-1} onClick={handleGSTSave}>
              Save GST Information
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>);

};

export default GSTInfo;