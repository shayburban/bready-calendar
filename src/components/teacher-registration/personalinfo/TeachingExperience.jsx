
import React, { useState } from 'react';
import { useTeacher } from '../TeacherContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen, Laptop, Users, Building, Edit, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import GlobalSelectedItem from '@/components/common/GlobalSelectedItem';
import { todayISO, clampToPast1920, keepStartBeforeEnd, MIN_ISO_1920, openDatePicker, blockTypingOnDate } from '@/components/utils/dateGuards';
import { numbersOnlyKeyDown } from '@/components/utils/inputGuards'; // New import

// Tiny black/white tooltip component
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

const TeachingExperience = ({ setActiveTab }) => {
  const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();

  // State for the teaching role being added/edited
  const [currentRole, setCurrentRole] = React.useState({
    id: null,
    school: '',
    role: '',
    startDate: '',
    endDate: '',
    years: '',
    isCurrent: false,
  });

  // State to track if we are editing an existing role
  const [editingRoleId, setEditingRoleId] = React.useState(null);

  // New states for validation feedback
  const [teachingAttempt, setTeachingAttempt] = React.useState(false);
  
  // Ensure Total Teaching Years defaults to 0 when empty/undefined/null (ADD-ONLY)
  React.useEffect(() => {
    setPersonalInfo(prev => {
      const total = prev?.experience?.total_years;
      if (total === undefined || total === null || total === '') {
        return {
          ...prev,
          experience: { ...(prev.experience || {}), total_years: 0 },
        };
      }
      return prev;
    });
    // run once on mount; we intentionally don't include personalInfo in deps
    // to avoid re-applying after user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTeachingValid = Boolean(
    currentRole.school &&
    currentRole.role &&
    currentRole.years &&
    currentRole.startDate &&
    (currentRole.isCurrent || currentRole.endDate)
  );

  // Show Role preview once any field has content
  const hasTeachingRoleInput = Object.values(currentRole).some(v => !!(v && String(v).toString().trim()));

  const handleExperienceChange = (field, value) => {
    // This logic handles numeric inputs. If value is empty string, stores null.
    // If value is non-numeric (e.g., "abc"), it reverts to the previous value.
    const numericValue = value === '' ? null : parseInt(value, 10);
    setPersonalInfo(prev => ({
      ...prev,
      experience: {
        ...prev.experience,
        [field]: isNaN(numericValue) ? (value === '' ? null : prev.experience[field]) : numericValue,
      }
    }));
  };

  // New handleInputChange for currentRole fields
  const handleInputChange = (field, value) => {
    setCurrentRole(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTeachingRole = () => {
    if (isTeachingValid) {
      if (editingRoleId) {
        // Update existing role
        setPersonalInfo(prev => ({
          ...prev,
          teachingHistory: (prev.teachingHistory || []).map(role =>
            role.id === editingRoleId ? { ...currentRole, id: editingRoleId } : role
          )
        }));
        setEditingRoleId(null); // Reset editing state
      } else {
        // Add new role
        const newRole = { ...currentRole, id: Date.now() }; // Add unique ID for key prop
        setPersonalInfo(prev => ({
          ...prev,
          teachingHistory: [...(prev.teachingHistory || []), newRole]
        }));
      }
      // Reset form and validation state on success
      setCurrentRole({ id: null, school: '', role: '', startDate: '', endDate: '', years: '', isCurrent: false });
      // Clear any previous teaching experience validation error related to this section if adding a valid role
      if (errors.teachingExperience) {
        setErrors((prev) => ({ ...prev, teachingExperience: null }));
      }
      setTeachingAttempt(false); // Reset validation attempt state
    }
  };

  const handleEditTeachingRole = (id) => {
    const roleToEdit = (personalInfo.teachingHistory || []).find(role => role.id === id);
    if (roleToEdit) {
      setCurrentRole(roleToEdit);
      setEditingRoleId(id);
      setTeachingAttempt(false); // Reset teachingAttempt when editing
    }
  };

  const handleRemoveTeachingRole = (id) => {
    setPersonalInfo(prev => ({
      ...prev,
      teachingHistory: (prev.teachingHistory || []).filter(role => role.id !== id)
    }));
    // If the role being removed is the one currently being edited, clear editing state
    if (editingRoleId === id) {
      setEditingRoleId(null);
      setCurrentRole({ id: null, school: '', role: '', startDate: '', endDate: '', years: '', isCurrent: false });
    }
    setTeachingAttempt(false); // Reset teachingAttempt when removing an item
  };

  // sum of "years" from Teaching Roles
  const teachingRolesYearsTotal = (personalInfo.teachingHistory || []).reduce(
    (sum, role) => sum + (Number(role?.years) || 0),
    0
  );
  const hasAnyTeachingRole = (personalInfo.teachingHistory || []).length > 0;

  // ADD-ONLY: keep experience.total_years in sync with the computed roles sum (read-only mirror)
  React.useEffect(() => {
    setPersonalInfo(prev => {
      const prevTotal = prev?.experience?.total_years ?? 0;
      if (prevTotal === teachingRolesYearsTotal) return prev; // no-op if unchanged
      return {
        ...prev,
        experience: { ...(prev.experience || {}), total_years: teachingRolesYearsTotal },
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachingRolesYearsTotal]);

  // New calculation for total years and related validation
  const totalTeachingYears = personalInfo.experience?.total_years ?? 0;
  const online = personalInfo.experience?.online_years ?? 0;
  const offline = personalInfo.experience?.offline_years ?? 0;
  const maxAllowed = online + offline;

  // Equality validation logic - MOVED UP TO FIX REFERENCE ERROR
  const isDefined = (v) => v !== null && v !== undefined && v !== '';
  const totalDefined = isDefined(personalInfo.experience?.total_years);
  const onlineDefined = isDefined(personalInfo.experience?.online_years);
  const offlineDefined = isDefined(personalInfo.experience?.offline_years);
  const shouldValidateEquality = totalDefined && (onlineDefined || offlineDefined);

  // ADD-ONLY: New bounds & zero rules for computed total
  const computedTotal = Number(teachingRolesYearsTotal) || 0;
  const onlineNum = Number(online) || 0;
  const offlineNum = Number(offline) || 0;
  const eitherDefined = (onlineDefined || offlineDefined);

  // 1) Cannot be 0 when Online or Offline > 0
  const totalZeroWithOnlineOrOfflineError =
    (computedTotal === 0 && (onlineNum > 0 || offlineNum > 0))
      ? `Total Teaching Years (0) cannot be 0 when Online (${onlineNum}) or Offline (${offlineNum}) years are set.`
      : null;

  // 2) Cannot be less than either Online or Offline  (i.e., total >= max(online, offline))
  const minRequired = Math.max(onlineNum, offlineNum);
  const totalLessThanEitherError =
    (eitherDefined && computedTotal < minRequired)
      ? `Total Teaching Years (${computedTotal}) cannot be less than Online (${onlineNum}) or Offline (${offlineNum}).`
      : null;

  const totalYearsExceedsError =
    Number(totalTeachingYears) > Number(maxAllowed)
      ? `Total Teaching Years (${totalTeachingYears}) cannot exceed Online + Offline (${maxAllowed}).`
      : null;

  const equalsOnline  = Number(totalTeachingYears) === Number(online);
  const equalsOffline = Number(totalTeachingYears) === Number(offline);
  const equalsSum     = Number(totalTeachingYears) === Number(maxAllowed);

  const totalYearsEqualityError =
    shouldValidateEquality && !(equalsOnline || equalsOffline || equalsSum)
      ? `Total Teaching Years (${totalTeachingYears}) must equal Online Years (${online}), Offline Years (${offline}), or their sum (${maxAllowed}).`
      : null;

  // mismatch vs Teaching Roles total
  const shouldValidateTeachingRolesSum = (personalInfo.experience?.total_years ?? '') !== '' && hasAnyTeachingRole;

  const totalYearsTeachingRolesMismatchError =
    shouldValidateTeachingRolesSum && Number(totalTeachingYears) !== Number(teachingRolesYearsTotal)
      ? `Total Teaching Years (${totalTeachingYears}) must equal the sum of "Teaching Roles" years (${teachingRolesYearsTotal}).`
      : null;

  // UPDATE-ONLY: new precedence — zero > less-than-either > exceeds > roles-mismatch > old equality rule
  const totalYearsError =
    totalZeroWithOnlineOrOfflineError
    ?? totalLessThanEitherError
    ?? totalYearsExceedsError
    ?? totalYearsTeachingRolesMismatchError
    ?? totalYearsEqualityError;

  // Keep behavior consistent with your existing errors pattern
  React.useEffect(() => {
    if (!setErrors) return;
    setErrors(prev => {
      const next = { ...(prev || {}) };
      if (totalYearsError) {
        next.totalTeachingYears = totalYearsError;
      } else if (next.totalTeachingYears) {
        delete next.totalTeachingYears;
      }
      return next;
    });
  }, [totalTeachingYears, online, offline, teachingRolesYearsTotal, hasAnyTeachingRole, setErrors, totalYearsError]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="mb-3 text-lg font-medium flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Teaching Experience
        </h3>
        {/* Summary Cards */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-700">Total Teaching Years</h3>
              <div className="mt-2 text-center">
                <Input
                  id="totalYearsDisplay"
                  type="text"
                  readOnly
                  aria-readonly="true"
                  value={teachingRolesYearsTotal}
                  tabIndex={-1}
                  className="text-center text-lg font-medium pointer-events-none select-none !bg-transparent !border-transparent border-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 focus:!border-transparent outline-none focus:outline-none"
                  style={{ backgroundColor: 'transparent', borderColor: 'transparent' }}
                  // mirrors the Online/Offline input font & height for baseline alignment
                />
                <div className="mt-1 text-xs text-gray-600">
                  Auto-calculated from roles
                </div>
              </div>
              {(errors?.totalTeachingYears || totalYearsError) && (
                <p className="text-red-500 text-sm mt-1">
                  {errors?.totalTeachingYears || totalYearsError}
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Laptop className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <Label htmlFor="onlineYearsInput" className="text-sm font-medium text-gray-700">Online Years</Label>
              <Input
                id="onlineYearsInput"
                type="number"
                min="0"
                value={personalInfo.experience.online_years ?? ''}
                onChange={(e) => handleExperienceChange('online_years', e.target.value)}
                onKeyDown={numbersOnlyKeyDown}
                className="mt-2 text-center text-lg font-medium"
                placeholder="0"
              />
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <Label htmlFor="offlineYearsInput" className="text-sm font-medium text-gray-700">Offline Years</Label>
              <Input
                id="offlineYearsInput"
                type="number"
                min="0"
                value={personalInfo.experience.offline_years ?? ''}
                onChange={(e) => handleExperienceChange('offline_years', e.target.value)}
                onKeyDown={numbersOnlyKeyDown}
                className="mt-2 text-center text-lg font-medium"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Form for adding/editing a teaching role */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="schoolName">School/Company *</Label>
              <Input
                id="schoolName"
                placeholder="Type School/Company"
                value={currentRole.school}
                onChange={(e) => handleInputChange('school', e.target.value)}
                className={`${!currentRole.school && teachingAttempt ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                placeholder="Type Job Title"
                value={currentRole.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className={`${!currentRole.role && teachingAttempt ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="yearsInRole">Number of Years in Role *</Label>
            <Input
              id="yearsInRole"
              type="number"
              min="0"
              placeholder="Type Number of Years in Role"
              value={currentRole.years}
              onChange={(e) => handleInputChange('years', e.target.value.replace(/\D/,''))}
              onKeyDown={numbersOnlyKeyDown}
              className={`${!currentRole.years && teachingAttempt ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                onFocus={openDatePicker}
                onClick={openDatePicker}
                onKeyDown={blockTypingOnDate}
                aria-readonly="true"
                aria-haspopup="dialog"
                value={currentRole.startDate}
                onChange={(e) => {
                  setCurrentRole(prev => ({ ...prev, startDate: e.target.value }));
                }}
                onBlur={(e) => {
                  const v = clampToPast1920(e.target.value);
                  setCurrentRole(prev => {
                    const end = prev.isCurrent ? '' : prev.endDate;
                    const ordered = keepStartBeforeEnd(v, end);
                    return { ...prev, startDate: ordered.start, endDate: prev.isCurrent ? '' : ordered.end };
                  });
                }}
                min={MIN_ISO_1920}
                max={todayISO()}
                className={`w-full ${!currentRole.startDate && teachingAttempt ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {teachingAttempt && !currentRole.startDate && (
                <p className="text-red-500 text-sm mt-1">Start Date is required.</p>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                onFocus={!currentRole.isCurrent ? openDatePicker : undefined}
                onClick={!currentRole.isCurrent ? openDatePicker : undefined}
                onKeyDown={!currentRole.isCurrent ? blockTypingOnDate : undefined}
                aria-readonly="true"
                aria-haspopup="dialog"
                disabled={currentRole.isCurrent}
                value={currentRole.endDate}
                onChange={(e) => {
                  setCurrentRole(prev => ({ ...prev, endDate: e.target.value }));
                }}
                onBlur={(e) => {
                  if (currentRole.isCurrent) return;
                  const v = clampToPast1920(e.target.value);
                  setCurrentRole(prev => {
                    const ordered = keepStartBeforeEnd(prev.startDate, v);
                    return { ...prev, startDate: ordered.start, endDate: ordered.end };
                  });
                }}
                min={currentRole.startDate || MIN_ISO_1920}
                max={todayISO()}
                className={`${!currentRole.isCurrent && !currentRole.endDate && teachingAttempt ? 'border-red-500 focus:ring-red-500' : ''} w-full`}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="currentRoleCheckbox"
                  checked={currentRole.isCurrent}
                  onCheckedChange={(checked) => setCurrentRole((prev) => ({ ...prev, isCurrent: checked, endDate: checked ? '' : prev.endDate }))}
                />
                <Label htmlFor="currentRoleCheckbox" className="text-sm">I currently work here</Label>
              </div>
            </div>
          </div>

          {hasTeachingRoleInput && (
            <div className="mb-2 mt-4">
              <GlobalSelectedItem
                variant="preview"
                previewLabel="Live preview"
                title={currentRole.role || '—'}
                subtitle={currentRole.school || undefined}
                notes={`${currentRole.startDate || '—'} - ${currentRole.isCurrent ? 'Present' : (currentRole.endDate || '—')} ${currentRole.years ? `(${currentRole.years} years)` : ''}`.trim()}
                className="cursor-default"
              />
            </div>
          )}

          <div className="mt-4" onClick={() => { if (!isTeachingValid) setTeachingAttempt(true); }}>
            <Button
              onClick={handleAddTeachingRole}
              className="flex items-center w-full"
              style={{
                backgroundColor: isTeachingValid ? 'var(--button-active, #22b41e)' : 'var(--button-inactive, #959595)',
                color: 'white'
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> {editingRoleId ? 'Update Teaching Role' : 'Add Teaching Role'}
            </Button>
          </div>
          {teachingAttempt && !isTeachingValid && (
            <p className="mt-2 text-xs text-red-600">
              Please fill in School/Institution, Your Role, Years of Experience, and Dates (End Date or "I currently work here").
            </p>
          )}
        </div>
      </div>

      {/* Added Teaching Roles */}
      {personalInfo.teachingHistory && personalInfo.teachingHistory.length > 0 && (
        <div className="pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Added Teaching Roles ({personalInfo.teachingHistory.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personalInfo.teachingHistory.map(role => (
              <div key={role.id} className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{role.role} at {role.school}</p>
                  <p className="text-sm text-gray-600">{role.years} years</p>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {role.startDate} - {role.isCurrent ? 'Present' : (role.endDate || '—')}
                  </div>
                </div>
                <div className="flex items-center">
                  <Tip label="Edit">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTeachingRole(role.id)}
                      aria-label={`Edit ${role.role} at ${role.school}`}
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                  </Tip>
                  <Tip label="Remove">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTeachingRole(role.id)}
                      aria-label={`Remove ${role.role} at ${role.school}`}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </Tip>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {errors.teachingExperience && <p className="text-red-500 text-sm mt-4">{errors.teachingExperience}</p>}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t mt-8">
        <Button variant="outline" onClick={() => setActiveTab('EDUCATION')}>
          Previous: Education
        </Button>
        <Button onClick={() => setActiveTab('INDUSTRY_EXPERIENCE')}>
          Next: Industry Experience
        </Button>
      </div>
    </div>
  );
};

export default TeachingExperience;
