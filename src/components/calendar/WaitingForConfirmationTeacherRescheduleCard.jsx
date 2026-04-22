
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreVertical, Pencil, Trash2, Mail, Bell, CreditCard, ChevronDown, Plus, RefreshCw, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import TabSelector from '../common/TabSelector';

const NotificationRow = ({ value = "30", onRemove }) =>
    <div className="flex items-center space-x-2">
        <Input type="text" defaultValue={value} className="bg-gray-50 px-3 py-2 text-sm flex rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-16 h-8" />
        <Select defaultValue="minutes">
            <SelectTrigger className="bg-gray-50 px-3 py-2 text-sm flex items-center justify-between rounded-md border border-input ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-28 h-8">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
            </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <RefreshCw className="w-4 h-4" />
        </Button>
        {onRemove &&
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8">
                <X className="w-4 h-4" />
            </Button>
        }
    </div>;

export default function WaitingForConfirmationTeacherRescheduleCard({ event, onClose }) {
    const [notifications, setNotifications] = useState([1]);
    const [emailNotifications, setEmailNotifications] = useState([1]);
    const [date, setDate] = useState(new Date(2021, 6, 19));
    const [activeTimeSlot, setActiveTimeSlot] = useState('15:00 - 16:00');

    const addNotification = (setter, state) => setter([...state, Date.now()]);
    const removeNotification = (setter, state, id) => setter(state.filter((item) => item !== id));

    const timeSlots = [
        { value: '15:00 - 16:00', label: '15:00 - 16:00' },
        { value: '17:00 - 19:00', label: '17:00 - 19:00' },
        { value: '20:00 - 22:00', label: '20:00 - 22:00' },
        { value: '17:00 - 19:00 b', label: '17:00 - 19:00' },
        { value: '20:00 - 22:00 b', label: '20:00 - 22:00' },
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-sm mx-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-center font-bold text-lg mb-1">Waiting For Confirmation (T)</h3>

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
                    variant="orange"
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
                            <li><Button variant="ghost" className="w-full justify-start">Change Timing</Button></li>
                            <li><Button variant="ghost" className="w-full justify-start">Check Teacher Availability</Button></li>
                            <li><Button variant="ghost" className="w-full justify-start">View As A Student (S)</Button></li>
                        </ul>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="text-sm space-y-1 mb-4">
                <p className="font-bold">Existing Booking</p>
                <p className="underline">Student N.</p>
                <p>15:00 - 16:00 &nbsp; 19.07.2021</p>
                <p><span className="text-blue-600 font-semibold">30$</span> (10$ * 3 Hr = 30$ total price)</p>
            </div>

            <div className="text-sm space-y-1 mb-4">
                <p className="font-bold">Proposed Booking</p>
                <p className="underline">Student N.</p>
                <p>15:00 - 16:00 &nbsp; 19.07.2021</p>
                <p><span className="text-blue-600 font-semibold">30$</span> (10$ * 3 Hr = 30$ total price)</p>
            </div>

            <div className="mb-4">
                <label className="font-bold text-sm">Meeting subject reminder</label>
                <Input placeholder="Write a reminder" className="bg-gray-50 mt-1 px-3 py-2 text-base flex h-10 w-full rounded-md border border-input ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
            </div>

            <div className="text-sm space-y-1 mb-4">
                <p className="flex items-center text-green-600"><CreditCard className="w-4 h-4 mr-2 text-green-400" /> Money deposited</p>
                <p className="flex items-center text-red-600"><CreditCard className="w-4 h-4 mr-2 text-red-400" /> Money not deposited</p>
            </div>

            <div className="text-xs space-y-1 mb-4 opacity-75">
                <p><span className="font-bold">Online Classes:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold">Consulting:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold">Technical Interview:</span> 10 $ for 1 Hr.</p>
                <p><span className="font-bold">Packages:</span> 4 $ for 1 Hr. till 03.08.2021 4 Hrs. left on this package</p>
            </div>

            <details className="text-sm" open>
                <summary className="font-semibold cursor-pointer flex items-center">
                    <ChevronDown className="w-4 h-4 mr-1 transition-transform" />
                    Your Notification
                </summary>
                <div className="pt-2 pl-4 space-y-4">
                    <div>
                        <div className="flex items-center mb-2">
                            <Bell className="w-4 h-4 mr-2" />
                            <span className="font-medium">Notification</span>
                            <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                {notifications.length}
                            </span>
                        </div>
                        <div className="space-y-2 pl-2">
                            {notifications.map((id) =>
                                <NotificationRow key={id} onRemove={notifications.length > 1 ? () => removeNotification(setNotifications, notifications, id) : null} />
                            )}
                            <Button variant="ghost" size="sm" onClick={() => addNotification(setNotifications, notifications)}>
                                <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center mb-2">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="font-medium">Email Notification</span>
                            <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                {emailNotifications.length}
                            </span>
                        </div>
                        <div className="space-y-2 pl-2">
                            {emailNotifications.map((id) =>
                                <NotificationRow key={id} onRemove={emailNotifications.length > 1 ? () => removeNotification(setEmailNotifications, emailNotifications, id) : null} />
                            )}
                            <Button variant="ghost" size="sm" onClick={() => addNotification(setEmailNotifications, emailNotifications)}>
                                <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                        </div>
                    </div>
                </div>
            </details>

            <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={onClose} className="border-red-500 text-red-600 hover:bg-red-50">Decline</Button>
                <Button className="bg-green-500 hover:bg-green-600 text-white">Confirm Reschedule</Button>
            </div>
        </div>
    );
}
