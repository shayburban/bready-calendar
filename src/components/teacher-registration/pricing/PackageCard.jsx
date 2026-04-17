
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Check, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

// Optional policy: require user to fill *every* tier (true) vs. only validate touched tiers (false)
const REQUIRE_ALL_TIERS = false;

// Pure helper functions (hoisted for performance)
const money = (amount) => (typeof amount === 'number' && !isNaN(amount)) ? amount.toFixed(2) : '0.00';
const parseNum = (str) => { const n = parseFloat(str); return isNaN(n) ? 0 : n; };
const hasItems = (arr) => Array.isArray(arr) && arr.length > 0;

// Validation factory (stable functions, no re-creation)
const createValidators = () => ({
  hours: (value, min = 1, max = 999) => {
    if (!value) return '';
    const num = parseNum(value);
    return num === 0 ? '0 is not a valid number of hours.'
      : (num < min || num > max) ? `Please enter hours between ${min} and ${max}.` : '';
  },
  total: (value) => {
    if (!value) return '';
    const num = parseNum(value);
    return num === 0 ? 'Total amount cannot be 0.'
      : num < 0 ? 'Total amount cannot be negative.' : '';
  },
    crossField: (hours, total) => {
    const hNum = parseFloat(hours);
    const tNum = parseFloat(total);
    const hasHours = Number.isFinite(hNum) && hNum > 0;
    const hasTotal = Number.isFinite(tNum) && tNum > 0;

    if (hasHours && !hasTotal) return { totalRequired: true, hoursRequired: false };
    if (!hasHours && hasTotal) return { totalRequired: false, hoursRequired: true };
    return { totalRequired: false, hoursRequired: false };
  }
});

