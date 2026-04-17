
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { DollarSign, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

const PricingCard = ({ service, onUpdate, config, showValidationErrors = false, onDelete, showDelete = false }) => {
  const {
    id,
    title,
    enabled,
    price,
    tooltip,
  } = service;
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Error only if validations are requested
  const hasError =
    showValidationErrors && enabled && (!price || parseFloat(price) <= 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ensure the click is outside the tooltip content wrapper.
      // With `data-tooltip-trigger-id` removed, we rely on the button's own onClick for toggling
      // and this effect for general outside clicks on the content.
      if (tooltipOpen && !event.target.closest('[data-radix-popper-content-wrapper]')) {
        setTooltipOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltipOpen]); // Removed id from dependency array as data-tooltip-trigger-id is no longer used in this effect's logic

  const calculateReceiveAmount = (inputPrice, commissionRate) => {
    if (!inputPrice || inputPrice <= 0) return 0;
    const commission = commissionRate / 100;
    return (inputPrice * (1 - commission)).toFixed(2);
  };

  return (
    <div className="h-full">
      <label
        className="cursor-default block h-full"
        // The service enable/disable logic has been moved to the toggle div, so removed from here.
        onClickCapture={(e) => {
          const t = e.target;
          const inToggle = t.closest?.('[data-role="service-toggle"]');
          const isInput = t.closest?.('input,textarea,select,[role="textbox"]');
          // Identify the info button by its class attributes, since data-tooltip-trigger-id is removed.
          const isInfo = t.closest?.('button.p-1.rounded-full[type="button"]');
          const isDelete = t.closest?.('button[type="button"]')?.querySelector('svg[viewBox="0 0 24 24"]');
          
          // Prevent the label's default behavior and propagation if the click
          // is not on the toggle, an input, or the info button.
          if (!inToggle && !isInput && !isInfo && !isDelete) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div
          className={`
            h-full p-4 md:p-6 rounded-lg border-2 transition-all duration-200 flex flex-col cursor-default
            ${
              hasError
                ? 'border-red-500 bg-red-50 shadow-lg ring-2 ring-red-200'
                : enabled
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }
          `}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              {title}
              {tooltip && (
                <TooltipProvider>
                  <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        // data-tooltip-trigger-id={id} was removed as per outline
                        onClick={(e) => {
                          e.stopPropagation(); // Stop propagation to prevent label's onClickCapture from firing
                          setTooltipOpen(!tooltipOpen);
                        }}
                        className={`${
                          title === 'Technical Interview' ? 'ml-1' : 'ml-2'
                        } p-1 rounded-full cursor-pointer ${enabled ? 'bg-blue-100 hover:bg-blue-200' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        <Info className="w-3 h-3 text-gray-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {showDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Delete button clicked for service:', id); // Add for debugging
                    if (onDelete) {
                      onDelete(id);
                    }
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-red-100 hover:bg-red-200 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <div
                data-role="service-toggle" // Added data-role for easier identification in onClickCapture
                className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer
                  transition-transform transition-colors duration-200
                  ${enabled
                    ? 'bg-blue-500 hover:scale-105 hover:ring-2 hover:ring-blue-300'
                    : 'border border-gray-300 hover:border-blue-400 hover:bg-gray-100 hover:scale-105 hover:ring-2 hover:ring-blue-200' // Corrected typo: hover:ring-200 to hover:ring-blue-200
                  }`}
                onClick={(e) => { // Now this div explicitly handles the toggle
                  e.stopPropagation(); // Stop propagation to prevent label's onClickCapture from firing
                  onUpdate(id, 'enabled', !enabled);
                }}
              >
                {enabled && <Check className="w-4 h-4 text-white" />}
              </div>
            </div>
          </div>

          {enabled ? (
            <div className="space-y-4 flex-grow flex flex-col">
              {/* Hourly Rate (existing) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                  Hourly Rate
                </label>
                <div className="flex">
                  <Input
                    type="number"
                    placeholder="Type price"
                    value={price || ''}
                    onChange={(e) =>
                      onUpdate(
                        id,
                        'price',
                        Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                      // Allow numbers, backspace, delete, arrow keys, tab
                      if (
                        !/[0-9.]/.test(e.key) && // Only allow numbers and decimal
                        e.key !== 'Backspace' &&
                        e.key !== 'Delete' &&
                        e.key !== 'ArrowLeft' &&
                        e.key !== 'ArrowRight' &&
                        e.key !== 'Tab'
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onClick={(e) => e.stopPropagation()} // Stop propagation to prevent label's onClickCapture from firing
                    className={`relative focus:z-10 rounded-r-none ${
                      hasError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : ''
                    }`}
                    disabled={!enabled}
                    min="0"
                  />
                  <div className={`px-3 py-2 border border-l-0 border-gray-300 rounded-r-md flex items-center whitespace-nowrap ${enabled ? 'bg-gray-100' : 'bg-gray-50'}`}>
                    <DollarSign className={`w-4 h-4 mr-1 flex-shrink-0 ${enabled ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${enabled ? 'text-gray-700' : 'text-gray-400'}`}>/Hr</span>
                  </div>
                </div>
              </div>

              {/* Validation (existing behavior) */}
              {hasError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-red-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-red-600 text-sm font-medium">
                      Missing hourly rate
                    </p>
                  </div>
                  <p className="text-red-500 text-xs mt-1 ml-6">
                    Please enter a valid price to continue.
                  </p>
                </div>
              )}

              {/* Small text below input */}
              <p className={`text-xs ${enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                Including commission and charges but <strong>excluding</strong> taxes.
              </p>

              {/* Amount You Will Receive section */}
              <div className="rounded-lg p-4 mt-4 flex-grow">
                <h4 className={`text-sm font-semibold mb-3 ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  Amount You Will Receive
                </h4>
                <div className="space-y-2">
                  {/* Commission tiers */}
                  {(config?.commissionTiers ?? []).map((tier, index) => {
                    const receiveAmount = calculateReceiveAmount(price, tier.rate);
                    const tierLabel = `${tier.minHours} - ${tier.maxHours ? `${tier.maxHours} Teaching Hrs` : '∞ Teaching Hrs'}`;
                    
                    return (
                      <div key={index}>
                        <div className={`text-xs ${enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          {tierLabel}
                        </div>
                        <div className={`text-xs ${enabled ? 'text-gray-600' : 'text-gray-400'}`}>
                          {tier.rate}% Commission
                        </div>
                        <div className={`text-sm font-medium ${enabled ? 'text-blue-600' : 'text-gray-400'}`}>
                          Receive: ${receiveAmount}
                        </div>
                        {index < (config?.commissionTiers?.length || 0) - 1 && (
                          <div className="border-b border-gray-200 my-2"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 text-center px-4">
              <div>
                <p className="mb-2">Service disabled</p>
                <p className="text-sm text-gray-400">
                  Click the circle icon in the top-right corner to activate this service
                </p>
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};

export default PricingCard;
