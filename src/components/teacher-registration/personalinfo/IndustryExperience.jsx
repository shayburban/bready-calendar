
import React, { useState } from 'react';
import { useTeacher } from '../TeacherContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Briefcase, Building, Calendar, X } from 'lucide-react';
import GlobalSelectedItem from '@/components/common/GlobalSelectedItem';
import { todayISO, clampToPast1920, keepStartBeforeEnd, MIN_ISO_1920, lockWhenCompleteKeyDown, openDatePicker, blockTypingOnDate } from '@/components/utils/dateGuards';

// Tiny black/white tooltip (no external deps)
const Tip = ({ label, children }) => (
  <span className="relative inline-flex items-center group">
    {children}
    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2
                     whitespace-nowrap rounded bg-black text-white text-[10px]
                     px-2 py-1 opacity-0 group-hover:opacity-100 transition shadow">
      {label}
    </span>
  </span>
);

const IndustryExperience = ({ setActiveTab }) => {
  const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();

  // Current work experience being added/edited
  const [currentIndustryRole, setCurrentIndustryRole] = useState({
    id: null, // Added ID for editing purposes
    company: '',
    jobTitle: '',
    startDate: '',
    endDate: '',
    yearsOfExperience: '',
    isCurrent: false // Renamed from isCurrentJob
  });

  // State to track if we are editing an existing work experience
  const [editingWorkId, setEditingWorkId] = useState(null);

  // State to track if an attempt to add/update work was made with invalid fields
  const [industryAttempt, setIndustryAttempt] = useState(false);

  // Derived state to check if essential fields for work experience are valid
  const isIndustryValid = Boolean(
    currentIndustryRole.company &&
    currentIndustryRole.jobTitle &&
    currentIndustryRole.startDate &&
    (currentIndustryRole.isCurrent || currentIndustryRole.endDate)
  );

  // Show Work preview once any field has content
  const hasWorkInput = Object.values(currentIndustryRole).some(v => !!(v && String(v).toString().trim() && v !== null));


  const handleInputChange = (field, value) => {
    setCurrentIndustryRole((prev) => ({ ...prev, [field]: value }));
    // When user starts typing, clear attempt status if it was previously set
    if (industryAttempt) {
      setIndustryAttempt(false);
    }
  };

  const addWorkExperience = () => {
    if (isIndustryValid) { // Use isIndustryValid for validation
      // Calculate years of experience if not provided
      let yearsExp = currentIndustryRole.yearsOfExperience;
      if (!yearsExp && currentIndustryRole.startDate) {
        const startYear = new Date(currentIndustryRole.startDate).getFullYear();
        const endYear = currentIndustryRole.isCurrent ? new Date().getFullYear() : (currentIndustryRole.endDate ? new Date(currentIndustryRole.endDate).getFullYear() : new Date().getFullYear());
        yearsExp = endYear - startYear;
      }

      const workToSave = {
        ...currentIndustryRole,
        yearsOfExperience: parseInt(yearsExp) || 0,
        endDate: currentIndustryRole.isCurrent ? '' : currentIndustryRole.endDate, // Ensure endDate is empty if current job
      };

      setPersonalInfo((prev) => {
        let updatedWorkHistory;
        let totalIndustryYears;

        if (editingWorkId) {
          // Update existing work experience
          updatedWorkHistory = (prev.workHistory || []).map((work) =>
            work.id === editingWorkId ? { ...workToSave, id: editingWorkId } : work
          );
        } else {
          // Add new work experience
          updatedWorkHistory = [...(prev.workHistory || []), { ...workToSave, id: Date.now() }];
        }

        // Recalculate total industry years based on updated history
        totalIndustryYears = updatedWorkHistory.reduce((sum, work) => sum + (work.yearsOfExperience || 0), 0);

        return {
          ...prev,
          workHistory: updatedWorkHistory,
          experience: {
            ...prev.experience,
            industry_years: totalIndustryYears
          }
        };
      });

      // Reset form and editing state
      setCurrentIndustryRole({ company: '', jobTitle: '', startDate: '', endDate: '', yearsOfExperience: '', isCurrent: false, id: null });
      setEditingWorkId(null);
      setIndustryAttempt(false); // Reset attempt status

      // Clear any related errors
      if (errors.industryExperience) {
        setErrors((prev) => ({ ...prev, industryExperience: null }));
      }
    } else {
      setIndustryAttempt(true); // Set attempt status to true if validation fails
    }
  };

  const removeWorkExperience = (id) => {
    const updatedHistory = personalInfo.workHistory?.filter((work) => work.id !== id) || [];
    setPersonalInfo((prev) => {
      // Recalculate total industry years
      const totalIndustryYears = updatedHistory.reduce((sum, work) => sum + (work.yearsOfExperience || 0), 0);
      return {
        ...prev,
        workHistory: updatedHistory,
        experience: {
          ...prev.experience,
          industry_years: totalIndustryYears
        }
      };
    });

    // If the removed item was being edited, clear the form
    if (editingWorkId === id) {
      setCurrentIndustryRole({ company: '', jobTitle: '', startDate: '', endDate: '', yearsOfExperience: '', isCurrent: false, id: null });
      setEditingWorkId(null);
      setIndustryAttempt(false); // Reset attempt status
    }
  };

  const editWorkExperience = (workId) => {
    const workToEdit = personalInfo.workHistory?.find((work) => work.id === workId);
    if (workToEdit) {
      setCurrentIndustryRole(workToEdit);
      setEditingWorkId(workId);
      setIndustryAttempt(false); // Clear attempt status when editing
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-3 text-lg font-medium flex items-center gap-2">Industry Experience</h3>

        {/* Current Industry Experience Summary */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Briefcase className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <Label className="text-sm font-medium text-gray-700">Total Industry Years</Label>
            <div className="mt-2 text-center font-medium text-2xl text-orange-600">
              {personalInfo.experience?.industry_years || 0}
            </div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Building className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <Label className="text-sm font-medium text-gray-700">Companies Worked</Label>
            <div className="mt-2 text-center font-medium text-2xl text-blue-600">
              {personalInfo.workHistory?.length || 0}
            </div>
          </div>
        </div>

        {/* Work History */}
        <Card className="mb-6 border-0 shadow-none">
          <CardHeader className="px-6 py-3 flex flex-col space-y-1.5">
            <CardTitle className="text-md flex items-center gap-2">
              <Building className="h-4 w-4" />
              Work Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Existing Work History */}
            {personalInfo.workHistory && personalInfo.workHistory.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-gray-700">Work History ({personalInfo.workHistory.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-0">
                  {personalInfo.workHistory.map(work => (
                    <div key={work.id} className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{work.jobTitle} at {work.company}</p>
                        <p className="text-sm text-gray-600">
                          {work.startDate} - {work.isCurrent ? 'Present' : (work.endDate || '—')}
                          {work.yearsOfExperience > 0 && (
                            <span className="ml-2">({work.yearsOfExperience} years)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tip label="Edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => editWorkExperience(work.id)}
                            className="text-gray-500 hover:text-gray-700"
                            aria-label={`Edit ${work.jobTitle} at ${work.company}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Tip>
                        <Tip label="Remove">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeWorkExperience(work.id)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove ${work.jobTitle} at ${work.company}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Tip>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Add New Work Experience */}
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="companyName">Company *</Label>
                  <Input
                    id="companyName"
                    placeholder="Type Company"
                    value={currentIndustryRole.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className={`${!currentIndustryRole.company && industryAttempt ? 'border-red-500 focus:ring-red-500' : ''} w-full`}
                  />
                </div>
                <div>
                  <Label htmlFor="workJobTitle">Job Title *</Label>
                  <Input
                    id="workJobTitle"
                    placeholder="Type Job Title"
                    value={currentIndustryRole.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    className={`${!currentIndustryRole.jobTitle && industryAttempt ? 'border-red-500 focus:ring-red-500' : ''} w-full`}
                  />
                </div>
                <div>
                  <Label htmlFor="industry-startDate">Start Date *</Label>
                  <Input
                    id="industry-startDate"
                    type="date"
                    onFocus={openDatePicker}
                    onClick={openDatePicker}
                    onKeyDown={blockTypingOnDate}
                    aria-readonly="true"
                    aria-haspopup="dialog"
                    value={currentIndustryRole.startDate}
                    onChange={(e) => {
                      setCurrentIndustryRole(prev => ({ ...prev, startDate: e.target.value }));
                    }}
                    onBlur={(e) => {
                      const v = clampToPast1920(e.target.value);
                      setCurrentIndustryRole(prev => {
                        const end = prev.isCurrent ? '' : prev.endDate;
                        const ordered = keepStartBeforeEnd(v, end);
                        return { ...prev, startDate: ordered.start, endDate: prev.isCurrent ? '' : ordered.end };
                      });
                    }}
                    min={MIN_ISO_1920}
                    max={todayISO()}
                    className={`${!currentIndustryRole.startDate && industryAttempt ? 'border-red-500 focus:ring-red-500' : ''} w-full`}
                  />
                </div>
                <div>
                  <Label htmlFor="industry-endDate">End Date *</Label>
                  <Input
                    id="industry-endDate"
                    type="date"
                    onFocus={!currentIndustryRole.isCurrent ? openDatePicker : undefined}
                    onClick={!currentIndustryRole.isCurrent ? openDatePicker : undefined}
                    onKeyDown={!currentIndustryRole.isCurrent ? blockTypingOnDate : undefined}
                    aria-readonly="true"
                    aria-haspopup="dialog"
                    disabled={currentIndustryRole.isCurrent}
                    value={currentIndustryRole.endDate}
                    onChange={(e) => {
                      setCurrentIndustryRole(prev => ({ ...prev, endDate: e.target.value }));
                    }}
                    onBlur={(e) => {
                      if (currentIndustryRole.isCurrent) return;
                      const v = clampToPast1920(e.target.value);
                      setCurrentIndustryRole(prev => {
                        const ordered = keepStartBeforeEnd(prev.startDate, v);
                        return { ...prev, startDate: ordered.start, endDate: ordered.end };
                      });
                    }}
                    min={currentIndustryRole.startDate || MIN_ISO_1920}
                    max={todayISO()}
                    className={`${!currentIndustryRole.isCurrent && !currentIndustryRole.endDate && industryAttempt ? 'border-red-500 focus:ring-red-500' : ''} w-full`}
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="currentJob"
                      checked={currentIndustryRole.isCurrent}
                      onCheckedChange={(checked) => setCurrentIndustryRole((prev) => ({
                        ...prev,
                        isCurrent: checked,
                        endDate: checked ? '' : prev.endDate
                      }))}
                    />
                    <Label htmlFor="currentJob" className="text-sm">Current Job</Label>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="yearsOfExperience">Years of Experience (Optional)</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    placeholder="Will be calculated automatically if dates provided"
                    value={currentIndustryRole.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {hasWorkInput && (
                <div className="mb-2">
                  <GlobalSelectedItem
                    variant="preview"
                    previewLabel="Live preview"
                    title={currentIndustryRole.jobTitle || '—'}
                    subtitle={currentIndustryRole.company || undefined}
                    notes={`${currentIndustryRole.startDate || '—'} - ${currentIndustryRole.isCurrent ? 'Present' : (currentIndustryRole.endDate || '—')} ${currentIndustryRole.yearsOfExperience ? `(${currentIndustryRole.yearsOfExperience} years)` : ''}`.trim()}
                    className="cursor-default"
                  />
                </div>
              )}

              {/* Button wrapped in a div to capture click for validation attempt */}
              <div onClick={() => { if (!isIndustryValid) setIndustryAttempt(true); }}>
                <Button
                  onClick={addWorkExperience}
                  className="flex items-center w-full"
                  style={{
                    backgroundColor: isIndustryValid ? 'var(--button-active, #22b41e)' : 'var(--button-inactive, #959595)',
                    color: 'white'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {editingWorkId ? 'Update Work Experience' : 'Add Work Experience'}
                </Button>
              </div>

              {industryAttempt && !isIndustryValid && (
                <p className="mt-2 text-xs text-red-600">
                  Please fill in Company, Job Title, and Dates (End Date or "Current Job").
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => setActiveTab('TEACHING_EXPERIENCE')}>
          Previous: Teaching Experience
        </Button>
        <div className="text-sm text-gray-600 self-center">
          Personal Info Complete! Click "Next" to continue.
        </div>
      </div>
    </div>
  );
};

export default IndustryExperience;
