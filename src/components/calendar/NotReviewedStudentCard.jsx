
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreVertical, Pencil, Trash2, Mail, ChevronDown } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import TabSelector from '../common/TabSelector';

export default function NotReviewedStudentCard({ event, onClose }) {
    const [date, setDate] = useState(new Date(2021, 6, 19));
    const [activeTimeSlot, setActiveTimeSlot] = useState('15:00 - 16:00');

    const timeSlots = [
        { value: '15:00 - 16:00', label: '15:00 - 16:00' },
        { value: '17:00 - 19:00', label: '17:00 - 19:00' },
        { value: '20:00 - 22:00', label: '20:00 - 22:00' },
        { value: '17:00 - 19:00 b', label: '17:00 - 19:00' },
        { value: '20:00 - 22:00 b', label: '20:00 - 22:00' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center font-bold text-lg mb-2">Not Reviewed (S)</h3>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-center flex items-center gap-2 mb-2">
                        <span>{date.toLocaleDateString('de-DE')}</span>
                        <ChevronDown className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus />
                </PopoverContent>
            </Popover>

            <div className="flex justify-center items-center gap-2 mb-3">
                <TabSelector
                    tabs={timeSlots}
                    activeTab={activeTimeSlot}
                    onTabChange={setActiveTimeSlot}
                    maxVisibleTabs={2}
                    moreLabel={`+${timeSlots.length - 2} More`}
                    variant="red"
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
                            <li><Button variant="ghost" className="w-full justify-start">Meeting didn’t happen</Button></li>
                            <li><Button variant="ghost" className="w-full justify-start">Check Teacher Availability</Button></li>
                        </ul>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="text-sm space-y-1 mb-4">
                <p className="text-gray-900 font-bold underline">Teacher N.</p>
                <p>15:00 - 16:00 19.07.2021</p>
                <p><span className="text-blue-600 font-semibold">30$</span> (10$ * 3 Hr = 30$ total price)</p>
            </div>

            <div className="mb-4">
                <label className="font-bold text-sm">Meeting subject reminder</label>
                <Input placeholder="Write a reminder" className="bg-gray-50 mt-1 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
            </div>

            <div className="text-sm space-y-1 mb-2">
                <p><span className="font-bold opacity-75">Online Classes:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Consulting:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Technical Interview:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold opacity-75">Packages:</span> 4 $ for 1 Hr. till 03.08.2021 4 Hrs. left on this package</p>
            </div>

            <p className="text-sm mb-4">Review this teacher for the first time</p>

            <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="border-gray-400 text-gray-600">Cancel</Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white">Review Teacher</Button>
            </div>
        </div>
    );
}
