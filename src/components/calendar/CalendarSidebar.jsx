
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown, Plus, X, Clock, Info, DollarSign, CheckCircle2, Pencil } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { format } from "date-fns";
import DateRangePicker from '../common/DateRangePicker';
import { User } from '@/api/entities';
import { AppRole } from '@/api/entities';

// Master category definitions - static internal structure
// Each category has a 'perspectives' array indicating which role_ids (from AppRole) it applies to.
const MASTER_CALENDAR_CATEGORIES = [
{ key: 'not-reviewed', text: 'Not Reviewed', color: 'bg-red-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'booked', text: 'Booked', color: 'bg-orange-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: false },
{ key: 'availability', text: 'Availability', color: 'bg-green-500', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'completed', text: 'Completed', icon: <DollarSign className="w-4 h-4" />, perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'cancelled', text: 'Cancelled', icon: <X className="w-4 h-4 rounded-full bg-gray-700 text-white p-0.5" />, perspectives: ['teacher-t', 'student-s'], defaultChecked: true },
{ key: 'synced', text: 'Synced Calendar Events', color: 'bg-blue-500', perspectives: ['teacher-t', 'student-s'], defaultChecked: false },
{ key: 'seq-saved', text: 'Sequence Saved', color: 'bg-orange-400', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'seq-edited', text: 'Sequence Edited', color: 'bg-green-400', perspectives: ['teacher-t'], defaultChecked: false },
{ key: 'waiting', text: 'Waiting For Confirmation', color: 'bg-pink-200', perspectives: ['teacher-t'], defaultChecked: false }];


const LegendItem = ({ color, text, icon, checked, isHeader, onCheckedChange, itemKey }) =>
<li className="flex items-center text-sm text-gray-700 py-1">
    {isHeader ?
  <span className="flex-grow font-semibold">{text}</span> :

  <>
        {/* Render color dot only if 'color' prop exists and not an icon */}
        {color && !icon && <div className={`w-3 h-3 rounded-full mr-3 ${color}`}></div>}
        {/* Render icon if 'icon' prop exists */}
        {icon && <div className="mr-3">{icon}</div>}
        <span className="flex-grow">{text}</span>
        {checked !== undefined && checked !== null && // Render checkbox only if 'checked' prop is explicitly defined
    <Checkbox
      checked={checked}
      onCheckedChange={(newChecked) => onCheckedChange(itemKey, newChecked)}
      aria-label={`Toggle ${text} events`} // Accessibility
      className="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
    }
      </>
  }
  </li>;


