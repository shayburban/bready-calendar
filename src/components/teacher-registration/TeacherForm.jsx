
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { User } from '@/api/entities';
import { TeacherProfile } from '@/api/entities';
import { submitTeacherProfile } from '@/api/teacherRegistrationApi';

import { useTeacher } from './TeacherContext';
import { useFormAutoSave } from './persistence/useFormAutoSave';
import { serializeFormState, hydrateFormState } from './persistence/serialize';
import CustomDataSubmissionService from './approval/CustomDataSubmissionService';
import {
  syncRegistrationAvailabilityToCalendar,
  slotStart,
  slotEnd,
  slotStartHourNum,
} from '@/lib/scheduling/registrationAvailability';

// localStorage key tracking which custom catalog entries already have a
// pending_data row, so a retry/double-submit never creates duplicates.
const PENDING_SUBMITTED_KEY = 'teacher_reg_pending_submitted';

const readSubmittedSet = () => {
  try { return new Set(JSON.parse(localStorage.getItem(PENDING_SUBMITTED_KEY) || '[]')); }
  catch { return new Set(); }
};
const writeSubmittedSet = (set) => {
  try { localStorage.setItem(PENDING_SUBMITTED_KEY, JSON.stringify([...set])); } catch { /* noop */ }
};

// Import components
import PersonalInfoForm from './PersonalInfoForm';
import PhotoUploadForm from './PhotoUploadForm';
import AboutForm from './AboutForm';
import VideoUploadForm from './VideoUploadForm';
import AvailabilityAndPricingForm from './AvailabilityAndPricingForm';
import FormValidation from './FormValidation';
import AuthorizationGate from './AuthorizationGate';
import ProgressBar from '../common/ProgressBar';
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
  const submittingRef = useRef(false); // in-flight guard against double-submit
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

  // ---- Centralized autosave engine (localStorage + Supabase draft) ----
  const [hydrated, setHydrated] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(null); // { candidate, step, subStep, source }

  // Apply a hydrated snapshot into context (shared by initial load + resume).
  const applySavedData = useCallback((savedData) => {
    if (!savedData) return;
    if (savedData.personalInfo) setPersonalInfo(savedData.personalInfo);
    if (savedData.isAgeConfirmed !== undefined) setIsAgeConfirmed(savedData.isAgeConfirmed);
    if (savedData.teachingSubjects) dispatchTeachingSubjects({ type: 'SET_TEACHING_SUBJECTS', payload: savedData.teachingSubjects });
    if (savedData.allSpecs) dispatchAllSpecs({ type: 'SET_ALL_SPECS', payload: savedData.allSpecs });
    if (savedData.allBoards) dispatchAllBoards({ type: 'SET_ALL_BOARDS', payload: savedData.allBoards });
    if (savedData.allExams) dispatchAllExams({ type: 'SET_ALL_EXAMS', payload: savedData.allExams });
    if (savedData.availability) dispatchAvailability({ type: 'SET_AVAILABILITY', payload: savedData.availability });
    if (savedData.services) setServices(savedData.services);
    if (savedData.packages) setPackages(savedData.packages);
  }, [setPersonalInfo, setIsAgeConfirmed, dispatchTeachingSubjects, dispatchAllSpecs, dispatchAllBoards, dispatchAllExams, dispatchAvailability, setServices, setPackages]);

  // Compact, sanitized snapshot of the whole form — the unit of persistence.
  const snapshot = useMemo(
    () => serializeFormState({
      personalInfo, isAgeConfirmed, teachingSubjects, allSpecs,
      allBoards, allExams, availability, services, packages,
    }),
    [personalInfo, isAgeConfirmed, teachingSubjects, allSpecs, allBoards, allExams, availability, services, packages]
  );
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const autosave = useFormAutoSave({ snapshot, currentStep, currentSubStep, enabled: hydrated });

  // Initial load: pick the freshest of {localStorage, backend draft}, hydrate,
  // prime the engine so it doesn't immediately re-save what we just loaded, and
  // surface a Resume prompt when local and remote meaningfully diverge.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const initial = await autosave.loadInitial();
      if (cancelled) return;
      if (initial.source !== 'submitted' && initial.snapshot) {
        const data = hydrateFormState(initial.snapshot);
        applySavedData(data);
        setCurrentStep(initial.currentStep || 1);
        setCurrentSubStep(initial.currentSubStep || 1);
        autosave.setBaseVersion(initial.version || 0);
        autosave.markSynced(serializeFormState(data));
        if (initial.hasConflict && initial.localSnapshot) {
          setResumePrompt({
            candidate: initial.localSnapshot,
            step: initial.localStep,
            subStep: initial.localSubStep,
            source: 'local',
          });
        }
      }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Multi-tab/device reconcile: on window focus, re-read the backend draft; if
  // it diverges from what's on screen, offer to load it (never clobber silently).
  useEffect(() => {
    if (!hydrated) return undefined;
    const onFocus = async () => {
      const res = await autosave.reconcileRemote();
      if (res.ok && res.data && !res.data.submitted && res.data.form_data) {
        if (JSON.stringify(res.data.form_data) !== JSON.stringify(snapshotRef.current)) {
          setResumePrompt({
            candidate: res.data.form_data,
            step: res.data.current_step,
            subStep: res.data.current_sub_step,
            source: 'remote',
          });
        }
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [hydrated, autosave]);

  const applyResume = useCallback(() => {
    if (!resumePrompt) return;
    applySavedData(hydrateFormState(resumePrompt.candidate));
    if (resumePrompt.step) setCurrentStep(resumePrompt.step);
    if (resumePrompt.subStep) setCurrentSubStep(resumePrompt.subStep);
    setResumePrompt(null);
    setTimeout(() => autosave.flushSync(), 0);
  }, [resumePrompt, applySavedData, autosave]);

  const dismissResume = useCallback(() => {
    setResumePrompt(null);
    // Keep what's on screen as the winner — flush it so it wins the next sync.
    setTimeout(() => autosave.flushSync(), 0);
  }, [autosave]);

  // A freshly-uploaded photo URL is the most expensive thing to lose — persist
  // it immediately (don't wait for the debounce) once a real URL lands.
  useEffect(() => {
    if (hydrated && personalInfo.profilePicture && !String(personalInfo.profilePicture).startsWith('blob:')) {
      autosave.flushSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personalInfo.profilePicture, hydrated]);

  // (localStorage + backend draft autosave is now handled by useFormAutoSave.)

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
            // Bad-data sizes (range / total / cross-field / monotonicity / service-rate),
            // named with their package + size. Sourced from details.invalidPackages, which
            // is built from the per-tier red-highlight signal — so a purely EMPTY enabled
            // package has no flagged tier and is NOT reported here (it is covered by the
            // "add at least one" message below). Gate (pricingHasErrors) is unchanged.
            const invalidPackages = Array.isArray(details.invalidPackages) ? details.invalidPackages : [];
            if (enabledPkgCount > 0 && invalidPackages.length > 0) {
              const invalidList = invalidPackages
                .map(p => (p.tiers && p.tiers.length) ? `${p.title} (${p.tiers.join(', ')})` : p.title)
                .join(', ');
              newErrors.packageTabs = `${invalidList} have invalid values. Check the red highlights to fix them, or disable these packages.`;
            }
            if (enabledPkgCount > 0 && !hasAtLeastOneValidEnabledPackage) {
              newErrors.packages = (newErrors.packages ? newErrors.packages + ' ' : '') +
                'Please add at least one correctly priced package size.';
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

        // Booking preferences (paired-dropdown rule: both-or-neither).
        // Mirrors the sidebar's submit-time gate so a half-filled
        // availability_window / advance_booking_policy / break_after_class
        // pair blocks Next here and can never reach TeacherProfile.create.
        // - Empty (both null / falsy / unset) is allowed because these
        //   fields are optional at registration time.
        // - Fully filled (both set) is allowed.
        // - Partial (one set, the other null) is invalid.
        // The user-facing labels match the headings the teacher already
        // sees on Page 5c so the error is self-explanatory.
        const isPartialPair = (field) => {
          if (!field || typeof field !== 'object') return false;
          const hasPref = field.preference != null;
          const hasType = field.preferenceType != null;
          return hasPref !== hasType; // XOR — exactly one set
        };
        const partialPrefFields = [];
        if (isPartialPair(availability.availabilityWindow)) {
          partialPrefFields.push('Availability Window');
        }
        if (isPartialPair(availability.farAdvanceBookingFromStudent)) {
          partialPrefFields.push('How far in advance can students book?');
        }
        if (isPartialPair(availability.breakAfterClassInHours)) {
          partialPrefFields.push('Break after a class');
        }
        if (partialPrefFields.length > 0) {
          newErrors.bookingPreferences =
            `Please complete both the number and time-unit for: ${partialPrefFields.join(', ')}.`;
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
    // Step boundary = guaranteed save checkpoint (bypasses debounce).
    autosave.flushSync();
    // Gate Step 5a: aggregate both errors into one popup (no early returns)
    if (currentStep === 5 && currentSubStep === 1) {
      const messages = [];

      // Source of truth is Step5aPricing's reported details — it validates using the
      // DB-fetched `config.packageTiers`, so the gate can't disagree with card-level
      // validation if the admin renames a tier (the old static-PACKAGE_TIERS path did).
      const details = pricingValidationDetails || {};

      // (1) No non-trial service selected
      if (details.hasEnabledNonTrial === false) {
        messages.push('Please select at least one service (not a trial lesson) to continue.');
      }

      // (2) Selected services missing an hourly rate
      if (details.hasUnpricedServices === true) {
        messages.push('Please set hourly rates for all selected services or disable these packages by clicking the checkmark.');
      }

      // (3) Trial lesson pricing invalid
      if (details.isTrialPriceValid === false) {
        messages.push('Please configure trial lesson pricing correctly.');
      }

      // (4) Enabled packages missing at least one valid size
      const incompletePackages = Array.isArray(details.incompletePackages)
        ? details.incompletePackages
        : [];

      if (incompletePackages.length > 0) {
        const names = incompletePackages.map(p => p.title).join(', ');
        messages.push(`Please complete at least one package size for: ${names}, or disable these packages by clicking the checkmark.`);
      }

      // (5) Enabled packages with genuinely invalid tier data (hours range / total /
      // monotonicity / service-rate), named with their package + size. Distinct from
      // "incomplete" (4) above; a purely empty package is reported by (4), not here.
      const invalidPackages = Array.isArray(details.invalidPackages) ? details.invalidPackages : [];
      if (invalidPackages.length > 0) {
        const invalidList = invalidPackages
          .map(p => (p.tiers && p.tiers.length) ? `${p.title} (${p.tiers.join(', ')})` : p.title)
          .join(', ');
        messages.push(`${invalidList} have invalid values. Check the red highlights to fix them, or disable these packages.`);
      }

      if (messages.length > 0) {
        setShowValidationErrors(true); // drives red outlines on enabled invalid package cards
        setAlertInfo({ isOpen: true, message: messages.join('\n\n') });
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
    autosave.flushSync();
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
      // Only days with real (both-ends-filled) slots — the default per-day row
      // is empty {start:'',end:''} and must not generate "available <day>" tags.
      const realSlots = (slots || []).filter(s => slotStart(s) && slotEnd(s));
      if (realSlots.length > 0) {
        tags.push(`available ${day}`);
        tags.push(`${day} classes`);
        realSlots.forEach(slot => {
          const h = slotStartHourNum(slot);
          if (h != null) {
            const timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
            tags.push(`${timeOfDay} classes`);
          }
        });
      }
    });
    if (personalInfo.location) {
      tags.push(personalInfo.location.toLowerCase());
    }
    return [...new Set(tags)];
  };

  // Submit custom catalog entries to pending_data exactly once. Deduped via a
  // localStorage signature set so retries/double-submits never create duplicates.
  const submitPendingCustomEntries = useCallback(async () => {
    const submitted = readSubmittedSet();
    const items = [];
    (teachingSubjects || []).filter(s => s.isCustom).forEach(s => items.push({ type: 'subject', value: s.subject, related: null }));
    (allSpecs || []).filter(s => s.isCustom).forEach(s => items.push({ type: 'specialization', value: s.specialization, related: s.subject }));
    (allBoards || []).filter(b => b.isCustom).forEach(b => items.push({ type: 'board', value: b.boardName, related: b.subject }));
    (allExams || []).filter(e => e.isCustom).forEach(e => items.push({ type: 'exam', value: e.examName, related: e.subject }));
    ((personalInfo && personalInfo.languages) || []).filter(l => l.pending).forEach(l => items.push({ type: 'language', value: l.language, related: null }));

    for (const it of items) {
      if (!it.value) continue;
      const key = `${it.type}:${it.value}:${it.related || ''}`.toLowerCase();
      if (submitted.has(key)) continue;
      try {
        const res = await CustomDataSubmissionService.submitCustomData(it.type, it.value, {}, it.related);
        if (res?.success) { submitted.add(key); writeSubmittedSet(submitted); }
      } catch { /* best-effort; retried on next submit */ }
    }
  }, [teachingSubjects, allSpecs, allBoards, allExams, personalInfo]);

  const handleSubmit = async () => {
    if (submittingRef.current) return; // in-flight guard against double-submit
    submittingRef.current = true;
    setLoading(true);
    if (!validateStep(currentStep, false, true)) {
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    try {
      const searchTags = generateSearchTags();
      const availabilitySearchData = {
        weeklyAvailability: Object.entries(availability.slots || {}).reduce((acc, [day, slots]) => {
          const realSlots = (slots || []).filter(s => slotStart(s) && slotEnd(s));
          if (realSlots.length > 0) {
            acc[day] = realSlots.map(slot => {
              const h = slotStartHourNum(slot);
              return {
                start: slotStart(slot),
                end: slotEnd(slot),
                timeOfDay: h == null ? null : (h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'),
              };
            });
          }
          return acc;
        }, {}),
        availableDays: Object.keys(availability.slots || {}).filter(day =>
          (availability.slots[day] || []).some(s => slotStart(s) && slotEnd(s))
        ),
        timePreferences: Object.entries(availability.slots || {}).reduce((acc, [day, slots]) => {
          (slots || []).forEach(slot => {
            if (!slotStart(slot) || !slotEnd(slot)) return;
            const h = slotStartHourNum(slot);
            if (h == null) return;
            const timeOfDay = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
            if (!acc[timeOfDay]) acc[timeOfDay] = [];
            if (!acc[timeOfDay].includes(day)) acc[timeOfDay].push(day);
          });
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

      // Custom catalog entries → pending_data, exactly once (deduped).
      await submitPendingCustomEntries();

      // Live backend first; fall back to the in-memory mock when there's no
      // Supabase session (dev mode / offline) so the flow always completes.
      const remote = await submitTeacherProfile(profileData);
      if (!remote.ok) {
        await TeacherProfile.create(profileData);
      }

      // Mirror the weekly availability painted in 5c into the teacher-calendar
      // backend (availability_one_off via set_availability_one_off) — the SAME
      // store the teacher calendar uses — so it's live for the teacher (T).
      // Flag-gated (instant booking) + best-effort; never blocks completion.
      try {
        await syncRegistrationAvailabilityToCalendar(availability.slots, availability.timezone);
      } catch { /* non-blocking */ }

      setIsComplete(true);
      // Only after a confirmed success: clear the local draft (incl. PII) and
      // mark the backend draft submitted.
      await autosave.clearAll();
      try { localStorage.removeItem(PENDING_SUBMITTED_KEY); } catch { /* noop */ }
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Registration failed:', error);
      setErrors({ submit: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
      submittingRef.current = false;
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
      {resumePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Resume your progress?</h3>
            <p className="text-sm text-gray-600 mb-6">
              {resumePrompt.source === 'remote'
                ? 'A more recent version of this form was saved on another tab or device. Load it? Your current changes on this screen will be replaced.'
                : 'We found a more recent draft saved on this device. Load it instead of the version from your account?'}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={dismissResume}>Keep current</Button>
              <Button onClick={applyResume}>Load saved version</Button>
            </div>
          </div>
        </div>
      )}
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

          <div className="flex justify-end mb-2 min-h-[18px] text-xs" aria-live="polite">
            {autosave.status === 'saving' && <span className="text-gray-400">Saving…</span>}
            {autosave.status === 'saved' && <span className="text-green-600">Progress saved</span>}
            {autosave.status === 'offline' && <span className="text-amber-600">Offline — saved on this device</span>}
            {autosave.status === 'error' && <span className="text-amber-600">Saved on this device</span>}
            {autosave.quotaWarning && (
              <span className="ml-2 text-amber-600">Storage full — progress may not survive a refresh</span>
            )}
          </div>

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
