import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Clock, DollarSign, Search } from 'lucide-react';

export default function BookingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate 
}) {
  const [bookingType, setBookingType] = useState('known-student');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [service, setService] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const services = [
    { value: 'online-class', label: 'Online Class', price: 10 },
    { value: 'consulting', label: 'Consulting', price: 15 },
    { value: 'technical-interview', label: 'Technical Interview', price: 20 }
  ];

  const selectedService = services.find(s => s.value === service);

  const handleSave = () => {
    // Save booking logic here
    console.log({
      selectedDate,
      bookingType,
      studentName,
      studentEmail,
      service,
      startTime,
      endTime
    });
    onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>New Booking</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Type Tabs */}
          <Tabs value={bookingType} onValueChange={setBookingType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="known-student">Known Student</TabsTrigger>
              <TabsTrigger value="new-student">New Student</TabsTrigger>
              <TabsTrigger value="other-teacher">Other Teacher</TabsTrigger>
            </TabsList>

            <TabsContent value="known-student" className="space-y-4">
              <div>
                <Label className="flex items-center space-x-1">
                  <Search className="w-4 h-4" />
                  <span>Search Student by Name</span>
                </Label>
                <Input
                  placeholder="Enter student name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {/* Mock search result */}
              {studentName && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      P
                    </div>
                    <div>
                      <p className="font-medium">Prateek K - 9902</p>
                      <p className="text-sm text-gray-600">Engineering Entrance Coaching</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="new-student" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student Name</Label>
                  <Input
                    placeholder="Enter student name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Student Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter student email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                Save To Contact List
              </Button>
            </TabsContent>

            <TabsContent value="other-teacher" className="space-y-4">
              <div>
                <Label>Search Teacher by Name</Label>
                <Input
                  placeholder="Search for existing teacher"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Enter Teacher Profile Link</Label>
                <Input
                  placeholder="Paste url here"
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Service Selection */}
          <div>
            <Label>Choose a Service</Label>
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label} - ${service.price}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Start Time</span>
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>End Time</span>
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Pricing Info */}
          {selectedService && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">Pricing Information</span>
              </div>
              <p className="text-sm">
                <span className="font-medium">Price per Hour:</span> ${selectedService.price}
              </p>
              <p className="text-sm">
                <span className="font-medium">Service:</span> {selectedService.label}
              </p>
            </div>
          )}

          {/* Warning Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              <strong>Warning!</strong> Please ensure the selected time slot is available.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
              disabled={!studentName || !service || !startTime || !endTime}
            >
              Create Booking
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}