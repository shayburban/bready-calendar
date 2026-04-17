
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, BookOpen, Plus, X, ChevronDown } from 'lucide-react'; // Added ChevronDown
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BoardSelector from './BoardSelector';
import CustomDataInput from './approval/CustomDataInput';
import { PendingData } from '@/api/entities';
import { User } from '@/api/entities';
import GlobalSelectedItem, {
  extractErrorMessages,
  outlineIfError } from
'@/components/common/GlobalSelectedItem';

// --- MOCK API DATA & HOOKS (for UI development as per prompt) ---
const MOCK_COUNTRIES = [
{
  id: 1, name: 'India', exams: [
  { id: 101, name: 'JEE Main', subjects: ['Mathematics', 'Physics', 'Chemistry'] },
  { id: 102, name: 'JEE Advanced', subjects: ['Mathematics', 'Physics', 'Chemistry'] },
  { id: 103, name: 'NEET', subjects: ['Physics', 'Chemistry', 'Biology'] },
  { id: 104, name: 'GATE', subjects: ['Computer Science', 'Mechanical Engineering', 'Electrical Engineering'] }]
},
{
  id: 2, name: 'United States', exams: [
  { id: 201, name: 'SAT', subjects: ['Mathematics', 'English', 'Reading'] },
  { id: 202, name: 'ACT', subjects: ['Mathematics', 'English', 'Science', 'Reading'] },
  { id: 203, name: 'GRE', subjects: ['Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing'] }]
},
{
  id: 3, name: 'United Kingdom', exams: [
  { id: 301, name: 'A-Levels', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'] },
  { id: 302, name: 'GCSE', subjects: ['Mathematics', 'English', 'Sciences'] }]
}];


// Competitive Exams Selector Component
const CompetitiveExamsSelector = () => {
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedExam, setSelectedExam] = useState(''); // This state is not directly used in the current outline logic but kept for potential future use or consistency with past versions.
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [years, setYears] = useState('');
  const [notes, setNotes] = useState('');
  const [addedExams, setAddedExams] = useState([]); // New state to hold added exams
  const [expandedNotes, setExpandedNotes] = useState([]);
  const [customExamData, setCustomExamData] = useState({
    country: '',
    exam: '',
    subject: '',
    years: '',
    notes: ''
  });
  const [customExamErrors, setCustomExamErrors] = useState({});
  const [customAttempted, setCustomAttempted] = useState(false); // ADD: gates error visibility
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examErrors, setExamErrors] = useState({}); // New state for pre-defined exam errors

  // NEW: Live preview (derive, no handler edits)
  const previewItem = useMemo(() => {
    const countryObj = MOCK_COUNTRIES.find((c) => c.id === parseInt(selectedCountry));
    const examObj = countryObj?.exams.find((e) => e.id === parseInt(examId));

    if (!countryObj || !examObj) return null;

    const subject = subjectId || 'All subjects';
    const yrs = years || 'Not specified';
    const n = notes || '';

    return {
      country: countryObj.name,
      exam: examObj.name,
      subject,
      years: yrs,
      notes: n,
      isCustom: false
    };
  }, [selectedCountry, examId, subjectId, years, notes]);

  // NEW: Live preview for Custom Exam (derive, no handler edits)
  const customPreviewItem = useMemo(() => {
    const country = (customExamData.country || '').trim();
    const exam = (customExamData.exam || '').trim();
    const subject = (customExamData.subject || '').trim();
    const yrs = (customExamData.years || '').trim();
    const n = customExamData.notes || '';

    // Show preview only if any content exists:
    if (!country && !exam && !subject && !yrs && !n) return null;

    return {
      country,
      exam,
      subject: subject || 'All subjects',
      years: yrs || 'Not specified',
      notes: n,
      isCustom: true // descriptive only
    };
  }, [customExamData]);

  // NEW: Overlay state (optional)
  const [overlayItem, setOverlayItem] = useState(null);

  const handleCustomExamSubmit = async () => {
    const { country, exam, subject, years, notes } = customExamData;

    // --- VALIDATION LOGIC ---
    const errors = {};
    if (!country.trim()) errors.country = 'Country is required.';
    if (!exam.trim()) errors.exam = 'Exam is required.';
    if (!subject.trim()) errors.subject = 'Subject is required.';

    setCustomExamErrors(errors);

    if (Object.keys(errors).length > 0) {
      return; // Stop submission if there are errors
    }

    setIsSubmitting(true); // Disable the button right after validation passes

    try {
      // Get current user for submission
      const currentUser = await User.me();

      // Submit to PendingData for admin approval
      await PendingData.create({
        teacher_id: currentUser.id,
        data_type: 'exam',
        data_value: exam,
        related_subject: subject,
        additional_info: {
          country: country,
          years: years || 'Not specified',
          notes: notes || ''
        },
        context: {
          step: 'registration_step_1',
          form_section: 'exams_section',
          teacher_name: currentUser.full_name || 'Unknown',
          teacher_email: currentUser.email
        }
      });

      const newExam = {
        id: Date.now(),
        country,
        exam,
        subject,
        years: years || 'Not specified',
        notes: notes || '',
        isCustom: true // Flag for pending status
      };

      setAddedExams((prev) => [...prev, newExam]);

      // Reset form
      setCustomExamData({ country: '', exam: '', subject: '', years: '', notes: '' });
      setCustomExamErrors({}); // Clear errors on successful submission
      setCustomAttempted(false); // Reset attempted state
    } catch (error) {
      console.error('Error submitting custom exam:', error);
      alert('Error submitting custom exam. Please try again.');
    } finally {
      setIsSubmitting(false); // Re-enable the button after everything
    }
  };

  const handleCustomExamValidation = () => {
    const { country, exam, subject } = customExamData;
    const errors = {};

    if (!country.trim()) errors.country = 'Country is required.';
    if (!exam.trim()) errors.exam = 'Exam is required.';
    if (!subject.trim()) errors.subject = 'Subject is required.';

    setCustomExamErrors(errors);
  };

  const handleCustomAddClick = () => {
    setCustomAttempted(true);
    if (canAddCustomExam) {
      handleCustomExamSubmit();
    } else {
      handleCustomExamValidation();
    }
  };

  const handleCustomExamChange = (e) => {
    const { name, value } = e.target;
    if (name === 'years') {
      // Only allow digits for years
      setCustomExamData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else if (name === 'country') {
      // Only allow letters (a-z, A-Z) and spaces
      if (value === '' || /^[a-zA-Z\s]+$/.test(value)) {
        setCustomExamData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setCustomExamData((prev) => ({ ...prev, [name]: value }));
    }
    // Optionally, clear the specific error when the field changes
    setCustomExamErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddExam = () => {
    const errors = {};
    if (!selectedCountry) errors.country = 'Please select a country.';
    if (!examId) errors.exam = 'Please select an exam.';

    if (Object.keys(errors).length > 0) {
      setExamErrors(errors);
      return;
    }
    setExamErrors({}); // Clear errors if validation passes

    const country = MOCK_COUNTRIES.find((c) => c.id === parseInt(selectedCountry));
    const exam = country?.exams.find((e) => e.id === parseInt(examId));
    const subject = subjectId || 'All subjects'; // Default subject if not selected

    if (exam) {
      const newExam = {
        id: Date.now(), // Simple ID generation
        country: country.name,
        exam: exam.name,
        subject: subject,
        years: years || 'Not specified',
        notes: notes || '', // Now default to empty string
        isCustom: false
      };

      setAddedExams((prev) => [...prev, newExam]);

      console.log('Adding exam:', newExam);

      // Reset form
      setSelectedCountry('');
      setSelectedExam(''); // Resetting this as well for completeness, though not directly used in current flow.
      setExamId('');
      setSubjectId('');
      setYears('');
      setNotes('');
    }
  };

  const handleExamValidation = () => {
    const errors = {};

    if (!selectedCountry) errors.country = 'Please select a country.';
    if (!examId) errors.exam = 'Please select an exam.';

    setExamErrors(errors);
  };

  const handleRemoveExam = (idToRemove) => {
    setAddedExams((prev) => prev.filter((exam) => exam.id !== idToRemove));
    setExpandedNotes((prev) => prev.filter((id) => id !== idToRemove)); // Also remove from expanded notes
  };

  const handleToggleNotes = (examId) => {
    setExpandedNotes((prev) =>
    prev.includes(examId) ?
    prev.filter((id) => id !== examId) :
    [...prev, examId]
    );
  };

  const canAdd = examId !== '' && selectedCountry !== '';
  const canAddCustomExam = customExamData.country.trim() && customExamData.exam.trim() && customExamData.subject.trim();
  const selectedCountryData = MOCK_COUNTRIES.find((c) => c.id === parseInt(selectedCountry));
  const selectedExamData = selectedCountryData?.exams.find((e) => e.id === parseInt(examId));

  return (
    <div className="space-y-6">
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <Select
            value={selectedCountry}
            onValueChange={(value) => {
              setSelectedCountry(value);
              setExamErrors((prev) => ({ ...prev, country: '' }));
              setExamId(''); // Reset exam when country changes
              setSubjectId(''); // Reset subject when country changes
            }}>

            <SelectTrigger className={`bg-gray-50 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer ${examErrors.country ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-input focus:ring-1 focus:ring-ring'}`}>
              <SelectValue placeholder="Select Country..." />
            </SelectTrigger>
            <SelectContent>
              {MOCK_COUNTRIES.map((country) =>
              <SelectItem key={country.id} value={country.id.toString()}>
                  {country.name}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {examErrors.country && <p className="text-red-500 text-xs mt-1">{examErrors.country}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
          <Select
            value={examId}
            onValueChange={(value) => {
              setExamId(value);
              setExamErrors((prev) => ({ ...prev, exam: '' }));
              setSubjectId(''); // Reset subject when exam changes
            }}
            disabled={!selectedCountry}>

            <SelectTrigger className={`bg-gray-50 px-3 py-2 text-sm flex h-10 w-full items-center justify-between rounded-md border ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer ${examErrors.exam ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-input focus:ring-1 focus:ring-ring'}`}>
              <SelectValue placeholder="Select Exam..." />
            </SelectTrigger>
            <SelectContent>
              {selectedCountryData?.exams.map((exam) =>
              <SelectItem key={exam.id} value={exam.id.toString()}>
                  {exam.name}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {examErrors.exam && <p className="text-red-500 text-xs mt-1">{examErrors.exam}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject (optional)</label>
          <Input
            placeholder="Type Subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="bg-gray-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience (optional)</label>
          <Input
            placeholder="Type Years of Experience"
            value={years}
            onChange={(e) => setYears(e.target.value.replace(/\D/g, ''))} // Updated onChange
            onKeyDown={(e) => {
              // Prevent 'e', 'E', '+', '-', and '.'
              if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            type="number" // Keep type="number" for browser-level validation/UI
            min="0" // Keep min="0"
            inputMode="numeric"
            pattern="[0-9]*" className="bg-gray-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
          <Input placeholder="Add Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-gray-50 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
        </div>
        {/* spacer to keep 2-col rhythm */}
        <div className="hidden md:block" />
      </div>


      {/* NEW: Global Selected Item Live Preview (ADD-ONLY, visual-only) */}
      {previewItem &&
      <div className="mb-4">
          <GlobalSelectedItem
          variant="preview"
          previewLabel="Live preview"
          title={<span className="truncate">{previewItem.exam} - {previewItem.subject}</span>}
          subtitle={`${previewItem.country} • ${previewItem.years}${previewItem.years !== 'Not specified' ? ' years experience' : ''}`}
          notes={previewItem.notes}
          notesExpanded={expandedNotes.includes('preview')}
          onToggleNotes={() =>
          setExpandedNotes((prev) =>
          prev.includes('preview') ? prev.filter((id) => id !== 'preview') : [...prev, 'preview']
          )
          } />

        </div>
      }

      <div className="flex justify-start">
        <Button
          variant={canAdd ? 'success' : undefined}
          onClick={canAdd ? handleAddExam : handleExamValidation}
          disabled={false}
          className={!canAdd ? 'opacity-50' : ''}>

          <Plus className="w-4 h-4 mr-2" /> Add Exam
        </Button>
      </div>

      <div className="border-t pt-4">
        <details className="group">
          <summary className="flex items-center justify-between cursor-pointer list-none">
            <span className="text-blue-600 font-medium hover:underline">Did not find your exam? Click here.</span>
            <ChevronDown className="w-5 h-5 text-gray-500 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <Input
                  name="country"
                  placeholder="Type Country"
                  value={customExamData.country}
                  onChange={handleCustomExamChange}
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input ${outlineIfError(customAttempted, !!customExamErrors.country)}`} />


                {customExamErrors.country && <p className="text-red-500 text-xs mt-1">{customExamErrors.country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
                <Input
                  name="exam"
                  placeholder="Type Exam"
                  value={customExamData.exam}
                  onChange={handleCustomExamChange}
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input ${outlineIfError(customAttempted, !!customExamErrors.exam)}`} />


                {customExamErrors.exam && <p className="text-red-500 text-xs mt-1">{customExamErrors.exam}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Subject (left col) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <Input
                  name="subject"
                  placeholder="Type Subject"
                  value={customExamData.subject}
                  onChange={handleCustomExamChange}
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-input ${outlineIfError(customAttempted, !!customExamErrors.subject)}`} />

                {customExamErrors.subject &&
                <p className="text-red-500 text-xs mt-1">{customExamErrors.subject}</p>
                }
              </div>

              {/* Years (right col) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience (optional)
                </label>
                <Input
                  name="years"
                  placeholder="Type number"
                  value={customExamData.years}
                  onChange={handleCustomExamChange}
                  onKeyDown={(e) => {if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();}}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <Input
                  name="notes"
                  placeholder="Write Notes"
                  value={customExamData.notes}
                  onChange={handleCustomExamChange} className="px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
              </div>
              {/* spacer to keep 2-col rhythm */}
              <div className="hidden md:block" />
            </div>

            {/* Error messages display */}
            {customAttempted && extractErrorMessages(customExamErrors).length > 0 &&
            <GlobalSelectedItem
              className="p-0 bg-transparent border-0 mb-4"
              title=""
              subtitle=""
              showErrorSummary
              attempted={customAttempted}
              errorList={extractErrorMessages(customExamErrors)}
              errorSummaryTitle="Please fix the following:" />

            }

            {customPreviewItem &&
            <div className="mb-4">
                <GlobalSelectedItem
                variant="preview"
                previewLabel="Live preview (custom exam)"
                title={
                <span className="truncate">
                      {customPreviewItem.exam ? `${customPreviewItem.exam} - ` : ''}
                      {customPreviewItem.subject}
                    </span>
                }
                subtitle={`${
                customPreviewItem.country || 'Not specified'} • ${

                customPreviewItem.years !== 'Not specified' ?
                `${customPreviewItem.years} years experience` :
                'Not specified'}`
                }
                notes={customPreviewItem.notes}
                notesExpanded={expandedNotes.includes('custom_preview')}
                onToggleNotes={() =>
                setExpandedNotes((prev) =>
                prev.includes('custom_preview') ?
                prev.filter((id) => id !== 'custom_preview') :
                [...prev, 'custom_preview']
                )
                } />

              </div>
            }

            <Button
              variant={canAddCustomExam && !isSubmitting ? 'success' : undefined}
              onClick={handleCustomAddClick}
              disabled={isSubmitting}
              className={!canAddCustomExam ? 'opacity-50' : ''}>

              <Plus className="w-4 h-4 mr-2" /> {isSubmitting ? 'Adding...' : 'Add Custom Exam'}
            </Button>
          </div>
        </details>
      </div>

      {/* Display Added Exams */}
      {addedExams.length > 0 &&
      <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Added Exams ({addedExams.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {addedExams.map((exam) => {
            const subtitle = exam.years && exam.years !== 'Not specified' ?
            `${exam.country} • ${exam.years} years experience` :
            `${exam.country} • Not specified`;

            return (
              <GlobalSelectedItem
                className="h-full"
                key={exam.id}
                title={<span className="truncate">{exam.exam} - {exam.subject || 'All subjects'}</span>}
                subtitle={subtitle}
                status={exam.isCustom ? 'pending' : 'default'}
                notes={exam.notes}
                notesExpanded={expandedNotes.includes(exam.id)}
                onToggleNotes={() => handleToggleNotes(exam.id)}
                onRemove={() => handleRemoveExam(exam.id)}
                onClick={() => setOverlayItem(exam)} />);

          })}
          </div>
        </div>
      }

      {/* Optional: Overlay on click */}
      {overlayItem &&
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Selected Exam Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setOverlayItem(null)} className="p-1 -mr-2">
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-3">
                <div className="font-medium text-gray-900 break-words">
                  {overlayItem.exam} - {overlayItem.subject}
                  {overlayItem.isCustom &&
                <span className="text-yellow-600 font-semibold text-xs ml-2">(Pending)</span>
                }
                </div>
                <div className="text-sm text-gray-700 break-words">
                  <div><span className="font-medium">Country: </span>{overlayItem.country}</div>
                  <div><span className="font-medium">Years: </span>{overlayItem.years}</div>
                  {overlayItem.notes &&
                <div className="mt-2">
                      <span className="font-medium block mb-1">Notes:</span>
                      <div className="bg-white p-3 rounded border text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto break-words">
                        {overlayItem.notes}
                      </div>
                    </div>
                }
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button onClick={() => setOverlayItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      }
    </div>);

};

export default function CoursesExamsSelector() {
  const [specialize, setSpecialize] = useState(false);

  // ADD-ONLY: Future modules for this section; add 'boards' later when re-enabling Tabs.
  const SPECIALIZATION_MODULES = ['exams'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-gray-700" />
          <span className="text-xl font-bold">Exams</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-3 mb-4">
          <Checkbox
            id="specialize-checkbox"
            checked={specialize}
            onCheckedChange={() => setSpecialize((prev) => !prev)} />

          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="specialize-checkbox"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">

              I specialize in preparing students for specific exams.
            </label>
            <p className="text-xs text-muted-foreground">
              Check this if you help students prepare for standardized tests, entrance exams, or certification exams.
            </p>
          </div>
        </div>

        {specialize &&
        <>
            {/* FUTURE (planned): re-enable Tabs for multiple modules like "Educational Boards", "Competitive Exams", etc.
            Keeping the original Tabs markup below, fully commented, so no logic is removed. */}

            {/* NOW: Only render the CompetitiveExamsSelector (same UI as the "Competitive Exams" tab).
            Controlled by the future-safe array above. */}
            {SPECIALIZATION_MODULES.includes('exams') &&
          <CompetitiveExamsSelector />
          }

            {/*
            ORIGINAL TABS UI (PLANNED FOR FUTURE – DO NOT DELETE)
            <Tabs defaultValue="boards" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="boards">Educational Boards</TabsTrigger>
            <TabsTrigger value="exams">Competitive Exams</TabsTrigger>
            </TabsList>
            <TabsContent value="boards" className="mt-4">
            <BoardSelector />
            </TabsContent>
            <TabsContent value="exams" className="mt-4">
            <CompetitiveExamsSelector />
            </TabsContent>
            </Tabs>
            */}
          </>
        }
      </CardContent>
    </Card>);

}
