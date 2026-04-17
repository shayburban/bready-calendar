
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTeacher } from './TeacherContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminPricingConfig } from '@/api/entities';
import PricingCard from './pricing/PricingCard';
import PackageCard from './pricing/PackageCard';
import TrialPricingCard from './pricing/TrialPricingCard';
import { Separator } from '@/components/ui/separator';

const normalizeToAllowed = (value, allowedList) => {
  // allow clearing
  if (value === '' || value === null || value === undefined) return value;
  if (!allowedList || !Array.isArray(allowedList) || allowedList.length === 0) return value;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!Number.isFinite(n)) return value;

  // exact match
  if (allowedList.includes(n)) return n;

  // snap to nearest allowed
  let nearest = allowedList[0];
  let minDiff = Math.abs(n - nearest);
  for (const opt of allowedList) {
    const d = Math.abs(n - opt);
    if (d < minDiff) { nearest = opt; minDiff = d; }
  }
  return nearest;
};

// --- BEGIN: Parent-side package validity safety check (ADD-ONLY)
const REQUIRE_ALL_TIERS = false; // keep aligned with PackageCard (no behavior change by default)

const parseSafe = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const pkgValidators = {
  hours: (value, min = 1, max = 999) => {
    if (!value) return '';
    const num = parseSafe(value);
    return num === 0 ? '0 is not a valid number of hours.'
      : (num < min || num > max) ? `Please enter hours between ${min} and ${max}.` : '';
  },
  total: (value) => {
    if (!value) return '';
    const num = parseSafe(value);
    return num === 0 ? 'Total amount cannot be 0.'
      : num < 0 ? 'Total amount cannot be negative.' : '';
  },
  crossField: (hours, total) => {
    const hasHours = !!hours;
    const hasTotal = !!total;
    return hasHours && !hasTotal ? { totalRequired: true, hoursRequired: false }
      : hasTotal && !hasHours ? { totalRequired: false, hoursRequired: true }
      : { totalRequired: false, hoursRequired: false };
  }
};
// --- END: Parent-side package validity safety check

