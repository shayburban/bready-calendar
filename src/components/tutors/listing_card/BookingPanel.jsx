import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Clock, Calendar as CalendarIcon, Globe, X } from 'lucide-react';

const VideoPlayerWithThumbnail = ({ videoUrl, thumbnailUrl }) => {
  const [showVideo, setShowVideo] = useState(false);

  if (showVideo) {
    return (
      <div className="relative">
        <iframe
          width="100%"
          height="200"
          src={videoUrl}
          title="Teacher Introduction Video"
          frameBorder="0"
          allowFullScreen
          className="rounded-lg"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowVideo(false)}
          className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative cursor-pointer" onClick={() => setShowVideo(true)}>
      <img 
        src={thumbnailUrl} 
        alt="Video thumbnail" 
        className="w-full h-48 object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-8 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
        </div>
      </div>
    </div>
  );
};

const TimeSlotGrid = () => {
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {timeSlots.map(time => (
        <Button key={time} variant="outline" size="sm" className="text-xs">
          {time}
        </Button>
      ))}
    </div>
  );
};

export default function BookingPanel({ teacher, isOpen, onClose }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState('trial');

  if (!isOpen) return null;

  return (
    <div className="mt-4 border-t pt-4">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Video and Service Selection */}
            <div className="space-y-4">
              <VideoPlayerWithThumbnail 
                videoUrl={teacher.videoUrl}
                thumbnailUrl={teacher.videoThumbnail}
              />
              
              <div>
                <h4 className="font-semibold mb-2">Select Service</h4>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial Lesson - ${teacher.hourlyRate.trial}/hr</SelectItem>
                    <SelectItem value="consulting">Consulting - ${teacher.hourlyRate.consulting}/hr</SelectItem>
                    <SelectItem value="interview">Interview Prep - ${teacher.hourlyRate.interview}/hr</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>Timezone: EST (UTC-5)</span>
              </div>
            </div>

            {/* Right Column - Calendar and Time Slots */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Select Date
                </h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Available Times
                </h4>
                <TimeSlotGrid />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-semibold">Total: ${teacher.hourlyRate[selectedService]}/hour</p>
                {teacher.offer && (
                  <Badge variant="secondary" className="mt-1">{teacher.offer}</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Continue to Payment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}