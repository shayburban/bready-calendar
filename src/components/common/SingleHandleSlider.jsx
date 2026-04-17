import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw } from 'lucide-react';

const SingleHandleSlider = ({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  suffix = "", 
  inputLabel = "Value", 
  className = "",
  onReset
}) => {
  const currentValue = typeof value === 'number' ? value : min;
  
  const handleSliderChange = (newValue) => {
    onChange(newValue[0]);
  };

  const handleInputChange = (newValue) => {
    const numValue = parseInt(newValue) || min;
    const clampedValue = Math.max(min, Math.min(numValue, max));
    onChange(clampedValue);
  };

  const handleReset = () => {
    const resetValue = onReset ? onReset() : min;
    onChange(resetValue);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-4">{label}</label>}
      
      {/* Fixed height container for alignment */}
      <div className="h-40 flex flex-col justify-between">
        {/* Input box */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-4 w-24 h-16 flex items-center justify-center">
              <Input
                type="number"
                min={min}
                max={max}
                value={currentValue || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className="text-center text-lg font-semibold border-none bg-transparent p-0 h-auto"
              />
            </div>
            <span className="text-xs text-gray-500 mt-1">{inputLabel}</span>
          </div>

          {suffix && (
            <div className="flex flex-col items-center ml-4">
              <div className="bg-gray-100 border-2 border-gray-200 rounded-lg px-3 py-2 h-16 flex items-center">
                <span className="text-lg font-medium text-gray-700">{suffix}</span>
              </div>
            </div>
          )}
        </div>

        {/* Custom Single Handle Slider with visible ball */}
        <div className="relative px-2">
          <div className="relative h-3">
            {/* Track background */}
            <div className="absolute top-1 left-0 right-0 h-1 bg-blue-500 rounded-full"></div>
            
            {/* Single handle (ball) */}
            <div 
              className="absolute top-0 w-3 h-3 bg-white border-4 border-blue-500 rounded-full cursor-pointer transform -translate-x-1/2 hover:scale-110 transition-transform shadow-md"
              style={{ 
                left: `${((currentValue - min) / (max - min)) * 100}%` 
              }}
            ></div>
          </div>
          
          {/* Hidden slider for functionality */}
          <Slider
            value={[currentValue]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
            className="w-full absolute top-0 opacity-0"
          />
        </div>

        {/* Reset button */}
        <div className="flex justify-end mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SingleHandleSlider;