export default function PackageCard({
  pkg, onUpdate, onDelete, tiers, commissionTiers = [], showValidationErrors = false, onValidationChange,
  serviceHourly = 0,
  // --- ADD-ONLY:
  forceOutlineError = false,
}) {
  const { id, serviceId, title, enabled, price, selectedTier = tiers?.[0]?.name || '', tooltip, currency = 'USD' } = pkg;

  // Initialize all tab states at once with hydration from pkg.tierData
  const [tabStates, setTabStates] = useState(() => {
    const initState = {
      hours: '',
      totalStr: '',
      isTypingTotal: false,
      hourValidationError: '',
      totalValidationError: '',
      hoursRequired: false,
      totalRequired: false,
      hasBeenEdited: false,
      monotonicityError: false,
      monotonicityMsg: '',
    };

    if (!hasItems(tiers)) return {};

    const fromPkg = pkg?.tierData || {};
    const byName = Object.fromEntries(
      tiers.map((t) => {
        const saved = fromPkg[t.name] || {};
        const hours = saved.hours ?? '';
        const totalStr = saved.totalStr ?? '';
        const hasBeenEdited = !!(hours || totalStr);
        return [
          t.name,
          {
            ...initState,
            hours,
            totalStr,
            hasBeenEdited,
          },
        ];
      })
    );

    return byName;
  });

  const [activeFeeTab, setActiveFeeTab] = useState('0-20');
  const validate = useMemo(createValidators, []);

  // per-tier hourly (2dp); 0 = not computable yet
  const perTierHourly = useMemo(() => {
    const map = {};
    if (Array.isArray(tiers)) {
      for (const t of tiers) {
        const s = tabStates[t.name] || {};
        const h = parseNum(s.hours);
        const tot = parseNum(s.totalStr);
        map[t.name] = (h > 0 && tot > 0) ? +(tot / h).toFixed(2) : 0;
      }
    }
    return map;
  }, [tiers, tabStates]);

  // Single state updater (batches multiple field updates)
  const updateTabState = useCallback((tierName, updates) => {
    setTabStates(prev => ({
      ...prev,
      [tierName]: { ...prev[tierName], ...updates }
    }));
  }, []);

  // Memoized derived state (recalculates only when dependencies change)
  const computed = useMemo(() => {
    const numericPrice = (typeof price === 'number' && !isNaN(price)) ? price : 0;
    const currentTier = hasItems(tiers) ? tiers.find(t => t.name === selectedTier) || tiers[0] : {};
    const currentTabState = tabStates[selectedTier] || {};

    // Commission calculation
    const commissionTier = hasItems(commissionTiers)
      ? commissionTiers.find(t => t.name === activeFeeTab || `${t.minHours}-${t.maxHours || '∞'}` === activeFeeTab)
      : null;
    const commissionRate = commissionTier?.rate ?? commissionTiers?.[0]?.rate ?? 24;

    // Hourly rate calculation
    const [totalVal, hoursVal] = [parseNum(currentTabState.totalStr), parseNum(currentTabState.hours)];
    const hourlyRate = (hoursVal > 0 && totalVal > 0) ? totalVal / hoursVal : numericPrice;

    return { numericPrice, currentTier, currentTabState, commissionRate, hourlyRate };
  }, [price, tiers, selectedTier, tabStates, commissionTiers, activeFeeTab]);

  // Validation state helpers (memoized to prevent unnecessary recalculations)
  const validation = useMemo(() => ({
    hasActiveTabError: () => {
      if (!enabled) return false;
      const state = tabStates[selectedTier] || {};
      return !!(state.hourValidationError || state.totalValidationError || state.hoursRequired || state.totalRequired || state.monotonicityError);
    },
    hasAnyTabError: () => enabled && hasItems(tiers) && Object.values(tabStates).some(s =>
      s.hourValidationError || s.totalValidationError || s.hoursRequired || s.totalRequired || s.monotonicityError),
    getTierErrorState: (tierName) => {
      if (!enabled) return false;
      const state = tabStates[tierName];
      return state && !!(state.hourValidationError || state.totalValidationError || state.hoursRequired || state.totalRequired || state.monotonicityError);
    }
  }), [enabled, tiers, tabStates, selectedTier]);

  // NEW — recompute errors from raw values so hidden tabs can't bypass
  const tierHasError = useCallback(
    (tier) => {
      const s = tabStates[tier.name] || {};
      // A tier is "touched" if it was edited OR has any value typed
      const touched =
        REQUIRE_ALL_TIERS ||
        !!s?.hasBeenEdited ||
        (s?.hours ?? '') !== '' ||
        (s?.totalStr ?? '') !== '';

      if (!touched) return false; // ignore truly untouched tiers (unless strict mode)

      const hErr = validate.hours(s.hours, tier.minHours, tier.maxHours);
      const tErr = validate.total(s.totalStr);
      const x = validate.crossField(s.hours, s.totalStr);

      return !!(hErr || tErr || x.hoursRequired || x.totalRequired || s.monotonicityError);
    },
    [tabStates, validate]
  );

  // --- ADD-ONLY: compute monotonicity per tier and store a small error flag/message
  useEffect(() => {
    if (!enabled || !hasItems(tiers)) return;

    // cap for index 0 = serviceHourly (if >0), else Infinity; for others = previous tier hourly (if >0), else Infinity
    const capFor = (idx) => {
      if (idx === 0) return (typeof serviceHourly === 'number' && serviceHourly > 0) ? +serviceHourly : Infinity;
      const prev = perTierHourly[tiers[idx - 1].name] || 0;
      return prev > 0 ? prev : Infinity;
    };

    tiers.forEach((t, idx) => {
      const s = tabStates[t.name] || {};
      const hasLocalErr = !!(s.hourValidationError || s.totalValidationError || s.hoursRequired || s.totalRequired);
      const hourly = perTierHourly[t.name] || 0;

      let monotonicityError = false;
      let monotonicityMsg = '';

      if (!hasLocalErr && hourly > 0) {
        const cap = capFor(idx);
        if (hourly > cap) {
          monotonicityError = true;
          monotonicityMsg =
            idx === 0
              ? `Hourly rate $${money(hourly)}/Hr cannot exceed service rate $${cap === Infinity ? '∞' : money(cap)}/Hr.`
              : `Hourly rate $${money(hourly)}/Hr cannot exceed ${tiers[idx - 1].name} rate $${cap === Infinity ? '∞' : money(cap)}/Hr.`;
        }
      }

      // Update the tab state with monotonicity info
      // Only update if state actually changed to prevent unnecessary re-renders
      if (!!s.monotonicityError !== monotonicityError || s.monotonicityMsg !== monotonicityMsg) {
        updateTabState(t.name, {
          monotonicityError,
          monotonicityMsg
        });
      }
    });
  }, [enabled, tiers, tabStates, perTierHourly, serviceHourly, updateTabState]);


  const computePackageValidity = useCallback(() => {
    if (!enabled) return true;
    if (!hasItems(tiers)) return true;

    // Check if at least one tier is correctly filled (both hours and total)
    const hasAtLeastOneValidTier = tiers.some(tier => {
      const s = tabStates[tier.name] || {};
      // const hours = parseNum(s.hours || ''); // Not used
      // const totalStr = s.totalStr || ''; // Not used

      // Both fields must have values
      if (!s.hours || !s.totalStr) return false;

      // Both fields must pass validation
      const hourErr = validate.hours(s.hours, tier.minHours, tier.maxHours);
      const totalErr = validate.total(s.totalStr);
      const crossValidation = validate.crossField(s.hours, s.totalStr);

      return !hourErr && !totalErr && !crossValidation.hoursRequired && !crossValidation.totalRequired && !s.monotonicityError;
    });

    if (!hasAtLeastOneValidTier) return false;

    // if any tier that should be considered has an error → package invalid
    return !tiers.some(tierHasError);
  }, [enabled, tiers, tierHasError, tabStates, validate]);

  // Input handlers (optimized with fewer operations)
  const handleHoursChange = useCallback((raw) => {
    // normalize to positive numeric string (digits + single dot)
    let value = (raw ?? '').toString();
    if (value.startsWith('-')) value = value.slice(1);
    value = value.replace(/[^\d.]/g, '');
    if (value.startsWith('.')) value = '0' + value;

    // NEW: Restrict to whole numbers only (no decimals)
    value = value.replace(/\./g, '');

    const { currentTier, numericPrice, currentTabState } = computed;

    const hourValidationError = validate.hours(
      value, currentTier.minHours, currentTier.maxHours
    );
    const crossValidation = validate.crossField(value, currentTabState.totalStr);

    const updates = { hours: value, hourValidationError, ...crossValidation, hasBeenEdited: true };

    // keep your auto-total behavior if valid hours + known hourly price
    if (numericPrice > 0 && value && !hourValidationError) {
      const numHours = parseNum(value);
      if (numHours > 0) {
        const newTotal = money(numHours * numericPrice);
        Object.assign(updates, {
          totalStr: newTotal,
          totalRequired: false,
          totalValidationError: validate.total(newTotal),
        });
      }
    } else if (!value) {
      Object.assign(updates, { totalStr: '', totalValidationError: '', totalRequired: false });
    }

    updateTabState(selectedTier, updates);
  }, [computed, validate, selectedTier, updateTabState]);

  const handleTotalChange = useCallback((rawValue) => {
    // Disallow negatives and strip everything except digits (no decimals allowed)
    let value = rawValue || '';
    if (value.startsWith('-')) value = value.substring(1);
    value = value.replace(/[^\d]/g, '');

    const { currentTabState } = computed;

    updateTabState(selectedTier, {
      totalStr: value,
      isTypingTotal: true,
      totalValidationError: validate.total(value),
      ...validate.crossField(currentTabState.hours, value)
    });
  }, [computed, validate, selectedTier, updateTabState]);

  const handleTotalFocus = useCallback(() => {
    updateTabState(selectedTier, { isTypingTotal: true });
  }, [selectedTier, updateTabState]);

  const handleTotalBlur = useCallback(() => {
    // NEW: prevent label from toggling the checkbox unless clicking the toggle zone
    const raw = (computed.currentTabState.totalStr ?? '').trim();
    const isEmpty = raw === '' || raw === '.' || raw === '-';
    updateTabState(selectedTier, {
      totalStr: isEmpty ? '' : money(parseNum(raw)), // keep placeholder if user cleared the field
      isTypingTotal: false
    });
    // commit hourly to pkg.price on blur if valid
    {
      const s = computed.currentTabState || {};
      const hrs = parseNum(s.hours);
      const tot = parseNum(s.totalStr);
      const totalErr = validate.total(s.totalStr);

      const noErrors = !(
        s.hourValidationError ||
        totalErr ||
        s.hoursRequired ||
        s.totalRequired ||
        s.monotonicityError
      );

      if (enabled && hrs > 0 && tot > 0 && noErrors) {
        const newHourly = +(tot / hrs).toFixed(2);
        const currentHourly = (typeof price === 'number' && !isNaN(price)) ? +price : 0;
        if (newHourly !== currentHourly) {
          onUpdate(id, 'price', newHourly);
        }
      } else if (!enabled || !noErrors) { // Clear price if it becomes invalid or disabled
        const currentHourly = (typeof price === 'number' && !isNaN(price)) ? +price : 0;
        if (currentHourly > 0) {
          onUpdate(id, 'price', '');
        }
      }
    }
  }, [computed, selectedTier, updateTabState, enabled, id, onUpdate, price, validate]);

  // Handler for tier selection buttons
  const handleTierSelection = useCallback((tierName) => {
    onUpdate(id, 'selectedTier', tierName);
  }, [id, onUpdate]);

  // Active packages for table (memoized for performance)
  const activePackagesForTable = useMemo(() => {
    if (!hasItems(tiers)) return [];

    const { commissionRate } = computed;

    return tiers.map(tier => {
      const state = tabStates[tier.name];
      const hours = parseNum(state?.hours);
      const totalAmount = parseNum(state?.totalStr);

      // Only include valid rows for display in the table
      const isValid = state?.hours && state?.totalStr &&
                      !state.hourValidationError && !state.totalValidationError &&
                      !state.hoursRequired && !state.totalRequired &&
                      !state.monotonicityError &&
                      hours > 0 && totalAmount > 0;

      if (!isValid) return null; // Filter out invalid entries

      const fee = totalAmount * (commissionRate / 100);
      const netAmount = totalAmount - fee;
      const netPerHour = hours > 0 ? netAmount / hours : 0;

      return {
        tierName: tier.name,
        hours,
        totalAmount,
        fee,
        netAmount,
        netPerHour,
      };
    }).filter(Boolean);
  }, [tiers, tabStates, computed]);

  // NEW — report package validity based on *all tiers* every time inputs change
  useEffect(() => {
    const ok = computePackageValidity();

    // Build a per-tier error map using the SAME predicate used to color buttons
    const errorsByTier = {};
    if (hasItems(tiers)) {
      tiers.forEach((t) => {
        errorsByTier[t.name] = validation.getTierErrorState(t.name) === true;
      });
    }
    const hasAnyTierError = Object.values(errorsByTier).some(Boolean);

    // Keep the boolean (2nd arg) exactly as before, but AND it with UI-level flags
    // Add a 3rd meta arg (ADD-ONLY) so the parent can gate with exact UI state
    onValidationChange?.(id, ok && !hasAnyTierError, {
      errorsByTier,
      hasAnyTierError,
    });
  }, [
    computePackageValidity,
    id,
    onValidationChange,
    tabStates,
    enabled,
    tiers,
    selectedTier,
    validation,
  ]);

  useEffect(() => {
    if (!hasItems(tiers)) return;

    if (!enabled) {
      // Clear errors AND values when disabling (so stale inputs never linger)
      tiers.forEach(tier => updateTabState(tier.name, {
        hours: '',
        totalStr: '',
        hasBeenEdited: false,
        hourValidationError: '',
        totalValidationError: '',
        hoursRequired: false,
        totalRequired: false,
        monotonicityError: false,
        monotonicityMsg: '',
      }));
      // Also clear computed hourly price for this package on disable
      try { onUpdate?.(id, 'price', ''); } catch (e) { /* ignore */ }
    } else if (enabled) {
      tiers.forEach(tier => {
        const state = tabStates[tier.name];
        if (state?.hasBeenEdited) {
          const updates = {
            hourValidationError: validate.hours(state.hours, tier.minHours, tier.maxHours),
            totalValidationError: validate.total(state.totalStr),
            ...validate.crossField(state.hours, state.totalStr)
          };
          updateTabState(tier.name, updates);
        }
      });
    }
  }, [enabled, tiers, tabStates, validate, updateTabState, onUpdate, id]);

  const { currentTier, currentTabState, commissionRate, hourlyRate } = computed;
  // sync pkg.price (hourly) with selected tier validity; parent logic unchanged
  useEffect(() => {
    if (!enabled) return;

    const s = currentTabState || {};
    const hrs = parseNum(s.hours);
    const tot = parseNum(s.totalStr);

    const noErrors = !(
      s.hourValidationError ||
      s.totalValidationError ||
      s.hoursRequired ||
      s.totalRequired ||
      s.monotonicityError
    );

    const tierIsValid = hrs > 0 && tot > 0 && noErrors;
    const computedHourly = tierIsValid ? +(tot / hrs).toFixed(2) : 0;

    const currentHourly = (typeof price === 'number' && !isNaN(price)) ? +price : 0;

    if (tierIsValid && computedHourly > 0 && computedHourly !== currentHourly) {
      onUpdate(id, 'price', computedHourly);
    } else if (!tierIsValid && currentHourly > 0) {
      onUpdate(id, 'price', '');
    }
  }, [enabled, id, onUpdate, price, currentTabState]);

  // Persist only hours/totalStr per tier to pkg.tierData
  useEffect(() => {
    if (!hasItems(tiers)) return;

    const nextTierData = {};
    for (const t of tiers) {
      const s = tabStates[t.name] || {};
      // Only persist the user-entered values (not errors or derived state)
      if ((s.hours ?? '') !== '' || (s.totalStr ?? '') !== '') {
        nextTierData[t.name] = {
          hours: s.hours ?? '',
          totalStr: s.totalStr ?? '',
        };
      }
    }

    const prevTierData = pkg?.tierData || {};
    // Avoid noisy updates: only write when different
    if (JSON.stringify(prevTierData) !== JSON.stringify(nextTierData)) {
      onUpdate(id, 'tierData', nextTierData);
    }
  }, [tabStates, tiers, id, onUpdate, pkg?.tierData]);

  // Optional one-time hydration if tabStates empty but pkg.tierData appears
  useEffect(() => {
    if (!hasItems(tiers)) return;
    const noLocal = Object.keys(tabStates || {}).length === 0;
    if (!noLocal) return; // Only hydrate if tabStates is currently empty

    const td = pkg?.tierData;
    if (!td || Object.keys(td).length === 0) return; // Only hydrate if pkg.tierData has content

    const next = {};
    for (const t of tiers) {
      const saved = td[t.name] || {};
      next[t.name] = {
        hours: saved.hours ?? '',
        totalStr: saved.totalStr ?? '',
        isTypingTotal: false,
        hourValidationError: '',
        totalValidationError: '',
        hoursRequired: false,
        totalRequired: false,
        hasBeenEdited: !!(saved.hours || saved.totalStr),
        monotonicityError: false,
        monotonicityMsg: '',
      };
    }
    setTabStates(next);
  }, [pkg?.tierData, tiers, tabStates]);

  // NEW — prevent label from toggling the checkbox unless clicking the toggle zone
  const handleCardLabelClick = useCallback((e) => {
    const target = e.target;
    const isCheckbox = target.tagName === 'INPUT' && target.type === 'checkbox';
    const inToggle = target.closest?.('[data-role="pkg-toggle"]');
    if (!isCheckbox && !inToggle) {
      e.preventDefault(); // block label's default toggling behavior
    }
  }, []);

  // NEW — list the tier names that currently have errors
  const errorTierNames = useMemo(() => {
    if (!enabled || !hasItems(tiers)) return [];
    return tiers
      .filter(t => validation.getTierErrorState(t.name))
      .map(t => t.name);
  }, [enabled, tiers, validation]);

  // Derive the overall card error state for styling
  const hasCardErrors = useMemo(() => {
    // --- ADD-ONLY: parent can force outline (e.g., after Next popup)
    if (forceOutlineError) return true;

    // Disabled packages never show errors
    if (!enabled) return false;

    // NEW: If ANY tier in this card has a textbox error (hours/total validation or required),
    // keep the card outline red immediately — regardless of which tab is currently active.
    const anyTierFieldErrorNow = validation.hasAnyTabError(); // already checks all tabStates
    if (anyTierFieldErrorNow) return true;

    // EXISTING behavior after clicking Next: rely on the broader gates
    if (!showValidationErrors) return false;

    const globalInvalid = !computePackageValidity();
    const uiTabErrors = validation.hasAnyTabError(); // legacy path intact

    return globalInvalid || uiTabErrors;
  }, [
    // --- ADD-ONLY:
    forceOutlineError,
    enabled,
    validation,              // depends on tabStates/tiers internally
    showValidationErrors,
    computePackageValidity,
  ]);

  const invalidForOutline = useMemo(
    () => hasCardErrors,
    [hasCardErrors]
  );

  return (
    <div className="h-full">
      <label className="cursor-default block h-full" onClickCapture={handleCardLabelClick}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onUpdate(id, 'enabled', e.target.checked)}
          className="sr-only"
        />
        <div
          className={`
            h-full p-4 md:p-6 rounded-lg border-2 transition-all duration-200
            ${enabled
              ? invalidForOutline // Use hasCardErrors for the outline logic
                ? 'border-red-300 bg-red-50'
                : 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <h4 className={`text-lg font-semibold ${enabled ? 'text-gray-900' : 'text-gray-400'}`}>{title}</h4>
              {tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-gray-400 hover:text-gray-600">
                        <Info className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div data-role="pkg-toggle" className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer
              transition-transform transition-colors duration-200
              ${enabled
                ? 'bg-blue-500 hover:scale-105 hover:ring-2 hover:ring-blue-300'
                : 'border border-gray-300 hover:border-blue-400 hover:bg-gray-100 hover:scale-105 hover:ring-2 hover:ring-blue-200'
              }`}>
              {enabled && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>

          {enabled ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 -mt-1">Select package size</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {hasItems(tiers) && tiers.map((tier) => (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => handleTierSelection(tier.name)}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-full transition-all duration-200
                      ${selectedTier === tier.name
                        ? validation.getTierErrorState(tier.name)
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-100 text-blue-700 border border-blue-300 shadow-inner'
                        : validation.getTierErrorState(tier.name)
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }
                    `}
                  >
                    {tier.name}
                  </button>
                ))}
              </div>

              {enabled && !validation.hasActiveTabError() && validation.hasAnyTabError() && (
                <p className="text-sm text-red-600 mb-3">
                  {errorTierNames.length === 0
                    ? 'Please correct the other hourly package tabs in this card to continue to the next step.'
                    : errorTierNames.length === 1
                      ? `The ${errorTierNames[0]} package has errors. Please switch to that tab to fix it.`
                      : `The following package sizes have errors: ${errorTierNames.join(', ')}. Please switch to those tabs to fix them.`}
                </p>
              )}

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 gap-4 mb-4 items-start">
                <div className="col-span-1"> {/* Hours field — full width */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of hours
                  </label>
                  <div className="flex">
                    <Input
                      id={`hours-${id}-${currentTier.name}`}
                      type="text"
                      inputMode="numeric"
                      placeholder={currentTier.minHours && currentTier.maxHours ? `Type ${currentTier.minHours} to ${currentTier.maxHours}` : 'Type hours'}
                      value={currentTabState.hours}
                      onChange={(e) => handleHoursChange(e.target.value)}
                      className={`relative focus:z-10 rounded-r-none min-w-0 w-full ${
                        (currentTabState.hourValidationError || currentTabState.hoursRequired) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      aria-describedby={
                        (enabled && (currentTabState.hoursRequired || currentTabState.hourValidationError))
                        ? `hours-error-${id}-${currentTier.name}`
                        : undefined
                      }
                    />
                    <span className="inline-flex items-center px-3 text-sm text-gray-600 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                      Hr
                    </span>
                  </div>
                   {enabled && (currentTabState.hoursRequired || currentTabState.hourValidationError) && (
                    <div
                      id={`hours-error-${id}-${currentTier.name}`}
                      className="mt-1 text-xs text-red-600"
                      aria-live="polite"
                    >
                      Please enter the number of hours ({currentTier.minHours}–{currentTier.maxHours}) to match the total amount.
                    </div>
                  )}
                </div>

                <div className="col-span-1"> {/* Total field — full width when stacked */}
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total amount
                  </label>
                  <div className="flex">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Type price"
                      value={currentTabState.totalStr || ''}
                      onChange={(e) => handleTotalChange(e.target.value)}
                      onFocus={handleTotalFocus}
                      onBlur={handleTotalBlur}
                      className={`relative focus:z-10 rounded-r-none min-w-0 w-full ${
                        (currentTabState.totalValidationError || currentTabState.totalRequired) ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    <span className="inline-flex items-center px-3 text-sm text-gray-600 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md">
                      {currency}
                    </span>
                  </div>
                  {showValidationErrors && currentTabState.totalValidationError && (
                    <p className="text-xs text-red-500 mt-1">{currentTabState.totalValidationError}</p>
                  )}
                  {showValidationErrors && currentTabState.totalRequired && (
                    <p className="text-xs text-red-500 mt-1">Total amount is required.</p>
                  )}
                  {currentTabState.hours && !currentTabState.totalStr && (
                    <p className="text-xs text-red-500 mt-1">
                      Please enter a total amount for this package.
                    </p>
                  )}
                  {currentTabState.monotonicityError && (
                    <p className="text-xs text-red-500 mt-1">{currentTabState.monotonicityMsg}</p>
                  )}
                </div>
              </div>

              {/* Hourly Rate display - Moved outside Inputs Grid */}
              <div className="text-right mt-1">
                <span className="text-xs text-gray-500">Hourly rate</span>
                <p className="font-semibold text-gray-800">${money(hourlyRate)} /Hr</p>
              </div>

              {/* Commission Table Section */}
              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-800 mb-1">Amount You Will Receive</h5>
                <p className="text-xs text-gray-500 mb-2">(per total hours you teach)</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {hasItems(commissionTiers) && commissionTiers.map((tier, index) => {
                    const tierKey = `${tier.minHours}-${tier.maxHours || '∞'}`;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveFeeTab(tierKey)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          activeFeeTab === tierKey ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tier.minHours}-{tier.maxHours || '∞'}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Website fee: <span className="font-medium">{Math.round(commissionRate)}%</span>
                </p>

                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        {['Total hour', 'Total amount', 'website fees', 'You receive Net'].map(header => (
                          <th key={header} className="py-2 pr-2 font-medium">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activePackagesForTable.map(({ tierName, hours, totalAmount, fee, netAmount, netPerHour }) => (
                        <tr key={tierName} className="border-b last:border-b-0">
                          <td className="py-2 pl-2">{hours}</td>
                          <td className="py-2 px-2">${money(totalAmount)}</td>
                          <td className="py-2 px-2 text-red-600">-${money(fee)}</td>
                          <td className="py-2 pr-2 font-semibold">
                            ${money(netPerHour)} /Hr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 text-center px-4">
              <div>
                <p className="mb-2">Package disabled</p>
                <p className="text-sm text-gray-400">
                  Click the circle icon in the top-right corner to activate this package
                </p>
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
