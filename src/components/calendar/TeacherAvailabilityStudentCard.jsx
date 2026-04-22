
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoreVertical, Pencil, Trash2, Mail, ChevronDown, Clock, AlertTriangle, X } from 'lucide-react';
import TabSelector from '../common/TabSelector';
import { cn } from '@/lib/utils';

export default function TeacherAvailabilityStudentCard({ event, onClose }) {
    const [date, setDate] = useState(new Date(2021, 6, 19));
    const [activeTimeSlot, setActiveTimeSlot] = useState('15:00 - 16:00');
    const [showWarning, setShowWarning] = useState(true);
    const [repeatOpen, setRepeatOpen] = useState(false);
    const [activeDays, setActiveDays] = useState(['M', 'T1', 'W']);

    const timeSlots = [
        { value: '15:00 - 16:00', label: '15:00 - 16:00' },
        { value: '17:00 - 19:00', label: '17:00 - 19:00' },
        { value: '17:00 - 19:00 b', label: '17:00 - 19:00' },
        { value: '17:00 - 19:00 c', label: '17:00 - 19:00' },
        { value: '17:00 - 19:00 d', label: '17:00 - 19:00' },
    ];

    const weekDays = [
        { id: 'S1', label: 'S' },
        { id: 'M', label: 'M' },
        { id: 'T1', label: 'T' },
        { id: 'W', label: 'W' },
        { id: 'T2', label: 'T' },
        { id: 'F', label: 'F' },
        { id: 'S2', label: 'S' },
    ];

    const toggleDay = (id) => {
        setActiveDays(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center font-bold text-lg mb-2">Teacher Availability (S)</h3>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-center flex items-center gap-2 mb-2">
                        <span>{date.toLocaleDateString('de-DE')}</span>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
            </Popover>

            <div className="flex justify-center items-center gap-2 mb-3">
                <TabSelector
                    tabs={timeSlots}
                    activeTab={activeTimeSlot}
                    onTabChange={setActiveTimeSlot}
                    maxVisibleTabs={2}
                    moreLabel={`+${timeSlots.length - 2} More`}
                    variant="green"
                />
            </div>

            <div className="flex justify-end items-center mb-2">
                <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon"><Mail className="w-4 h-4" /></Button>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                        <ul className="space-y-1">
                            <li><Button variant="ghost" className="w-full justify-start">View As A Teacher (T)</Button></li>
                        </ul>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="text-sm space-y-1 mb-3">
                <p className="text-gray-900 font-bold underline">Aman R.</p>
                <p>15:00 - 16:00 &nbsp; 19.07.2021</p>
                <p>Delhi, India</p>
            </div>

            <p className="text-sm font-bold underline mt-2 mb-1">Teacher’s Price</p>
            <div className="text-sm space-y-1 mb-3">
                <p><span className="font-bold opacity-75">Trial Lesson:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Online Classes:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Consulting:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Technical Interview:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Packages:</span> 4 $ for 1 Hr. till 03.08.2021 4 Hrs. left on this package</p>
            </div>

            <p className="text-sm font-bold underline mt-5 mb-3">Book This Teacher</p>

            <Select>
                <SelectTrigger className="bg-gray-50 mb-4">
                    <SelectValue placeholder="Select Service" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="online">Online Class</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="technical">Technical Interview</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-medium text-gray-600">Start Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input type="text" placeholder="Select Time" className="pl-9 bg-gray-50" />
                    </div>
                </div>
                <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-medium text-gray-600">End Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input type="text" placeholder="Select Time" className="pl-9 bg-gray-50" />
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <button
                    type="button"
                    onClick={() => setRepeatOpen(!repeatOpen)}
                    className="flex items-center gap-2 font-bold text-sm"
                >
                    <ChevronDown className={cn("w-4 h-4 transition-transform", !repeatOpen && "-rotate-90")} />
                    Repeat
                </button>
                {repeatOpen && (
                    <div className="mt-3">
                        <ul className="flex gap-2 mb-3">
                            {weekDays.map(day => (
                                <li key={day.id}>
                                    <button
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-full border text-sm flex items-center justify-center",
                                            activeDays.includes(day.id)
                                                ? "bg-green-500 border-green-500 text-white"
                                                : "bg-white border-gray-300 text-gray-700"
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                            <span className="font-bold opacity-75">Repeat For:</span>
                            <Input className="w-14 bg-gray-50 h-8" defaultValue="12" />
                            <span>Weeks</span>
                        </div>
                        <div className="text-sm space-y-1">
                            <p><span className="font-bold opacity-75">First Date:</span> 10th October.</p>
                            <p><span className="font-bold opacity-75">Last Date:</span> 10th October.</p>
                            <p><span className="font-bold opacity-75">No. of Hours:</span> 15</p>
                            <p><span className="font-bold opacity-75">No. of Meetings:</span> 3</p>
                            <p><span className="font-bold opacity-75">No. of Days:</span> 5</p>
                        </div>
                    </div>
                )}
            </div>

            {showWarning && (
                <Alert variant="destructive" className="relative mt-3 mb-1 pr-8">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning!</AlertTitle>
                    <AlertDescription className="text-xs">
                        You are busy on 21.08.2021, 21.08.2021, 21.08.2021 betwen the time entered.
                    </AlertDescription>
                    <button onClick={() => setShowWarning(false)} className="absolute top-2 right-2 p-1">
                        <X className="h-4 w-4" />
                    </button>
                </Alert>
            )}

            <p className="text-sm text-right mb-2">
                <a href="#" className="text-blue-600 font-semibold">Click Here</a> To Skip Those Dates
            </p>

            <div className="text-sm space-y-1 mb-2">
                <p>Book <span className="font-bold">Teacher Name</span></p>
                <p>on the <span className="font-bold">23.10.21 to 30.02.22</span></p>
                <p>between <span className="font-bold">13:00 - 14:00</span></p>
                <p><span className="text-blue-600 font-semibold">30$</span> (10$ * 3 Hr = 30$ total price)</p>
            </div>

            <p className="font-bold mt-4 mb-1 text-sm">Not included</p>
            <p className="text-sm mb-3">3,4,5 July 22<br />3,4,5 July 22</p>

            <div className="flex flex-wrap gap-3 mt-4 text-sm">
                <p className="flex-1">
                    <span className="font-bold opacity-75">Cancellation Fees (30%):</span><br />
                    (Free cancellation before<br />
                    23:59 on Dec. 2021)
                </p>
                <p>20$</p>
            </div>

            <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={onClose} className="border-gray-400 text-gray-600">Cancel</Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white">Continue To Payment</Button>
            </div>
        </div>
    );
}
