import React from 'react';
import { Check } from 'lucide-react';

const ProgressBar = ({ steps, currentStep, showSubSteps, subStepTargetStep, currentSubStep, subStepsCount }) => {

  // Function to render the main progress steps
  const renderSteps = () => (
    steps.map((step, index) => {
      const isActive = step.number === currentStep;
      const isCompleted = step.number < currentStep;
      const isFirst = index === 0;
      const isLast = index === steps.length - 1;

      return (
        <div
          key={step.number}
          className={`
            relative flex items-center justify-center
            px-4 sm:px-6 py-3 min-w-[120px] sm:min-w-[160px]
            text-center text-sm font-medium transition-colors
            ${isActive ? 'z-10 bg-white' : isCompleted ? 'bg-gray-100' : 'bg-gray-100'}
            ${!isFirst ? '-ml-5' : ''}
            flex-1
            max-[639px]:min-w-0
            md:min-w-[120px] lg:min-w-[160px]
            max-[639px]:px-2 max-[639px]:py-2
            max-[639px]:-ml-1 sm:-ml-4 md:-ml-5
            pb-6 sm:pb-5
            whitespace-nowrap
            overflow-hidden
            ${!isFirst ? 'sm:-ml-2 md:-ml-3 lg:-ml-4' : ''}
            ${isActive ? 'bg-gray-200' : ''}
            ${!isFirst ? 'max-[639px]:ml-2' : ''}  /* phone-only space between tiles */
            max-[639px]:px-1                       /* slightly tighter phone padding so it still fits */
            ${!isFirst ? 'max-[639px]:-ml-[1px]' : ''}  /* override ml-2 with a tiny overlap to hide seam */
          `}
        >
          {/* Left chevron */}
          {!isFirst && (
            <div className={`hidden absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 transition-colors ${isActive ? 'bg-white' : 'bg-gray-100'} ${isActive ? 'bg-gray-200' : ''}`} style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }}></div>
          )}

          <div className="flex items-center z-20">
            <span className={`
              flex items-center justify-center rounded-full mr-2 transition-colors
              w-6 h-6 text-xs 
              ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}
              max-[639px]:w-5 max-[639px]:h-5 max-[639px]:text-[11px]
            `}>
              {isCompleted ? <Check className="w-4 h-4" /> : step.number}
            </span>
            <span className={`transition-colors hidden lg:inline whitespace-nowrap ${isActive ? 'text-blue-700' : 'text-gray-600'}`}>{step.title}</span>
          </div>

          {/* Always-visible 5a/5b/5c mini bars anchored to the step-5 tile */}
          {showSubSteps && step.number === (subStepTargetStep ?? steps.length) && (
            <div
              className="
                absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2
                flex items-center space-x-2
                z-30 pointer-events-none
              "
            >
              {Array.from({ length: subStepsCount }).map((_, index) => (
                <div
                  key={index}
                  className={`w-5 max-[639px]:w-3 h-1 rounded-full transition-colors
                    ${ (currentStep === (subStepTargetStep ?? steps.length)) && (index < (currentSubStep ?? 0)) ? 'bg-blue-600' : 'bg-gray-300' }
                  `}
                />
              ))}
            </div>
          )}
          
          {/* Right chevron */}
          {!isLast && (
            <div className={`hidden absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-10 h-10 transition-colors ${isActive ? 'bg-white' : 'bg-gray-100'} ${isActive ? 'bg-gray-200' : ''}`} style={{ clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }}></div>
          )}

          {/* Directional flow arrow (left → right) */}
          {(() => {
            const isLast =
              steps.findIndex(s => s.number === step.number) === steps.length - 1;
            return !isLast ? (
              <svg
                aria-hidden="true"
                className="hidden absolute bottom-1 right-2 sm:right-3 w-3 h-3 text-gray-300"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5l8 7-8 7V5z" />
              </svg>
            ) : null;
          })()}
        </div>
      );
    })
  );

  // Function to render the sub-step indicators
  const renderSubSteps = () => {
    if (!showSubSteps || currentStep !== subStepTargetStep) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-3 hidden">
        {[...Array(subStepsCount)].map((_, index) => (
          <div
            key={index}
            className={`w-5 max-[639px]:w-3 h-1 rounded-full transition-colors ${
              index < currentSubStep ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 py-4 md:py-5 mb-8 overflow-x-hidden max-[639px]:pb-10 overflow-y-visible">
      <div className="container mx-auto px-4 flex justify-center max-w-full overflow-x-hidden overflow-y-visible">
        <div className="flex flex-col">
          <div className="flex items-center flex-nowrap bg-gray-100 rounded-md max-[639px]:px-1">
            {renderSteps()}
          </div>
          {/* Mobile active step title */}
          <div className="lg:hidden mt-4 md:mt-3 text-center text-sm font-medium text-gray-700">
            {steps.find(s => s.number === currentStep)?.title}
          </div>
          {renderSubSteps()}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;