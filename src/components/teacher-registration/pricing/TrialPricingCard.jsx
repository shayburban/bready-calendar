import React from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const TrialPricingCard = ({
  service,
  onUpdate,
  config,
  lowestHourlyRate,
  hasEnabledServices
}) => {
  const { id, title, trialPercentage, tooltip } = service;
  // Admin limits (single source of truth)
const minPct = Number(config?.trialLesson?.adminMinPercentage ?? 0);
const maxPct = Number(config?.trialLesson?.adminMaxPercentage ?? 100);

// Clamp utility
const clampPct = (n) => {
  if (!Number.isFinite(n)) return minPct;
  return Math.min(maxPct, Math.max(minPct, n));
};

// Parse % (empty → 0 to "force 0" behavior)
const parsePct = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isNaN(n) ? 0 : n;
};

// Block scientific notation / signs in number input
const blockBadKeys = (e) => {
  if (['e','E','+','-'].includes(e.key)) e.preventDefault();
};

  // Tooltip content preference: service.tooltip → default recommended example
  const trialTooltipText =
    tooltip ||
    'Recommended: set 40–60% of your lowest hourly rate. Example: if your lowest service is $15/hr and you set 60%, students pay $9; with a 10% commission you receive $8.10.';

  // Use clamped numeric percentage for all math
    const pct = clampPct(Number.isFinite(trialPercentage) ? trialPercentage : 0);

    // Ensure numeric inputs
    const safeLowestRate = Number(lowestHourlyRate) || 0;
    const commissionPct = Number(config?.trialLesson?.commissionRate ?? 0);

    // Compute numerically, then format for display
    const rawTrialPrice = safeLowestRate * (pct / 100);
    const rawReceive = rawTrialPrice * (1 - commissionPct / 100);

    const trialPrice = rawTrialPrice.toFixed(2);
    const trialReceiveAmount = rawReceive.toFixed(2);
    const trialCommission = commissionPct;

    // Use clamped pct for the validation rule
    const isTrialPriceInvalid = pct > 0 && !hasEnabledServices;

    // Auto-snap trialPercentage if admin changes the allowed range
    React.useEffect(() => {
      // Normalize current value; force 0 if undefined/empty
      const current = Number.isFinite(trialPercentage) ? trialPercentage : 0;

      // Clamp to the latest admin range
      const clamped = clampPct(current);

      // Update only if needed to avoid render loops
      if (clamped !== trialPercentage) {
        onUpdate(id, 'trialPercentage', clamped);
      }
      // Only re-run when admin limits change
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minPct, maxPct]);

  return (
    <div className="h-full">
      <div className={`
        h-full p-4 md:p-6 rounded-lg border-2 transition-all duration-200 flex flex-col
        border-blue-500 bg-blue-50 shadow-lg
      `}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
            {title === 'Trial' ? 'Trial lesson' : title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-2 p-1 rounded-full bg-blue-100 hover:bg-blue-200"
                    aria-label="How trial pricing works"
                  >
                    <Info className="w-4 h-4 text-blue-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{trialTooltipText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
        </div>

        <div className="space-y-4 flex-grow flex flex-col">
          <p className="text-gray-600 text-sm">
            Trial lesson price is a percentage of your lowest service rate.
          </p>
          {isTrialPriceInvalid && (
            <p className="text-red-500 text-sm mt-2">
              ⚠️ Add at least one service price to calculate trial price.
            </p>
          )}
          <div className="text-center flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Percentage of Lowest Rate
              <span className="ml-2 text-xs text-gray-500">(Allowed: {minPct}%–{maxPct}%)</span>
            </label>
            <div className="w-32 mx-auto mb-4">
              <Input
                type="number"
                inputMode="numeric"
                min={minPct}
                max={maxPct}
                value={clampPct(Number.isFinite(trialPercentage) ? trialPercentage : 0)}
                placeholder={`${minPct}–${maxPct}`}
                onKeyDown={blockBadKeys}
                onChange={(e) => {
                  // "Force 0" when cleared, then clamp to admin range
                  const parsed = parsePct(e.target.value); // empty → 0
                  const next = clampPct(parsed);
                  onUpdate(id, 'trialPercentage', next);
                }}
                onBlur={(e) => {
                  const parsed = parsePct(e.target.value);
                  const next = clampPct(parsed);
                  if (next !== trialPercentage) onUpdate(id, 'trialPercentage', next);
                }}
                className="text-center"
              />

            </div>
            <Slider
              value={[clampPct(Number.isFinite(trialPercentage) ? trialPercentage : 0)]}
              onValueChange={(value) => {
                const next = clampPct(value[0]);
                onUpdate(id, 'trialPercentage', next);
              }}
              min={minPct}
              max={maxPct}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{minPct}%</span>
              <span>{maxPct}%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center mt-auto pt-4">
            <p>Price Student Pays: <span className="font-bold text-gray-800">${trialPrice}</span></p>
            <p><strong>{trialCommission}%</strong> Bready.com commission</p>
            <p className="text-base mt-1">You Receive: <span className="text-blue-600 font-bold">${trialReceiveAmount}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialPricingCard;
