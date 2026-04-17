
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { User } from '@/api/entities';
import { TeacherProfile } from '@/api/entities';

import { useTeacher } from './TeacherContext';

// Import components
import PersonalInfoForm from './PersonalInfoForm';
import PhotoUploadForm from './PhotoUploadForm';
import AboutForm from './AboutForm';
import VideoUploadForm from './VideoUploadForm';
import AvailabilityAndPricingForm from './AvailabilityAndPricingForm';
import FormValidation from './FormValidation';
import AuthorizationGate from './AuthorizationGate';
import ProgressBar from '../common/ProgressBar';
import { persistenceManager } from '../common/PersistenceManager';
import { TEACHER_PROFILE_CONFIG } from '../config/teacherProfileConfig';
import CustomAlertModal from '../common/CustomAlertModal';

// Development mode bypass
const DEVELOPMENT_MODE = true;

const TeacherForm = () => {
  // Registration Steps - FIXED: Start at step 1 instead of 5
  const [currentStep, setCurrentStep] = useState(1); // Changed from 5 to 1
  const [currentSubStep, setCurrentSubStep] = useState(1); // Changed from 3 to 1
  const [isComplete, setIsComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isStepValid, setIsStepValid] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false); // NEW: Track when to show validation
  const [hasPricingErrors, setHasPricingErrors] = useState(false);
  const [pricingValidationDetails, setPricingValidationDetails] = useState({});
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, message: '' }); // ADDED

  // Get state and dispatchers from context
  // Expanded destructuring to include all necessary setters for persistence
  const {
    personalInfo, setPersonalInfo,
    services, setServices,
    packages, setPackages,
    isAgeConfirmed, setIsAgeConfirmed,
    errors, setErrors,
    teachingSubjects, dispatchTeachingSubjects,
    allSpecs, dispatchAllSpecs,
    allBoards, dispatchAllBoards,
    allExams, dispatchAllExams,
    availability, dispatchAvailability
  } = useTeacher();

  // Access package tiers configuration
  const { PACKAGE_TIERS } = TEACHER_PROFILE_CONFIG;

  // Load state from localStorage on initial mount - RESTORED: Uncommented this logic
  useEffect(() => {
    const loadProgress = async () => {
      const savedStep = await persistenceManager.get('currentStep', 1);
      const savedSubStep = await persistenceManager.get('currentSubStep', 1);
      const savedData = await persistenceManager.get('formData');
      
      if (savedData) {
        if (savedData.personalInfo) setPersonalInfo(savedData.personalInfo);
        if (savedData.isAgeConfirmed !== undefined) setIsAgeConfirmed(savedData.isAgeConfirmed);
        if (savedData.teachingSubjects) dispatchTeachingSubjects({ type: 'SET_TEACHING_SUBJECTS', payload: savedData.teachingSubjects });
        if (savedData.allSpecs) dispatchAllSpecs({ type: 'SET_ALL_SPECS', payload: savedData.allSpecs });
        if (savedData.allBoards) dispatchAllBoards({ type: 'SET_ALL_BOARDS', payload: savedData.allBoards });
        if (savedData.allExams) dispatchAllExams({ type: 'SET_ALL_EXAMS', payload: savedData.allExams });
        if (savedData.availability) dispatchAvailability({ type: 'SET_AVAILABILITY', payload: savedData.availability });
        if (savedData.services) setServices(savedData.services);
        if (savedData.packages) setPackages(savedData.packages);
      }
      setCurrentStep(savedStep);
      setCurrentSubStep(savedSubStep);
    };
    loadProgress();
  }, [setPersonalInfo, setIsAgeConfirmed, dispatchTeachingSubjects, dispatchAllSpecs, dispatchAllBoards, dispatchAllExams, dispatchAvailability, setServices, setPackages]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    persistenceManager.save('currentStep', currentStep);
    persistenceManager.save('currentSubStep', currentSubStep);
    // Gather all relevant form data into a single object for persistence
    const formDataToSave = {
      personalInfo,
      isAgeConfirmed,
      teachingSubjects,
      allSpecs,
      allBoards,
      allExams,
      availability,
      services, // Added for persistence
      packages // Added for persistence
    };
    persistenceManager.save('formData', formDataToSave);
  }, [currentStep, currentSubStep, personalInfo, isAgeConfirmed, teachingSubjects, allSpecs, allBoards, allExams, availability, services, packages]);

  // Load user data
  useEffect(() => {
      loadUser();
    }, []);
    
  // Always start at top when the user navigates between steps/substeps
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep, currentSubStep]);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  // Step validation - UPDATED: Added showValidationErrors parameter
  const validateStep = useCallback((step, isSilent = false, shouldShowErrors = false, subStep = currentSubStep) => {
    const newErrors = {};
    let isValid = true;
    
    if (shouldShowErrors) {
      setShowValidationErrors(true);
    }
    
    switch (step) {
      case 1:
        if (!personalInfo.firstName) newErrors.firstName = 'First name is required';
        if (!personalInfo.lastName) newErrors.lastName = 'Last name is required';
        if (!personalInfo.phone) newErrors.phone = 'Phone number is required';
        else if (!personalInfo.phoneVerified) newErrors.phone = 'Please verify your phone number';
        if (!personalInfo.country) newErrors.country = 'Country is required';
        if (!personalInfo.location) newErrors.location = 'City is required';
        if (!isAgeConfirmed) newErrors.isAgeConfirmed = 'You must confirm you are 18 or older.';
        if (!personalInfo.education || personalInfo.education.length === 0) {
          newErrors.education = 'Please add at least one educational qualification';
        }
        if (!personalInfo.languages || personalInfo.languages.length === 0) {
          newErrors.languages = 'At least one language is required';
        }
        if (!teachingSubjects || teachingSubjects.length === 0) {
          newErrors.subjects = 'At least one subject is required';
        }
        break;
      case 2:
        if (!personalInfo.profilePicture) newErrors.photo = 'A profile photo is required';
        break;
      case 3:
        if (!personalInfo.bio || personalInfo.bio.length < 50) {
          newErrors.bio = 'Bio must be at least 50 characters long';
        }
        break;
      case 4:
        break;
       case 5: {
        // Read pricing flags; only explicit false is invalid
        const details = pricingValidationDetails || {};
        
        if (subStep === 1) {
          // 5a: Pricing only
          const hasOtherTabErrors = details.anyReportedTierErrors === true;

          // NEW (ADD-ONLY): use precise package validity meta from child
          const hasAtLeastOneValidEnabledPackage = details.hasAtLeastOneValidEnabledPackage === true;
          const hasInvalidEnabledPackages = details.hasInvalidEnabledPackages === true;
          const enabledPkgCount = typeof details.enabledPackagesCount === 'number' ? details.enabledPackagesCount : 0;

          const pricingHasErrors =
            !!details.hasUnpricedServices ||
            (details.isTrialPriceValid === false) ||
            hasOtherTabErrors ||
            (enabledPkgCount > 0 && !hasAtLeastOneValidEnabledPackage) ||   // NEW: must have ≥1 valid enabled package
            (enabledPkgCount > 0 && hasInvalidEnabledPackages);             // NEW: any enabled package invalid → block

          if (pricingHasErrors) {
            if (details.hasUnpricedServices) {
              newErrors.pricing = 'Please set hourly rates for all selected services.';
            }
            if (details.isTrialPriceValid === false) {
              newErrors.trial = 'Please configure trial lesson pricing correctly.';
            }
            if (enabledPkgCount > 0 && hasOtherTabErrors) {
              newErrors.packageTabs = 'Some package sizes in the current card have errors. Please fix ALL size tabs before continuing.';
            }
            if (enabledPkgCount > 0 && !hasAtLeastOneValidEnabledPackage) {
              newErrors.packages = (newErrors.packages ? newErrors.packages + ' ' : '') +
                'Please add at least one correctly priced package size.';
            }
            if (enabledPkgCount > 0 && hasInvalidEnabledPackages) {
              newErrors.packageTabs = (newErrors.packageTabs ? newErrors.packageTabs + ' ' : '') +
                'Some enabled packages have size errors. Please fix them.';
            }
          }

          isValid = !pricingHasErrors;
          setHasPricingErrors(pricingHasErrors);
          break;
        }

        if (subStep === 2) {
          // 5b: permissive (empty for now)
          isValid = true;
          setHasPricingErrors(false);
          break;
        }

        // 5c: Availability + Pricing
        let hasTimeSlots = false;
        Object.entries(availability.slots || {}).forEach(([day, slots]) => {
          if (slots && slots.length > 0) {
            hasTimeSlots = true;
            slots.forEach((slot, index) => {
              // IMPORTANT: use startHour/endHour (not start/end)
              const sh = slot.startHour;
              const eh = slot.endHour;
              if ((sh != null && eh == null) || (sh == null && eh != null)) {
                isValid = false;
                newErrors.timeSlots = 'Please fill both Start and End times for all open slots, or close them.';
                dispatchAvailability({ type: 'SET_SLOT_ERROR', payload: { day, index, error: 'Incomplete time slot' } });
              }
            });
          }
        });

        if (!hasTimeSlots) {
          newErrors.timeSlots = 'Please add at least one available time slot.';
          isValid = false;
        }

        // Removed duplicate declaration of 'details'
        const pricingHasErrors =
          !!details.hasUnpricedServices ||
          !!details.hasUnpricedPackages ||
          (details.isTrialPriceValid === false);

        if (pricingHasErrors) {
          if (details.hasUnpricedServices) newErrors.pricing = 'Please set hourly rates for all selected services.';
          if (details.hasUnpricedPackages) newErrors.packages = 'Please set prices for all selected packages.';
          if (details.isTrialPriceValid === false) newErrors.trial = 'Please configure trial lesson pricing correctly.';
        }

        isValid = isValid && !pricingHasErrors;
        setHasPricingErrors(pricingHasErrors);
        break;
      }
    }
    
    setIsStepValid(isValid);

    if (!isSilent) {
        setErrors(newErrors);
    }
    
    return isValid;
  }, [
    personalInfo, isAgeConfirmed, teachingSubjects, allSpecs, allBoards, allExams,
    availability, services, packages, pricingValidationDetails,
    currentStep, currentSubStep, dispatchAvailability, setErrors
  ]);

  // Re-validate whenever data changes.
  // If we are currently showing validation errors, re-run in NON-silent mode
  // so the bottom error list updates live and removes fixed items immediately.
  useEffect(() => {
    const silent = !showValidationErrors;  // false => setErrors(newErrors)
    validateStep(currentStep, silent, false, currentSubStep);
  }, [
    personalInfo, isAgeConfirmed, teachingSubjects, allSpecs, allBoards, allExams,
    availability, services, packages, pricingValidationDetails,
    currentStep, currentSubStep, showValidationErrors, validateStep
  ]);

  // Show validation errors immediately when user tries to proceed but validation fails
  useEffect(() => {
    if (showValidationErrors) {
      const timer = setTimeout(() => {
        // Keep validation errors visible until user fixes them or navigates away
      const isCurrentStepValid = validateStep(currentStep, true, false, currentSubStep); // silent + substep

        if (isCurrentStepValid) {
          setShowValidationErrors(false);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showValidationErrors, currentStep, currentSubStep, personalInfo, teachingSubjects, availability, services, packages, validateStep]);
  
  const next = () => {
    // Gate Step 5a: aggregate both errors into one popup (no early returns)
    if (currentStep === 5 && currentSubStep === 1) {
      const messages = [];

      // (1) No non-trial service selected
      const hasEnabledNonTrial = (services || []).some(s => s.enabled && !s.isTrial);
      if (!hasEnabledNonTrial) {
        messages.push('Please select at least one service (not a trial lesson) to continue.');
      }

      // (2) Enabled packages missing at least one valid size
      const enabledPackages = (packages || []).filter(p => p.enabled); // disabled never block
      const tiersList = PACKAGE_TIERS || [];

      const incompletePackages = enabledPackages.filter(p => {
        if (!Array.isArray(tiersList) || tiersList.length === 0) return false;

        // At least ONE tier must have BOTH fields present and valid (>0 numbers)
        const hasAtLeastOneValidTier = tiersList.some(tier => {
          const s = (p.tierData && p.tierData[tier.name]) || {};
          if (!s.hours || !s.totalStr) return false;
          const hours = parseFloat(s.hours);
          const total = parseFloat(s.totalStr);
          return Number.isFinite(hours) && hours > 0 && Number.isFinite(total) && total > 0;
        });

        return !hasAtLeastOneValidTier;
      });

      if (incompletePackages.length > 0) {
        const names = incompletePackages.map(p => p.title).join(', ');
        messages.push(`Please complete at least one package size for: ${names}, or disable these packages by clicking the checkmark.`);
      }

      if (messages.length > 0) {
        setShowValidationErrors(true); // drives red outlines on enabled invalid package cards
        setAlertInfo({ isOpen: true, message: messages.join('\n\n') }); // REPLACED window.alert
        return; // block navigation
      }
    }

    if (currentStep === 5) {
      if (currentSubStep < 3) {
        const stepIsValid = validateStep(currentStep, false, true, currentSubStep);
        if (stepIsValid) {
          setCurrentSubStep(prev => prev + 1);
          setShowValidationErrors(false);
        }
      }
    } else {
      const stepIsValid = validateStep(currentStep, false, true, currentSubStep);
      if (stepIsValid) {
        setCurrentStep(prev => Math.min(prev + 1, 5));
        setCurrentSubStep(1);
        setShowValidationErrors(false);
      }
    }
  };

  const prev = () => {
    setShowValidationErrors(false);
    
    if (currentStep === 5) {
      if (currentSubStep > 1) {
        setCurrentSubStep(prev => prev - 1);
      } else {
        setCurrentStep(prev => Math.max(prev - 1, 1));
      }
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  const generateSearchTags = () => {
    const tags = [];
    teachingSubjects.forEach(subject => {
      tags.push(subject.subject.toLowerCase());
      tags.push(subject.level.toLowerCase());
      tags.push(`${subject.subject} ${subject.level}`.toLowerCase());
    });
    allSpecs.forEach(spec => {
      tags.push(spec.specialization.toLowerCase());
      tags.push(spec.subject.toLowerCase());
    });
    allBoards.forEach(board => {
      tags.push(board.boardName.toLowerCase());
      tags.push(board.subject.toLowerCase());
    });
    allExams.forEach(exam => {
      tags.push(exam.examName.toLowerCase());
      tags.push(exam.subject.toLowerCase());
    });
    personalInfo.languages.forEach(lang => {
      tags.push(lang.language.toLowerCase());
      tags.push(`${lang.language} ${lang.proficiency}`.toLowerCase());
    });
    if (personalInfo.experience.online_years > 0) {
      tags.push('online teaching');
      tags.push(`${personalInfo.experience.online_years} years online`);
    }
    if (personalInfo.experience.offline_years > 0) {
      tags.push('offline teaching');
      tags.push(`${personalInfo.experience.offline_years} years offline`);
    }
    Object.entries(availability.slots || {}).forEach(([day, slots]) => {
      if (slots && slots.length > 0) {
        tags.push(`available ${day}`);
        tags.push(`${day} classes`);
        slots.forEach(slot => {
          const timeOfDay = slot.startHour < 12 ? 'morning' : slot.startHour < 17 ? 'affternoon' : 'evening';
          tags.push(`${timeOfDay} classes`);
        });
      }
    });
    if (personalInfo.location) {
      tags.push(personalInfo.location.toLowerCase());
    }
    return [...new Set(tags)];
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (!validateStep(currentStep, false, true)) {
      setLoading(false);
      return;
    }
    
    try {
      const searchTags = generateSearchTags();
      const availabilitySearchData = {
        weeklyAvailability: Object.entries(availability.slots || {}).reduce((acc, [day, slots]) => {
          if (slots && slots.length > 0) {
            acc[day] = slots.map(slot => ({
              start: slot.startHour,
              end: slot.endHour,
              timeOfDay: slot.startHour < 12 ? 'morning' : slot.startHour < 17 ? 'affternoon' : 'evening'
            }));
          }
          return acc;
        }, {}),
        availableDays: Object.keys(availability.slots || {}).filter(day => 
          availability.slots[day] && availability.slots[day].length > 0
        ),
        timePreferences: Object.entries(availability.slots || {}).reduce((acc, [day, slots]) => {
          if (slots && slots.length > 0) {
            slots.forEach(slot => {
              const timeOfDay = slot.startHour < 12 ? 'morning' : slot.startHour < 17 ? 'affternoon' : 'evening';
              if (!acc[timeOfDay]) acc[timeOfDay] = [];
              if (!acc[timeOfDay].includes(day)) {
                acc[timeOfDay].push(day);
              }
            });
          }
          return acc;
        }, {})
      };
      
      const getPrice = (serviceId) => {
        const service = services.find(s => s.id === serviceId && s.enabled && typeof s.price === 'number');
        return service ? service.price : 0; // Default to 0 to ensure it's always a number.
      };

      const regularRate = getPrice('consulting') || getPrice('onlineClass') || 0;

      const profileData = {
        user_id: user.id,
        personalInfo: {
          fullName: personalInfo.fullName,
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          phoneVerified: personalInfo.phoneVerified,
          location: personalInfo.location,
          country: personalInfo.country,
          timezone: personalInfo.timezone,
          bio: personalInfo.bio,
          profilePicture: personalInfo.profilePicture,
          videoIntro: personalInfo.videoIntro,
          isVerified: false
        },
        subjects: teachingSubjects,
        specializations: allSpecs,
        boards: allBoards,
        exams: allExams,
        experience: personalInfo.experience,
        languages: personalInfo.languages,
        hourly_rate: {
          regular: regularRate,
          consulting: getPrice('consulting'),
          interview_prep: getPrice('technicalInterview'),
          trial: services.find(s => s.id === 'trial')?.trialPercentage || 0,
        },
        services: services,
        packages: packages,
        education: personalInfo.education || [],
        certifications: personalInfo.certifications || [],
        workHistory: personalInfo.workHistory || [],
        teachingHistory: personalInfo.teachingHistory || [],
        availability_schedule: availability.slots,
        availability_window: availability.availabilityWindow,
        advance_booking_policy: availability.farAdvanceBookingFromStudent,
        break_after_class_hours: availability.breakAfterClassInHours,
        verification_status: 'pending',
        status: 'active',
        search_keywords: searchTags,
        searchMetadata: {
          allTags: searchTags,
          availabilitySearchData,
          lastUpdated: new Date(),
          searchRanking: 1,
          profileCompleteness: calculateProfileCompleteness()
        }
      };

      await TeacherProfile.create(profileData);
      setIsComplete(true);
      await persistenceManager.clear();
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = () => {
    let score = 0;
    if (personalInfo.fullName) score += 5;
    if (personalInfo.email) score += 5;
    if (personalInfo.profilePicture) score += 15;
    if (personalInfo.bio) score += 15;
    if (personalInfo.videoIntro) score += 10;
    if (teachingSubjects.length > 0) score += 20;
    if (allSpecs.length > 0) score += 10;
    if (personalInfo.education && personalInfo.education.length > 0) score += 10;
    if (Object.keys(availability.slots || {}).some(day => availability.slots[day]?.length > 0)) score += 10;
    if (services && services.length > 0) score += 5;
    if (packages && packages.length > 0) score += 5;
    return Math.min(score, 100); 
  };

  const steps = [
    { number: 1, title: 'Personal Info', component: PersonalInfoForm },
    { number: 2, title: 'Profile Photo', component: PhotoUploadForm },
    { number: 3, title: 'About You', component: AboutForm },
    { number: 4, title: 'Video Intro', component: VideoUploadForm },
    { number: 5, title: 'Availability & Pricing', component: AvailabilityAndPricingForm }
  ];

  if (!DEVELOPMENT_MODE) {
    return <AuthorizationGate />;
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your teacher profile has been submitted for review. You'll be notified once it's approved.
            </p>
            <Button onClick={() => window.location.href = '/dashboard'} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CurrentStepComponent = steps.find(s => s.number === currentStep).component;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <CustomAlertModal
        isOpen={alertInfo.isOpen}
        onClose={() => setAlertInfo({ isOpen: false, message: '' })}
        message={alertInfo.message}
      />
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <ProgressBar 
            currentStep={currentStep}
            currentSubStep={currentSubStep}
            steps={steps.map(s => ({ number: s.number, title: s.title }))}
            showSubSteps={true}
            subStepTargetStep={5}
            subStepsCount={3}
          />

          <div className="w-full max-w-4xl mx-auto mb-8">
              <CurrentStepComponent 
                currentSubStep={currentStep === 5 ? currentSubStep : 1} 
                setCurrentSubStep={setCurrentSubStep}
                showValidationErrors={showValidationErrors}
                onValidationChange={currentStep === 5 ? (isValid, details) => {
                  setPricingValidationDetails(details || {});
                  setHasPricingErrors(!isValid);
                } : undefined}
              />
          </div>

          {/* REMOVED: PendingDataDisplay card - teachers see status inline and in dashboard */}

          <div className="flex justify-center space-x-4">
            {(currentStep > 1 || (currentStep === 5 && currentSubStep > 1)) && (
              <Button 
                variant="outline" 
                onClick={prev}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
            )}
            
            {(currentStep < 5 || (currentStep === 5 && currentSubStep < 3)) ? (
              <Button 
                onClick={next}
                // Make Next always clickable on 5a/5b; block progression via validateStep()
                disabled={loading}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                // Final gate (5c): disable if invalid
                disabled={loading || !isStepValid || hasPricingErrors}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {loading ? 'Submitting...' : 'Complete Registration'}
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>

          <FormValidation errors={errors} />
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;
