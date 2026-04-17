
import React, { useState } from 'react';
import { useTeacher } from '../TeacherContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Award, BookOpen, Upload, ExternalLink, X } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import GlobalSelectedItem from '@/components/common/GlobalSelectedItem';
import { todayISO, clampToPast, clampToPast1920, keepStartBeforeEnd, MIN_ISO_1920, lockWhenCompleteKeyDown, isISOComplete, openDatePicker, blockTypingOnDate } from '@/components/utils/dateGuards'; // Added openDatePicker, blockTypingOnDate

// Tiny black/white tooltip (no external deps)
const Tip = ({ label, children }) =>
<span className="relative inline-flex items-center group">
    {children}
    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2
                     whitespace-nowrap rounded bg-black text-white text-[10px]
                     px-2 py-1 opacity-0 group-hover:opacity-100 transition shadow">


      {label}
    </span>
  </span>;


const Education = ({ setActiveTab }) => {
  const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();

  // Initial state for education and certification forms
  const initialEducationState = {
    degree: '',
    institution: '',
    field: '',
    startDate: '',
    endDate: '',
    documentUrl: ''
  };

  const initialCertificationState = {
    name: '',
    issuer: '',
    year: '',
    certificateUrl: '',
    documentUrl: ''
  };

  // State for a new education entry or for editing an existing one
  const [currentEducation, setCurrentEducation] = useState(initialEducationState);
  const [isEducationDragOver, setIsEducationDragOver] = useState(false);
  const [editingEducationId, setEditingEducationId] = useState(null); // State to track which education entry is being edited

  // Show Education preview once any field has content
  const hasEducationInput = Object.values(currentEducation).some((v) => !!(v && String(v).trim()));

  // State for a new certification entry or for editing an existing one
  const [currentCertification, setCurrentCertification] = useState(initialCertificationState);
  const [isCertificationDragOver, setIsCertificationDragOver] = useState(false);
  const [editingCertificationId, setEditingCertificationId] = useState(null); // State to track which certification entry is being edited

  // Show Certification preview once any field has content
  const hasCertificationInput = Object.values(currentCertification).some((v) => !!(v && String(v).trim()));

  // State for validation errors
  const [educationErrors, setEducationErrors] = useState({});
  const [certificationErrors, setCertificationErrors] = useState({});


  const handleFileDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'education') {
      setIsEducationDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleEducationFileUpload({ target: { files: e.dataTransfer.files } });
      }
    } else {
      setIsCertificationDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleCertificationFileUpload({ target: { files: e.dataTransfer.files } });
      }
    }
  };

  const handleDragOver = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'education') setIsEducationDragOver(true);else
    setIsCertificationDragOver(true);
  };

  const handleDragLeave = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'education') setIsEducationDragOver(false);else
    setIsCertificationDragOver(false);
  };


  const handleEducationFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCurrentEducation((prev) => ({ ...prev, documentUrl: objectUrl }));
      // Clear document error when file is uploaded
      setEducationErrors((prev) => ({ ...prev, documentUrl: '' }));
    }
  };

  const handleCertificationFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCurrentCertification((prev) => ({ ...prev, documentUrl: objectUrl }));
      // Clear document error when file is uploaded
      setCertificationErrors((prev) => ({ ...prev, documentUrl: '' }));
    }
  };

  // Function to load an education item into the form for editing
  const editEducation = (index) => {
    const educationToEdit = personalInfo.education[index];
    setCurrentEducation({ ...educationToEdit });
    setEditingEducationId(index);
    setEducationErrors({}); // Clear any previous validation errors
  };

  const removeEducation = (index) => {
    setPersonalInfo((prev) => {
      const updatedEducation = prev.education.filter((_, i) => i !== index);
      // If the item being removed is the one currently being edited, reset the form
      if (editingEducationId === index) {
        setEditingEducationId(null);
        setCurrentEducation(initialEducationState);
        setEducationErrors({});
      } else if (editingEducationId !== null && index < editingEducationId) {
        // If an item *before* the edited one is removed, adjust the editingId to point to the same logical item
        setEditingEducationId((prevId) => prevId - 1);
      }
      return {
        ...prev,
        education: updatedEducation
      };
    });
  };

  // Validation function for education
  const validateEducation = () => {
    const errors = {};

    if (!currentEducation.degree) errors.degree = 'Degree is required';
    if (!currentEducation.institution) errors.institution = 'Institution is required';
    if (!currentEducation.field) errors.field = 'Field of study is required';

    if (!currentEducation.startDate || !isISOComplete(currentEducation.startDate)) {
      errors.startDate = 'Valid start date is required';
    }
    if (!currentEducation.endDate || !isISOComplete(currentEducation.endDate)) {
      errors.endDate = 'Valid end date is required';
    } else if (currentEducation.startDate && isISOComplete(currentEducation.startDate) &&
               new Date(currentEducation.startDate) > new Date(currentEducation.endDate)) {
      errors.endDate = 'End date cannot be before start date';
    }

    if (!currentEducation.documentUrl) errors.documentUrl = 'Document upload is required';

    setEducationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isEducationFormValid = () => {
    return currentEducation.degree &&
    currentEducation.institution &&
    currentEducation.field &&
    isISOComplete(currentEducation.startDate) &&
    isISOComplete(currentEducation.endDate) &&
    (new Date(currentEducation.startDate) <= new Date(currentEducation.endDate)) &&
    currentEducation.documentUrl;
  };

  const addEducation = () => {
    if (!validateEducation()) {
      return;
    }

    setPersonalInfo((prev) => {
      const updatedEducation = [...(prev.education || [])];
      if (editingEducationId !== null) {
        // If editing, update the existing entry
        updatedEducation[editingEducationId] = currentEducation;
      } else {
        // Otherwise, add a new entry
        updatedEducation.push(currentEducation);
      }
      return {
        ...prev,
        education: updatedEducation
      };
    });
    setCurrentEducation(initialEducationState); // Reset form
    setEditingEducationId(null); // Reset editing state
    setEducationErrors({}); // Clear errors
  };


  // Certification handlers
  const handleCertificationChange = (field, value) => {
    setCurrentCertification((prev) => ({ ...prev, [field]: value }));
    setCertificationErrors((prev) => ({ ...prev, [field]: '' })); // Clear error for this field
  };

  // Function to load a certification item into the form for editing
  const editCertification = (index) => {
    const certificationToEdit = personalInfo.certifications[index];
    setCurrentCertification({ ...certificationToEdit });
    setEditingCertificationId(index);
    setCertificationErrors({}); // Clear any previous validation errors
  };

  // Validation function for certification
  const validateCertification = () => {
    const errors = {};

    if (!currentCertification.name) errors.name = 'Certification name is required';
    if (!currentCertification.issuer) errors.issuer = 'Issuing organization is required';
    if (!currentCertification.year) errors.year = 'Year is required';
    if (!currentCertification.documentUrl) errors.documentUrl = 'Document upload is required';

    setCertificationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isCertificationFormValid = () => {
    return currentCertification.name &&
    currentCertification.issuer &&
    currentCertification.year &&
    currentCertification.documentUrl;
  };

  const addCertification = () => {
    if (!validateCertification()) {
      return;
    }

    setPersonalInfo((prev) => {
      const updatedCertifications = [...(prev.certifications || [])];
      if (editingCertificationId !== null) {
        // If editing, update the existing entry
        updatedCertifications[editingCertificationId] = currentCertification;
      } else {
        // Otherwise, add a new entry
        updatedCertifications.push(currentCertification);
      }
      return {
        ...prev,
        certifications: updatedCertifications
      };
    });
    setCurrentCertification(initialCertificationState); // Reset form
    setEditingCertificationId(null); // Reset editing state
    setCertificationErrors({}); // Clear errors
  };

  const removeCertification = (index) => {
    setPersonalInfo((prev) => {
      const updatedCertifications = prev.certifications.filter((_, i) => i !== index);
      // If the item being removed is the one currently being edited, reset the form
      if (editingCertificationId === index) {
        setEditingCertificationId(null);
        setCurrentCertification(initialCertificationState);
        setCertificationErrors({});
      } else if (editingCertificationId !== null && index < editingCertificationId) {
        // If an item *before* the edited one is removed, adjust the editingId
        setEditingCertificationId((prevId) => prevId - 1);
      }
      return {
        ...prev,
        certifications: updatedCertifications
      };
    });
  };


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Educational Qualifications Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Educational Qualifications
        </h3>

        <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">Add Education</h3>

          {/* ADD items-start for safety */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* ADD space-y-1 for vertical rhythm */}
            <div className="space-y-1">
              <Label htmlFor="education-degree" className="flex items-center gap-1">
                Degree *
              </Label>
              <div className="relative">
                <Input
                  id="education-degree"
                  placeholder="Type Degree"
                  value={currentEducation.degree}
                  onChange={(e) => {
                    setCurrentEducation({ ...currentEducation, degree: e.target.value });
                    setEducationErrors((prev) => ({ ...prev, degree: '' }));
                  }}
                  aria-invalid={!!educationErrors.degree ? 'true' : 'false'}
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                                ${!!educationErrors.degree ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}
                                ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                                placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`}
                />
              </div>
              {/* REPLACE with ternary for alignment */}
              {educationErrors.degree
                ? <p className="text-red-500 text-xs mt-1">{educationErrors.degree}</p>
                : <div className="min-h-[16px]" aria-hidden="true" />
              }
            </div>

            {/* ADD space-y-1 for vertical rhythm */}
            <div className="space-y-1">
              {/* ADD className to label */}
              <Label htmlFor="education-institution" className="flex items-center gap-1">
                Institution *
              </Label>
              {/* WRAP input in relative div */}
              <div className="relative">
                <Input
                  id="education-institution"
                  placeholder="Type Institution"
                  value={currentEducation.institution}
                  onChange={(e) => {
                    setCurrentEducation({ ...currentEducation, institution: e.target.value });
                    setEducationErrors((prev) => ({ ...prev, institution: '' }));
                  }}
                  aria-invalid={!!educationErrors.institution ? 'true' : 'false'}
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                                ${!!educationErrors.institution ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}
                                ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                                placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`}
                />
              </div>
              {/* REPLACE with ternary for alignment */}
              {educationErrors.institution
                ? <p className="text-red-500 text-xs mt-1">{educationErrors.institution}</p>
                : <div className="min-h-[16px]" aria-hidden="true" />
              }
            </div>
          </div>

            <div className="md:w-1/2">
              <Label htmlFor="education-field">Field of Study *</Label>
              <Input
                id="education-field"
                placeholder="Type Field of Study"
                value={currentEducation.field}
                onChange={(e) => {
                  setCurrentEducation({ ...currentEducation, field: e.target.value });
                  setEducationErrors((prev) => ({ ...prev, field: '' }));
                }}
                aria-invalid={!!educationErrors.field ? 'true' : 'false'}
                className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                            ${!!educationErrors.field ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}
                            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                            disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`} />


              {educationErrors.field &&
              <p className="text-red-500 text-xs mt-1">{educationErrors.field}</p>
              }
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <Label htmlFor="education-start-date">Start Date *</Label>
                <Input
                  id="education-start-date"
                  type="date"
                  onFocus={openDatePicker}
                  onClick={openDatePicker}
                  onKeyDown={blockTypingOnDate}
                  aria-readonly="true"
                  aria-haspopup="dialog"
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                              ${(!currentEducation.startDate && educationErrors?.startDate)
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : 'border-input'}
                              ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                              placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                              disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`}
                  aria-invalid={!currentEducation.startDate && !!educationErrors?.startDate}
                  value={currentEducation.startDate}
                  onChange={(e) => {
                    setCurrentEducation(prev => ({ ...prev, startDate: e.target.value }));
                    setEducationErrors(prev => ({ ...prev, startDate: '' }));
                  }}
                  onBlur={(e) => {
                    const v = clampToPast1920(e.target.value);
                    setCurrentEducation(prev => {
                      const ordered = keepStartBeforeEnd(v, prev.endDate);
                      return { ...prev, startDate: ordered.start, endDate: ordered.end };
                    });
                  }}
                  min={MIN_ISO_1920}
                  max={todayISO()}
                />

                {educationErrors.startDate &&
                <p className="text-red-500 text-xs mt-1">{educationErrors.startDate}</p>
                }
              </div>
              <div>
                <Label htmlFor="education-end-date">End Date *</Label>
                <Input
                  id="education-end-date"
                  type="date"
                  onFocus={openDatePicker}
                  onClick={openDatePicker}
                  onKeyDown={blockTypingOnDate}
                  aria-readonly="true"
                  aria-haspopup="dialog"
                  className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                              ${(!currentEducation.endDate && educationErrors?.endDate)
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : 'border-input'}
                              ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                              placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                              disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`}
                  aria-invalid={!currentEducation.endDate && !!educationErrors?.endDate}
                  value={currentEducation.endDate}
                  onChange={(e) => {
                    setCurrentEducation(prev => ({ ...prev, endDate: e.target.value }));
                    setEducationErrors(prev => ({ ...prev, endDate: '' }));
                  }}
                  onBlur={(e) => {
                    const v = clampToPast1920(e.target.value);
                    setCurrentEducation(prev => {
                      const ordered = keepStartBeforeEnd(prev.startDate, v);
                      return { ...prev, startDate: ordered.start, endDate: ordered.end };
                    });
                  }}
                  min={currentEducation.startDate || MIN_ISO_1920}
                  max={todayISO()}
                />

                {educationErrors.endDate &&
                <p className="text-red-500 text-xs mt-1">{educationErrors.endDate}</p>
                }
              </div>
            </div>

            <div>
              <Label htmlFor="education-document-upload">Upload Related Document *</Label>
              <div
                id="education-document-upload"
                onDrop={(e) => handleFileDrop(e, 'education')}
                onDragOver={(e) => handleDragOver(e, 'education')}
                onDragLeave={(e) => handleDragLeave(e, 'education')}
                className={`bg-[#ffffff] text-center p-6 border-2 border-dashed rounded-lg transition-colors
                          ${educationErrors?.documentUrl ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={!!educationErrors?.documentUrl}>

                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <label htmlFor="education-file-input" className="mt-2 text-sm text-blue-600 font-semibold cursor-pointer hover:underline">
                  Click to upload
                </label>
                <input
                  id="education-file-input"
                  type="file"
                  className="hidden"
                  onChange={handleEducationFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png" />

                <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
                {currentEducation.documentUrl &&
                <p className="text-sm text-green-600 mt-2">File selected: {currentEducation.documentUrl.split('/').pop()}</p>
                }
              </div>
              {educationErrors.documentUrl &&
              <p className="text-red-500 text-xs mt-1">{educationErrors.documentUrl}</p>
              }
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Please upload a clear, readable copy of your degree or transcript. Supported formats: PDF, JPG, PNG.
            </div>

            {hasEducationInput &&
            <div className="mt-2">
                <GlobalSelectedItem
                variant="preview"
                previewLabel="Live preview"
                title={currentEducation.degree || '—'}
                subtitle={
                [currentEducation.institution, currentEducation.field].
                filter(Boolean).
                join(' • ') || undefined
                }
                notes={
                currentEducation.startDate || currentEducation.endDate ?
                `${currentEducation.startDate || '—'} to ${currentEducation.endDate || '—'}` :
                undefined
                }
                // informational only; no onClick to avoid changing logic
                className="cursor-default"
                fileUrl={currentEducation.documentUrl} // Added prop
                fileLabel="View document" // Added prop
              />
              </div>
            }

            <div className="mt-4">
              <Button
                onClick={addEducation}
                className="flex items-center justify-center gap-2 w-full"
                style={{
                  backgroundColor: isEducationFormValid() ? 'var(--button-active, #22b41e)' : 'var(--button-inactive, #959595)',
                  color: 'white'
                }}>

                <Plus className="mr-2 h-4 w-4" /> {/* Added mr-2 */}
                {editingEducationId ? 'Update Education' : 'Add Education'}
              </Button>
            </div>
          </div>

        {/* Display existing education entries */}
        {personalInfo.education && personalInfo.education.length > 0 &&
        <>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Added Education ({personalInfo.education.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalInfo.education.map((edu, index) =>
            <div key={index} className="bg-gray-100 rounded-lg p-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 break-words">{edu.degree}</p>
                    <p className="text-xs text-gray-600 break-words">{edu.institution} - {edu.field}</p>
                    <p className="text-xs text-gray-500">{edu.startDate} to {edu.endDate}</p>
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    {edu.documentUrl &&
                <Tip label="View document">
                        <a
                    href={edu.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 p-1"
                    aria-label={`View document for ${edu.degree}`}>

                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Tip>
                }
                    <Tip label="Edit">
                      <button onClick={() => editEducation(index)} className="text-gray-500 hover:text-blue-500 p-1" aria-label={`Edit ${edu.degree}`}>
                        <Edit className="h-3 w-3" />
                      </button>
                    </Tip>
                    <Tip label="Remove">
                      <button onClick={() => removeEducation(index)} className="text-gray-500 hover:text-red-500 p-1" aria-label={`Remove ${edu.degree}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Tip>
                  </div>
                </div>
            )}
            </div>
          </>
        }
      </div>

      {/* Professional Certifications Section */}
      <div className="py-3 space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Award className="mr-2 h-5 w-5" />
          Professional Certifications
        </h3>

        {/* Certification Form */}
        <div className="p-4 border-2 border-dashed rounded-lg bg-gray-50">
          <h4 className="text-md font-medium mb-4">Add New Certification</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cert-name">Certification Name *</Label>
              <Input
                id="cert-name"
                placeholder="e.g., AWS Certified Solutions Architect"
                value={currentCertification.name}
                onChange={(e) => {
                  handleCertificationChange('name', e.target.value);
                }}
                aria-invalid={!!certificationErrors.name ? 'true' : 'false'}
                className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                            ${!!certificationErrors.name ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}
                            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                            disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`} />


              {certificationErrors.name && <p className="text-red-500 text-xs mt-1">{certificationErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="cert-issuer">Issuing Organization *</Label>
              <Input
                id="cert-issuer"
                placeholder="e.g., Amazon Web Services"
                value={currentCertification.issuer}
                onChange={(e) => {
                  handleCertificationChange('issuer', e.target.value);
                }}
                aria-invalid={!!certificationErrors.issuer ? 'true' : 'false'}
                className={`px-3 py-2 text-base flex h-10 w-full rounded-md border
                            ${!!certificationErrors.issuer ? 'border-red-500 focus-visible:ring-red-500' : 'border-input'}
                            ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground
                            placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                            disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`} />


              {certificationErrors.issuer && <p className="text-red-500 text-xs mt-1">{certificationErrors.issuer}</p>}
            </div>
            <div>
              <Label htmlFor="cert-year">Year Obtained *</Label>
              <Select
                value={currentCertification.year}
                onValueChange={(value) => {
                  handleCertificationChange('year', value);
                }}>

                <SelectTrigger
                  id="cert-year"
                  aria-invalid={!!certificationErrors.year ? 'true' : 'false'}
                  className={certificationErrors.year ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) =>
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {certificationErrors.year && <p className="text-red-500 text-xs mt-1">{certificationErrors.year}</p>}
            </div>
            <div>
              <Label htmlFor="cert-url">Certificate URL (Optional)</Label>
              <Input
                id="cert-url"
                placeholder="https://..."
                value={currentCertification.certificateUrl}
                onChange={(e) => handleCertificationChange('certificateUrl', e.target.value)} />

            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="cert-document-upload">Upload Related Document *</Label>
            <div
              id="cert-document-upload"
              onDrop={(e) => handleFileDrop(e, 'certification')}
              onDragOver={(e) => handleDragOver(e, 'certification')}
              onDragLeave={(e) => handleDragLeave(e, 'certification')}
              className={`bg-[#ffffff] text-center p-6 border-2 border-dashed rounded-lg transition-colors ${certificationErrors.documentUrl ? 'border-red-500' : 'border-gray-300'}`}
              aria-invalid={!!certificationErrors.documentUrl ? 'true' : 'false'}>

              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <label htmlFor="certification-file-input" className="mt-2 text-sm text-blue-600 font-semibold cursor-pointer hover:underline">
                Click to upload
              </label>
              <input
                id="certification-file-input"
                type="file"
                className="hidden"
                onChange={handleCertificationFileUpload}
                accept=".pdf,.jpg,.jpeg,.png" />

              <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
              {currentCertification.documentUrl &&
              <p className="text-sm text-green-600 mt-2">File selected: {currentCertification.documentUrl.split('/').pop()}</p>
              }
            </div>
            {certificationErrors.documentUrl &&
            <p className="text-red-500 text-xs mt-1">{certificationErrors.documentUrl}</p>
            }
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Upload any relevant professional certifications. Supported formats: PDF, JPG, PNG.
          </div>

          {hasCertificationInput &&
          <div className="mt-2">
              <GlobalSelectedItem
              variant="preview"
              previewLabel="Live preview"
              title={currentCertification.name || '—'}
              subtitle={currentCertification.issuer || undefined}
              notes={
              currentCertification.year ?
              `${currentCertification.year}${currentCertification.certificateUrl ? ` • ${currentCertification.certificateUrl}` : ''}` :
              currentCertification.certificateUrl || undefined
              }
              className="cursor-default"
              fileUrl={currentCertification.documentUrl} // Added prop
              fileLabel="View document" // Added prop
            />
            </div>
          }

          <div className="mt-4">
            <Button
              onClick={addCertification}
              className="flex items-center justify-center gap-2 w-full"
              style={{
                backgroundColor: isCertificationFormValid() ? 'var(--button-active, #22b41e)' : 'var(--button-inactive, #959595)',
                color: 'white'
              }}>

              <Plus className="mr-2 h-4 w-4" /> {/* Added mr-2 */}
              {editingCertificationId ? 'Update Certification' : 'Add Certification'}
            </Button>
          </div>
        </div>

        {/* Added Certifications Display */}
        {personalInfo.certifications && personalInfo.certifications.length > 0 &&
        <>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Added Certifications ({personalInfo.certifications.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personalInfo.certifications.map((cert, index) =>
            <div key={index} className="bg-gray-100 rounded-lg p-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 break-words">{cert.name}</p>
                    <p className="text-xs text-gray-600 break-words">{cert.issuer} - {cert.year}</p>
                  </div>
                  <div className="flex-shrink-0 flex gap-1">
                    {cert.documentUrl &&
                <Tip label="View document">
                        <a
                    href={cert.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 p-1"
                    aria-label={`View document for ${cert.name}`}>

                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Tip>
                }
                    <Tip label="Edit">
                      <button onClick={() => editCertification(index)} className="text-gray-500 hover:text-blue-500 p-1" aria-label={`Edit ${cert.name}`}>
                        <Edit className="h-3 w-3" />
                      </button>
                    </Tip>
                    <Tip label="Remove">
                      <button onClick={() => removeCertification(index)} className="text-gray-500 hover:text-red-500 p-1" aria-label={`Remove ${cert.name}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Tip>
                  </div>
                </div>
            )}
            </div>
          </>
        }
      </div>

      {/* Bottom navigation from Education to Teaching Experience (optional prop) */}
      {typeof setActiveTab === 'function' &&
      <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setActiveTab('TEACHING_EXPERIENCE')}>
            Next: Teaching Experience
          </Button>
        </div>
      }
    </div>);

};

export default Education;
