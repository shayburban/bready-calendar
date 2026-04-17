
import React, { useState, useEffect } from 'react';
import { useTeacher } from './TeacherContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminPricingConfig } from '@/api/entities';
import { Info, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
'@/components/ui/tooltip';

// A reusable card component for this page
const PolicyCard = ({ title, children, className = '', isDisabled = false }) =>
<Card className={`w-full flex flex-col transition-opacity ${className} ${isDisabled ? 'opacity-50 bg-gray-50 pointer-events-none' : ''}`}>
    <CardHeader className="bg-gray-50 pb-2 p-6 flex flex-col space-y-1.5">
      <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="bg-gray-50 pt-0 p-6 flex flex-col flex-grow">
      {children}
    </CardContent>
  </Card>;


const CommissionTierCard = ({ tier, services, cancellationFee }) => {
  // This function now calculates the teacher's earnings from a cancellation fee,
  // after the platform commission for that tier is deducted.
  const getReceivedAmount = (price) => {
    if (!price || !tier || typeof cancellationFee === 'undefined' || cancellationFee === null) return '$0.00';

    // 1. Calculate the initial fee collected from the student based on the cancellation policy.
    const initialFee = parseFloat(price) * (cancellationFee / 100);

    // 2. Calculate the final amount the teacher receives after platform commission is taken from that fee.
    const finalAmount = initialFee * (1 - tier.rate / 100);

    return `$${finalAmount.toFixed(2)}`;
  };

  // Filter services to only show enabled ones
  const enabledServices = services.filter((service) => service.enabled && !service.isTrial);

  return (
    <div className="bg-gray-50 border rounded-lg p-4 w-full">
      <p className="text-md font-semibold text-gray-800 underline decoration-dotted mb-2">{tier.minHours} - {tier.maxHours || '50+'} Teaching Hrs</p>
      <p className="text-xl font-bold text-blue-600 mb-4">
        <span style={{ fontSize: '14px', color: '#3d3d3d' }}>{tier.rate}%</span>
        <span className="text-sm font-normal text-gray-600 ml-1">Commission</span>
      </p>
      <p className="text-sm font-bold mb-2">You Will Receive (from cancellation):</p>
      <ul className="text-sm space-y-2 text-gray-700">
        {enabledServices.map((service) =>
        <li key={service.id} className="flex items-center flex-wrap gap-2">
            <span className="capitalize">
              {service.title || service.id}: 
            </span>
            <span className="font-semibold text-blue-600">
              {getReceivedAmount(service.price)}
            </span>
            {service.isCustom &&
          <span className="text-yellow-600 text-sm font-medium">
                (Pending)
              </span>
          }
          </li>
        )}
        {enabledServices.length === 0 &&
        <li className="text-gray-500 italic">No services selected</li>
        }
      </ul>
    </div>);

};

export default function Step5bCancellation() {
  const { services } = useTeacher();
  const [adminConfig, setAdminConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for teacher's policy choices, combined into one object
  const [cancellationFees, setCancellationFees] = useState({
    percentage: 0,
    freeCancellationDays: 10, // Default to 10 days, will be updated by admin config
    freeCancellationHours: 0,
    noRefund: false
  });

  // Generic updater for properties within the cancellationFees state object
  const updateCancellationFee = (field, value) => {
    setCancellationFees((prev) => ({ ...prev, [field]: value }));
  };

  // Derived state for disabling free cancellation options
  const isFreeCancellationDisabled = cancellationFees.percentage === 0;

  // NEW: Handle "No Refund" checkbox change with auto-reset logic
  const handleNoRefundChange = (checked) => {
    setCancellationFees((prev) => {
      const newState = { ...prev, noRefund: checked };
      if (checked) {
        newState.percentage = 100; // If checking "No Refund", force percentage to 100
      } else {
        newState.percentage = 0; // If unchecking "No Refund", force percentage to 0
      }
      return newState;
    });
  };

  // Effect to ensure `noRefund` state reflects `percentage` when percentage is changed directly
  // (e.g., via slider or input, not by the "No Refund" checkbox itself)
  useEffect(() => {
    setCancellationFees((prev) => ({
      ...prev,
      noRefund: prev.percentage === 100
    }));
  }, [cancellationFees.percentage]);


  // Reset free cancellation inputs when it becomes disabled
  useEffect(() => {
    if (isFreeCancellationDisabled) {
      const defaultDays = adminConfig?.cancellationPolicy?.studentCancellation?.defaultFreeCancellationDays || 10;
      setCancellationFees((prev) => ({
        ...prev,
        freeCancellationDays: defaultDays,
        freeCancellationHours: 0
      }));
    }
  }, [isFreeCancellationDisabled, adminConfig]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configs = await AdminPricingConfig.list();
        if (configs.length > 0) {
          setAdminConfig(configs[0]);
          // Set default days when config is loaded
          const defaultDays = configs[0].cancellationPolicy?.studentCancellation?.defaultFreeCancellationDays || 10;
          setCancellationFees((prev) => ({
            ...prev,
            freeCancellationDays: defaultDays
          }));
        }
      } catch (error) {
        console.error("Failed to fetch admin config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const maxDays = adminConfig?.cancellationPolicy?.studentCancellation?.maxFreeCancellationDays || 60;
  const maxHours = adminConfig?.cancellationPolicy?.studentCancellation?.maxFreeCancellationHours || 23;

  if (loading) {
    return <div className="text-center p-8">Loading configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8"> {/* Adjusted max-width and added vertical spacing */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Cancellation Policies If Student Cancels</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> {/* Changed grid to 2 columns for the first two cards */}
          {/* Select Cancellation Fees Card - NEW STRUCTURE FROM OUTLINE */}
          <PolicyCard
            title={
            <div className="flex items-center justify-center gap-2">
                <span>Select Cancellation Fees</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="p-1 rounded-full bg-blue-100 hover:bg-blue-200">
                        <Info className="w-4 h-4 text-blue-600" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-black text-white p-2">
                      <p>
                        Set the percentage of the lesson fee that students will be charged when they cancel after your free cancellation period.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Percentage</label>
                  <div className="w-32 mx-auto">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={cancellationFees.percentage}
                      onChange={(e) => {
                        const newValue = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        updateCancellationFee('percentage', newValue);
                      }}
                      className="text-center text-2xl font-semibold h-16" />
                    
                  </div>
                </div>

                {/* Slider */}
                <div className="px-4">
                  <Slider
                    value={[cancellationFees.percentage]}
                    onValueChange={(value) => {
                      updateCancellationFee('percentage', value[0]);
                    }}
                    max={100}
                    step={1}
                    className="w-full" />
                  
                </div>

                {/* No Refund Checkbox */}
                <div className="flex items-center space-x-2 justify-center">
                  <Checkbox
                    id="no-refund"
                    checked={cancellationFees.noRefund}
                    onCheckedChange={handleNoRefundChange} />
                  
                  <label
                    htmlFor="no-refund"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    
                    No Refund
                  </label>
                </div>
              </div>
            </div>
          </PolicyCard>
          
          <PolicyCard
            title={
            <div className="flex items-center justify-center gap-2">
                <span>Free Cancellation Before Booking</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-5 h-5 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-white p-2">
                      <p className="max-w-xs">
                        Allow students to cancel without penalty within this timeframe. For example: If set to 2 days and 4 hours, students can cancel free of charge up to 2 days and 4 hours before the lesson starts.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
            isDisabled={isFreeCancellationDisabled}>
            
            <div className="space-y-6 px-2">
              {/* Days Slider */}
              <div className="space-y-2">
                  <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Days</label>
                      <Input
                    type="number"
                    value={cancellationFees.freeCancellationDays}
                    onChange={(e) => updateCancellationFee('freeCancellationDays', Math.max(0, Math.min(maxDays, Number(e.target.value))))}
                    className="w-20 text-center h-9"
                    disabled={isFreeCancellationDisabled} />
                  
                  </div>
                  <Slider
                  value={[cancellationFees.freeCancellationDays]}
                  onValueChange={(value) => updateCancellationFee('freeCancellationDays', value[0])}
                  max={maxDays}
                  step={1}
                  disabled={isFreeCancellationDisabled} />
                
              </div>
              {/* Hours Slider */}
              <div className="space-y-2">
                  <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Hours</label>
                      <Input
                    type="number"
                    value={cancellationFees.freeCancellationHours}
                    onChange={(e) => updateCancellationFee('freeCancellationHours', Math.max(0, Math.min(maxHours, Number(e.target.value))))}
                    className="w-20 text-center h-9"
                    disabled={isFreeCancellationDisabled} />
                  
                  </div>
                  <Slider
                  value={[cancellationFees.freeCancellationHours]}
                  onValueChange={(value) => updateCancellationFee('freeCancellationHours', value[0])}
                  max={maxHours}
                  step={1}
                  disabled={isFreeCancellationDisabled} />
                
              </div>
            </div>
          </PolicyCard>

          <PolicyCard className="h-full" title="Trial Lesson">
            <p className="text-center text-sm text-gray-600 mb-2 font-semibold">Fees You Will Receive</p>
            <p className="text-center text-sm text-gray-600">
              No cancellation fees will be taken for canceling of trial lesson. Only first hour with a specific student.
            </p>
          </PolicyCard>
        </div>

        


        <h3 className="text-xl font-semibold text-gray-800 mb-2">Fees You Will Receive</h3>
        <p className="text-sm text-gray-500 mb-4">Including commission and charges.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {adminConfig?.commissionTiers.map((tier, index) =>
          <CommissionTierCard key={index} tier={tier} services={services} cancellationFee={cancellationFees.percentage} />
          )}
        </div>

        <p className="font-semibold text-decoration-underline">Package Fees</p>
        <p className="text-sm text-gray-500 mb-6">Same cancellation policies as regular hour.</p>
      </div>

      {/* Teacher Cancellation Policies Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cancellation Policies If You Cancel</h2>
        <ul className="mb-4">
          <li className="flex items-center text-gray-700">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
            You have maximum 5 meetings to cancel for 100 bookings.
          </li>
        </ul>
        
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">Penalty</h4>
          <p className="text-gray-600 mb-4">
            A penalty will be applied if you exceed the maximum number of cancellations. The <span className="font-bold">penalty increases</span> with each additional cancellation.
          </p>
          
          {/* Yellow warning box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-800 font-medium">
              You will be penalized by being shown less often in search results and receiving fewer student requests.
            </p>
          </div>
        </div>
      </div>
    </div>);

}