const ActionTab = ({ activeTab, tabName, label, setActiveTab }) =>
<Button
  variant={activeTab === tabName ? 'solid' : 'outline'}
  onClick={() => setActiveTab(tabName)}
  className={`w-full justify-center ${activeTab === tabName ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>

        {label}
    </Button>;


const TimeAvailabilityRow = ({ onRemove }) =>
<div className="flex items-center gap-2">
        <div className="relative flex-1">
             <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
             <Input type="time" className="pl-9" />
        </div>
        <div className="relative flex-1">
             <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
             <Input type="time" className="pl-9" />
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="text-gray-500 hover:bg-gray-100">
            <X className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
            <Plus className="w-4 h-4" />
        </Button>
    </div>;


// Function to get initial active keys based on defaultChecked property
const getInitialActiveLegendKeys = () => {
  return MASTER_CALENDAR_CATEGORIES.
  filter((category) => category.defaultChecked).
  map((category) => category.key);
};

export default function CalendarSidebar({ view, setView, onLegendFilterChange }) {
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('setavail');
  const [dateRanges, setDateRanges] = useState([{ id: 1 }]);
  const [timeRanges, setTimeRanges] = useState([1]);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [user, setUser] = useState(null); // Retained state but not used in new legend logic
  const [appRoles, setAppRoles] = useState([]); // Retained state but not used in new legend logic
  const [legendItems, setLegendItems] = useState([]);
  const [loadingLegend, setLoadingLegend] = useState(true);

  // New state to manage active (checked) legend filters - ensure defaults are checked
  const [activeLegendKeys, setActiveLegendKeys] = useState(getInitialActiveLegendKeys);

  useEffect(() => {
    const initializeLegend = async () => {
      setLoadingLegend(true);
      try {
        // Always show the complete legend with headers for teachers
        const generatedItems = [];

        // Add role headers - always show these for teacher calendar
        generatedItems.push({
          key: 'header-teacher',
          text: 'As A Teacher (T)',
          isHeader: true
        });

        generatedItems.push({
          key: 'header-student',
          text: 'As A Student (S)',
          isHeader: true
        });

        // Add all categories - show all legend items
        MASTER_CALENDAR_CATEGORIES.forEach((category) => {
          generatedItems.push({
            key: category.key,
            text: category.text,
            color: category.color,
            icon: category.icon,
            checked: category.defaultChecked, // This 'checked' property is for LegendItem's internal logic, not the controlled state directly
            isHeader: false
          });
        });

        setLegendItems(generatedItems);

        // Set the initial active keys based on the categories that have defaultChecked
        const initialActiveKeysForLegend = MASTER_CALENDAR_CATEGORIES.
        filter((category) => category.defaultChecked).
        map((category) => category.key);
        setActiveLegendKeys(initialActiveKeysForLegend);

      } catch (error) {
        console.error("Failed to initialize legend:", error);
        // Fallback: Show complete legend anyway with correct defaultChecked items
        const fallbackItems = [
        { key: 'header-teacher', text: 'As A Teacher (T)', isHeader: true },
        { key: 'header-student', text: 'As A Student (S)', isHeader: true },
        { key: 'not-reviewed', color: 'bg-red-500', text: 'Not Reviewed', checked: true, isHeader: false },
        { key: 'booked', color: 'bg-orange-500', text: 'Booked', isHeader: false },
        { key: 'availability', color: 'bg-green-500', text: 'Availability', isHeader: false },
        { key: 'completed', icon: <DollarSign className="w-4 h-4" />, text: 'Completed', checked: true, isHeader: false },
        { key: 'cancelled', icon: <X className="w-4 h-4 rounded-full bg-gray-700 text-white p-0.5" />, text: 'Cancelled', checked: true, isHeader: false },
        { key: 'synced', color: 'bg-blue-500', text: 'Synced Calendar Events', isHeader: false },
        { key: 'seq-saved', color: 'bg-orange-400', text: 'Sequence Saved', isHeader: false },
        { key: 'seq-edited', color: 'bg-green-400', text: 'Sequence Edited', isHeader: false },
        { key: 'waiting', color: 'bg-pink-200', text: 'Waiting For Confirmation', isHeader: false }];

        setLegendItems(fallbackItems);
        setActiveLegendKeys(['not-reviewed', 'completed', 'cancelled']); // Hardcode initial active keys for fallback
      } finally {
        setLoadingLegend(false);
      }
    };

    // Note: User.me() and AppRole.list() are no longer called here as the legend logic no longer depends on them.
    // If these are needed for other parts of CalendarSidebar, they should be fetched separately.
    initializeLegend();
  }, []);

  // New useEffect for propagating filter changes to parent component
  useEffect(() => {
    if (onLegendFilterChange) {
      onLegendFilterChange(activeLegendKeys);
    }
  }, [activeLegendKeys, onLegendFilterChange]);

  // Handle checkbox changes from LegendItem
  const handleLegendCheckedChange = (itemKey, newChecked) => {
    setActiveLegendKeys((prevKeys) => {
      if (newChecked) {
        return [...new Set([...prevKeys, itemKey])]; // Add key if checked
      } else {
        return prevKeys.filter((key) => key !== itemKey); // Remove key if unchecked
      }
    });
  };

  const addDateRange = () => {
    const newId = Math.max(...dateRanges.map((r) => r.id), 0) + 1;
    setDateRanges([...dateRanges, { id: newId }]);
  };

  const removeDateRange = (idToRemove) => {
    if (dateRanges.length === 1) {
      return;
    }
    setDateRanges(dateRanges.filter((range) => range.id !== idToRemove));
  };

  const handleViewChange = (newView) => {
    if (newView === 'Month') {
      window.location.href = createPageUrl('TeacherCalendar');
    } else if (newView === 'Week') {
      window.location.href = createPageUrl('TeacherCalendarWeekly');
    }
    setView(newView);
  };

  return (
    <aside className="w-full lg:w-[340px] flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Teacher Calendar</h3>
                    <Select value={view} onValueChange={handleViewChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Month">Month</SelectItem>
                            <SelectItem value="Week">Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div>
                    <Button
            variant="ghost"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            className="w-full justify-start px-2 text-gray-800 font-bold hover:bg-gray-100">

                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${isLegendOpen ? '' : '-rotate-90'}`} />
                        Legend
                    </Button>
                    {isLegendOpen &&
          <ul className="mt-2 pl-4 space-y-1">
                            {loadingLegend ?
            <li className="text-sm text-gray-500">Loading...</li> :

            legendItems.map((item) =>
            <LegendItem
              key={item.key}
              itemKey={item.key} // Pass itemKey for callback
              color={item.color}
              text={item.text}
              icon={item.icon}
              isHeader={item.isHeader}
              // Pass checked prop only if the item is supposed to have a checkbox
              checked={item.checked !== undefined ? activeLegendKeys.includes(item.key) : undefined}
              onCheckedChange={handleLegendCheckedChange} />

            )
            }
                        </ul>
          }
                </div>

                <div className="space-y-2">
                    <ActionTab activeTab={activeTab} tabName="setprice" label="Set Price" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="book" label="New Booking" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="task" label="Task Manager" setActiveTab={setActiveTab} />
                    <ActionTab activeTab={activeTab} tabName="setavail" label="Set Availability" setActiveTab={setActiveTab} />
                </div>

                {activeTab === 'setavail' &&
        <div className="border rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-gray-800">Set Availability</h4>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 flex items-center">
                                Open or close for booking <Info className="w-4 h-4 ml-1 text-gray-400" />
                            </label>
                            <div className="flex space-x-2 mt-2">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Open</Button>
                                <Button size="sm" variant="outline">Closed</Button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Date Availability</label>
                            <div className="space-y-3 mt-2">
                                {dateRanges.map((range, index) =>
              <DateRangePicker
                key={range.id}
                onRemove={() => removeDateRange(range.id)}
                onAdd={index === dateRanges.length - 1 ? addDateRange : null}
                onRangeChange={(rangeData) => console.log('Range selected:', rangeData)}
                isOnlyRow={dateRanges.length === 1} />

              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                                <Checkbox id="no-end-date" />
                                <label htmlFor="no-end-date" className="text-sm font-medium text-gray-700">No end date</label>
                            </div>
                        </div>

                        <div>
                            <Button variant="ghost" className="w-full justify-start p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent">
                                <ChevronDown className="w-4 h-4 mr-1" /> Advanced date selection
                            </Button>
                             <Button variant="ghost" className="w-full justify-start p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent">
                                <ChevronDown className="w-4 h-4 mr-1" /> View Monthly Calander
                            </Button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <Checkbox id="time-avail" />
                            <label htmlFor="time-avail" className="text-sm font-medium text-gray-700">Time Availability</label>
                            <Info className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            {timeRanges.map((id) =>
            <TimeAvailabilityRow key={id} onRemove={() => setTimeRanges(timeRanges.filter((rId) => rId !== id))} />
            )}
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-600 space-y-2">
                            <h5 className="font-bold text-gray-800">Changes will be made to the following dates & hours:</h5>
                            <div>
                                <h6 className="font-semibold">Dates:</h6>
                                <p>20 June 2021 – 21 Oct 2021 (every day)</p>
                                <p>20 Nov 2021 – 21 Dec 2021 (Su, Mo, We, Th, Sa)</p>
                            </div>
                            <div>
                                <h6 className="font-semibold">Timings For All Dates:</h6>
                                <p>12:00 – 17:00, 19:00 - 22:00</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="w-full">Cancel</Button>
                            <Button className="w-full bg-green-600 hover:bg-green-700">Save Dates</Button>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Last Updated: Today</p>
                            <p className="text-sm text-green-600 font-medium flex items-center">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Your Calendar is Updated
                            </p>
                        </div>
                    </div>
        }
                
                {activeTab !== 'setavail' && <div className="text-center p-4 border rounded-lg text-gray-500">Content for {activeTab}</div>}

            </div>

             <div className="bg-white rounded-lg shadow p-6 space-y-4 mt-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingPreferences(!isEditingPreferences)}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center">
                            Availability Window <Info className="w-4 h-4 ml-2 text-gray-400" />
                        </h4>
                        <div className="flex space-x-2">
                            <Input className="flex-1 text-center" defaultValue="1" disabled={!isEditingPreferences} />
                            <Select defaultValue="hours" disabled={!isEditingPreferences}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center">
                            How far in advance can students book? <Info className="w-4 h-4 ml-2 text-gray-400" />
                        </h4>
                        <div className="flex space-x-2">
                            <Input className="flex-1 text-center" defaultValue="1" disabled={!isEditingPreferences} />
                            <Select defaultValue="hours" disabled={!isEditingPreferences}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hours">Hours</SelectItem>
                                    <SelectItem value="days">Days</SelectItem>
                                    <SelectItem value="weeks">Weeks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2 flex items-center">
                            Break after a class <Info className="w-4 h-4 ml-2 text-gray-400" />
                        </h4>
                        <div className="flex space-x-2">
                            <Input className="flex-1 text-center" defaultValue="1" disabled={!isEditingPreferences} />
                            <Select defaultValue="hours" disabled={!isEditingPreferences}>
                                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minutes">Minutes</SelectItem>
                                    <SelectItem value="hours">Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                
                {isEditingPreferences &&
        <div className="flex justify-end pt-2">
                         <Button size="sm" onClick={() => setIsEditingPreferences(false)}>Save</Button>
                    </div>
        }
            </div>
        </aside>);

}