export default function Step5aPricing({ showValidationErrors = false, onValidationChange }) {
  const {
    personalInfo,
    setPersonalInfo,
    services,
    setServices,
    packages,
    setPackages,
  } = useTeacher();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  // Collect per-package validity (pkg.id → { isValid: boolean, details: any })
  const [packageValidationMap, setPackageValidationMap] = useState({});
  // Collect per-package, per-tier errors (pkg.id → { tierName: boolean })
  const [packageTierErrorsMap, setPackageTierErrorsMap] = useState({});

  const [customServiceName, setCustomServiceName] = useState('');
  // Sanitize to letters, spaces, hyphens. Supports Unicode letters (e.g., Hebrew).
  const handleCustomServiceNameChange = (e) => {
    const raw = e.target.value;
    let sanitized;

    try {
      // If build supports Unicode property escapes:
      sanitized = raw.replace(/[^\p{L}\s-]/gu, '');
    } catch {
      // ASCII fallback (A–Z only). If you need Hebrew in fallback, we can extend this.
      sanitized = raw.replace(/[^A-Za-z\s-]/g, '');
    }

    setCustomServiceName(sanitized);
  };

  const serviceRefs = useRef({});
  // --- ADD-ONLY: track previous service count to avoid excessive scrolling
  const prevServicesCountRef = useRef(services.length);

  // NEW: Effect to scroll to a new custom service (lint-safe)
  useEffect(() => {
    // Only act when the number of services increases
    const added = services.length > prevServicesCountRef.current;
    prevServicesCountRef.current = services.length;
    if (!added) return;

    // When a new custom service is added, scroll to it
    const lastService = services[services.length - 1];
    if (lastService && lastService.isCustom && serviceRefs.current[lastService.id]) {
      const element = serviceRefs.current[lastService.id];
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const firstInput = element.querySelector('input, button');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }, [services]); // include 'services' to satisfy ESLint

  const handlePackageValidation = useCallback((pkgId, isValid, details) => {
    setPackageValidationMap(prev => ({ ...prev, [pkgId]: { isValid, details } }));

    // Also update the specific tier errors if available in details
    if (details && details.errorsByTier) {
      setPackageTierErrorsMap(prev => ({
        ...prev,
        [pkgId]: details.errorsByTier,
      }));
    } else {
      // If no errorsByTier are provided (e.g., package disabled), clear previous errors
      setPackageTierErrorsMap(prev => {
        const next = { ...prev };
        delete next[pkgId];
        return next;
      });
    }
  }, []);

  // --- ADD-ONLY: derive invalid-outline flag using the same rule as the Next-button popup
  const isPkgInvalidForOutline = useCallback((p) => {
    if (!showValidationErrors) return false;      // only after Next pressed
    if (!p?.enabled) return false;                // disabled never outline red

    const tiers = (config?.packageTiers || []);
    if (!Array.isArray(tiers) || tiers.length === 0) return false;

    const td = p.tierData || {};
    // require at least ONE tier to have BOTH hours>0 and total>0
    const hasAtLeastOneValid = tiers.some(t => {
      const s = td[t.name] || {};
      const h = parseFloat(s.hours);
      const tot = parseFloat(s.totalStr);
      return Number.isFinite(h) && h > 0 && Number.isFinite(tot) && tot > 0;
    });

    return !hasAtLeastOneValid; // if none are valid → outline red
  }, [showValidationErrors, config]);

  // --- NEW: Correctly memoize the service hourly price map at the top level ---
  const serviceHourlyById = React.useMemo(() => {
    const m = {};
    (services || []).forEach(s => {
      const n = parseFloat(s?.price);
      m[s.id] = Number.isFinite(n) ? n : 0;
    });
    return m;
  }, [services]);

  const recomputePackageValidity = React.useCallback((pkg) => {
    if (!pkg?.enabled) return true; // Disabled packages are always "valid" from a form submission perspective
    const tiersList = config?.packageTiers || [];
    if (!Array.isArray(tiersList) || tiersList.length === 0) return true;

    // Check if at least one tier is correctly filled (both hours and total)
    const hasAtLeastOneValidTier = tiersList.some(tier => {
      const s = (pkg.tierData && pkg.tierData[tier.name]) || {};

      // Both fields must have values
      if (!s.hours || !s.totalStr) return false;

      // Both fields must pass validation
      const hourErr = pkgValidators.hours(s.hours, tier.minHours, tier.maxHours);
      const totalErr = pkgValidators.total(s.totalStr);
      const crossValidation = pkgValidators.crossField(s.hours, s.totalStr);

      return !hourErr && !totalErr && !crossValidation.hoursRequired && !crossValidation.totalRequired;
    });

    if (!hasAtLeastOneValidTier) return false;

    const anyTierInvalid = tiersList.some((t) => {
      const s = (pkg.tierData && pkg.tierData[t.name]) || {};
      const touched =
        REQUIRE_ALL_TIERS ||
        (s.hours ?? '') !== '' ||
        (s.totalStr ?? '') !== '';

      if (!touched) return false;

      const hErr = pkgValidators.hours(s.hours, t.minHours, t.maxHours);
      const tErr = pkgValidators.total(s.totalStr);
      const x = pkgValidators.crossField(s.hours, s.totalStr);

      return !!(hErr || tErr || x.hoursRequired || x.totalRequired);
    });

    return !anyTierInvalid;
  }, [config]);

  // Helpers: admin "dynamic number options" enforcement (non-UI)
  const allowedNumbers = React.useMemo(() => ({
    // Prefer explicit admin lists; fall back to null = no restriction
    servicePrices: config?.numberOptions?.servicePrices || config?.allowedServicePrices || null,
    packagePrices: config?.numberOptions?.packagePrices || config?.allowedPackagePrices || null,
  }), [config]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const configs = await AdminPricingConfig.filter({ isActive: true });
        if (configs.length > 0) {
          setConfig(configs[0]);
        } else {
          // Fallback to a default if nothing is configured
          setConfig({
            commissionTiers: [{ minHours: 0, maxHours: null, rate: 20 }],
            trialLesson: { adminMinPercentage: 0, adminMaxPercentage: 100, commissionRate: 10 },
            packageTiers: []
          });
        }
      } catch (error) {
        console.error("Failed to fetch admin configuration:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
   const onlineClassService = services.find(s => s.title === 'Online Class');
   if (onlineClassService && onlineClassService.enabled && onlineClassService.price > 0) {
     setPersonalInfo(prev => ({
       ...prev,
       hourly_rate: {
         ...prev.hourly_rate,
         regular: onlineClassService.price
       }
     }));
   } else {
     setPersonalInfo(prev => ({
       ...prev,
       hourly_rate: {
         ...prev.hourly_rate,
         regular: null
       }
     }));
   }
  }, [services, setPersonalInfo]);

  /* NEW: pricing validity reporter — notifies TeacherForm live */
  useEffect(() => {
    if (!onValidationChange || !config || loading) return;

    // Enabled non-trial services (must exist)
    const enabledNonTrial = (services || []).filter(s => s.enabled && !s.isTrial);
    const hasEnabledNonTrial = enabledNonTrial.length > 0;

    // Non-trial services must be priced
    const hasUnpricedServices = enabledNonTrial.some(s => !s.price || parseFloat(s.price) <= 0);

    // Packages: enabled must be priced
    const hasUnpricedPackages = (packages || []).filter(p => p.enabled).some(p => !p.price || parseFloat(p.price) <= 0); // Kept for compatibility, not blocking anymore

    // Trial rule: if trial% > 0 → require at least one enabled+priced non-trial
    const trial = (services || []).find(s => s.isTrial);
    const trialPct = trial?.trialPercentage || 0;
    const hasEnabledPricedService = enabledNonTrial.some(s => parseFloat(s.price) > 0);
    const isTrialPriceValid = !(trialPct > 0 && !hasEnabledPricedService);

    // Compute package-level aggregate validity (enabled pkgs only) from child callbacks
    // This relies on packageValidationMap being pruned for disabled packages
    const allPackagesValid = (packages || []).filter(p => p.enabled).every(p => packageValidationMap[p.id]?.isValid !== false);

    // Check for any reported tier errors within enabled packages
    // This relies on packageTierErrorsMap being pruned for disabled packages
    const anyReportedTierErrors = (packages || []).filter(p => p.enabled).some((p) => {
      const byTier = packageTierErrorsMap[p.id] || {};
      return Object.values(byTier).some(Boolean);
    });

    // Parent-side recomputation guard (catches any missed child updates)
    // Only considers enabled packages, disabled ones are "valid" by definition
    const allPackagesValidRecalc =
      (packages || []).filter(p => p.enabled).every((p) => recomputePackageValidity(p));

    const pkgHasAtLeastOneValidTier = (pkg) => {
      const tiersList = config?.packageTiers || [];
      if (!Array.isArray(tiersList) || tiersList.length === 0) return false;

      return tiersList.some((t) => {
        const s = (pkg.tierData && pkg.tierData[t.name]) || {};
        if (!s.hours || !s.totalStr) return false;

        const hErr = pkgValidators.hours(s.hours, t.minHours, t.maxHours);
        const tErr = pkgValidators.total(s.totalStr);
        const x = pkgValidators.crossField(s.hours, s.totalStr);

        return !(hErr || tErr || x.hoursRequired || x.totalRequired);
      });
    };

    const enabledPackages = (packages || []).filter(p => p.enabled);

    // OK if there are no enabled packages OR at least one enabled package has a valid size
    const hasAtLeastOneValidEnabledPackage =
      enabledPackages.length === 0 || enabledPackages.some(pkgHasAtLeastOneValidTier);

    const hasInvalidEnabledPackages =
      enabledPackages.some((p) => !recomputePackageValidity(p));

    // UPDATED gate: require ≥1 valid enabled package; untouched sizes don't block
    const baseIsValid =
      hasEnabledNonTrial &&
      !hasUnpricedServices &&
      isTrialPriceValid &&
      hasAtLeastOneValidEnabledPackage && // New definition here
      !hasInvalidEnabledPackages; // New definition here

    const isValid =
      baseIsValid &&
      allPackagesValid && // Combined with pruning, this is now more accurate for enabled packages
      allPackagesValidRecalc && // Stronger primary check
      !anyReportedTierErrors; // Also more accurate with pruning

    const details = {
      hasEnabledNonTrial,     // << parent gate uses this
      hasUnpricedServices,
      hasUnpricedPackages,      // kept for compatibility (not used to block)
      isTrialPriceValid,
      allPackagesValid, // for debugging/telemetry if needed
      allPackagesValidRecalc, // for debugging/telemetry if needed
      anyReportedTierErrors,
      // NEW (ADD-ONLY)
      hasAtLeastOneValidEnabledPackage,
      hasInvalidEnabledPackages,
      enabledPackagesCount: enabledPackages.length, // helpful to parent
    };

    onValidationChange(isValid, details);
  }, [services, packages, config, onValidationChange, packageValidationMap, packageTierErrorsMap, recomputePackageValidity, loading]);

  // Optional: prune validation maps for disabled packages
  useEffect(() => {
    const enabledIds = new Set((packages || []).filter(p => p.enabled).map(p => p.id));
    setPackageValidationMap(prev => {
      const next = {};
      for (const [k, v] of Object.entries(prev || {})) if (enabledIds.has(k)) next[k] = v;
      return next;
    });
    setPackageTierErrorsMap(prev => {
      const next = {};
      for (const [k, v] of Object.entries(prev || {})) if (enabledIds.has(k)) next[k] = v;
      return next;
    });
  }, [packages]);

  const handleServiceUpdate = (id, field, value) => {
    setServices(currentServices =>
      currentServices.map(s => {
        if (s.id !== id) return s;

        let nextVal = value;

        // Constrain numeric service prices (silent, no UI changes)
        if (field === 'price') {
          // allow clearing
          if (typeof nextVal === 'string') {
            if (nextVal.trim() === '') {
              nextVal = '';
            } else if (!/^\d*\.?\d*$/.test(nextVal)) {
              // ignore illegal chars; keep current value
              return s;
            }
          }
          // Snap to admin-allowed numbers if configured
          nextVal = normalizeToAllowed(nextVal, allowedNumbers.servicePrices);
        }

        const updated = { ...s, [field]: nextVal };

        // invariant: disabling a service clears its price
        if (field === 'enabled' && !nextVal) {
          updated.price = null;
        }

        return updated;
      })
    );

    // --- ADD-ONLY: when a service is disabled, auto-disable its linked package(s)
    if (field === 'enabled' && value === false) {
      setPackages(prev =>
        prev.map(p =>
          p.serviceId === id ? { ...p, enabled: false } : p
        )
      );
    }
  };

  const handleAddCustomService = () => {
    if (!customServiceName.trim()) return;

    const newServiceId = `custom-${Date.now()}`;
    const newPackageId = `custom-pkg-${Date.now()}`;
    const newTitle = customServiceName.trim();

    const newService = {
      id: newServiceId,
      title: newTitle,
      enabled: true, // AUTO-ENABLE new custom service
      price: null,
      tooltip: '',
      isCustom: true
    };

    const newPackage = {
      id: newPackageId,
      serviceId: newServiceId, // Link package to service
      title: newTitle,
      enabled: false,
      price: null,
      selectedTier: config?.packageTiers?.[0]?.name || '',
      tierData: {},
      isCustom: true,
      currency: 'USD',
      tooltip: ''
    };

    setServices(prev => [...prev, newService]);
    setPackages(prev => [...prev, newPackage]);

    setCustomServiceName('');
  };

  const handleDeleteService = (serviceId) => {
    const serviceToDelete = services.find(s => s.id === serviceId);
    if (!serviceToDelete) {
      return;
    }

    // Remove the service
    setServices(prev => prev.filter(service => service.id !== serviceId));

    // Also delete associated custom package if it's a custom service
    if (serviceToDelete.isCustom) {
      // Find package by the stable serviceId link
      const packageToDelete = packages.find(p => p.serviceId === serviceId);

      if (packageToDelete) {
        const pkgId = packageToDelete.id;
        setPackages(prev => prev.filter(p => p.id !== pkgId));

        // Clean validation maps
        setPackageValidationMap(prev => {
          const next = { ...prev };
          delete next[pkgId];
          return next;
        });
        setPackageTierErrorsMap(prev => {
          const next = { ...prev };
          delete next[pkgId];
          return next;
        });
      }
    }

    // Clean up service refs
    if (serviceRefs.current[serviceId]) {
      delete serviceRefs.current[serviceId];
    }
  };

  const handlePackageUpdate = useCallback((id, field, value) => {
    setPackages(currentPackages =>
      currentPackages.map(p => {
        if (p.id !== id) return p;

        let nextVal = value;

        if (field === 'price') {
          // allow clearing
          if (typeof nextVal === 'string') {
            if (nextVal.trim() === '') {
              nextVal = '';
            } else if (!/^\d*\.?\d*$/.test(nextVal)) {
              // ignore illegal chars; keep current value
              return p;
            }
          }
          // Snap to admin-allowed numbers if configured
          nextVal = normalizeToAllowed(nextVal, allowedNumbers.packagePrices);
        }

        return { ...p, [field]: nextVal };
      })
    );
  }, [allowedNumbers.packagePrices, setPackages]);

  const handleDeletePackage = useCallback((id) => {
    setPackages(currentPackages => currentPackages.filter(p => p.id !== id));
    setPackageValidationMap(prev => {
      const newMap = { ...prev };
      delete newMap[id];
      return newMap;
    });
    setPackageTierErrorsMap(prev => {
      const newMap = { ...prev };
      delete newMap[id];
      return newMap;
    });
  }, [setPackages, setPackageValidationMap, setPackageTierErrorsMap]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Set Your Pricing</h2>
        <p className="text-gray-600">Set your hourly rates and pricing for packages. You can add or remove a service or package for students by clicking the checkmark.</p>
      </div>

      {/* Services Section */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Individual Services</h3>
        {/* MODIFIED: Re-introducing the 3-column layout for large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...services.filter(service => !service.isTrial), ...services.filter(service => service.isTrial)].map(service =>
            service.isTrial ? (
              <TrialPricingCard
                key={service.id}
                service={service}
                onUpdate={handleServiceUpdate}
                config={config}
                lowestHourlyRate={services.filter(s => s.enabled && !s.isTrial && s.price > 0).length > 0
                  ? Math.min(...services.filter(s => s.enabled && !s.isTrial && s.price > 0).map(s => parseFloat(s.price)))
                  : 0}
                hasEnabledServices={services.filter(s => s.enabled && !s.isTrial).length > 0}
                showValidationErrors={showValidationErrors}
              />
            ) : (
              <div key={service.id} ref={el => serviceRefs.current[service.id] = el}>
                <PricingCard
                  service={service}
                  onUpdate={handleServiceUpdate}
                  config={config}
                  showValidationErrors={showValidationErrors}
                  onDelete={handleDeleteService}
                  showDelete={service.isCustom}
                />
              </div>
            )
          )}
        </div>

        {/* Add Custom Service */}
        <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              placeholder="Enter custom service name"
              value={customServiceName}
              onChange={handleCustomServiceNameChange}
              className="flex-1"
            />
            <Button
              onClick={handleAddCustomService}
              disabled={!customServiceName.trim()}
            >
              Add Service
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-10" />

      {/* Packages Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Package Deals</h2>
        {/* MODIFIED: Keep packages at 2 columns max for wider cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(packages || []).map(pkg => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onUpdate={handlePackageUpdate}
              onDelete={handleDeletePackage}
              tiers={config?.packageTiers || []}
              commissionTiers={config?.commissionTiers || []}
              showValidationErrors={showValidationErrors}
              onValidationChange={handlePackageValidation}
              serviceHourly={serviceHourlyById[pkg.serviceId] || 0}
              // --- ADD-ONLY:
              forceOutlineError={isPkgInvalidForOutline(pkg)}
            />
          ))}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Active Services:</span>
            <span className="font-medium">{services.filter(s => s.enabled).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Packages:</span>
            <span className="font-medium">{packages.filter(p => p.enabled).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Average Hourly Rate:</span>
            <span className="font-medium">
              ${services.filter(s => s.enabled && !s.isTrial && s.price).length > 0
                ? (services.filter(s => s.enabled && !s.isTrial && s.price)
                    .reduce((sum, s) => sum + parseFloat(s.price), 0) /
                   services.filter(s => s.enabled && !s.isTrial && s.price).length).toFixed(2)
                : '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
