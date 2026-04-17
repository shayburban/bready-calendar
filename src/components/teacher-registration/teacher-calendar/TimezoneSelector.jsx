import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe, Pencil } from 'lucide-react';

const TimezoneSelector = () => {
  const [currentTimezone, setCurrentTimezone] = useState({
    time: '11:57',
    zone: 'CET',
    location: 'Europe, Madrid'
  });
  const [searchCity, setSearchCity] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cities = [
    { name: 'New York', time: '5:57', timezone: 'EST' },
    { name: 'London', time: '10:57', timezone: 'GMT' },
    { name: 'Tokyo', time: '19:57', timezone: 'JST' },
    { name: 'Sydney', time: '21:57', timezone: 'AEDT' },
    { name: 'Los Angeles', time: '2:57', timezone: 'PST' }
  ];

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchCity.toLowerCase())
  );

  const handleTimezoneSelect = (city) => {
    setCurrentTimezone({
      time: city.time,
      zone: city.timezone,
      location: city.name
    });
    setIsModalOpen(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Set Your Timezone</h4>
          <p className="text-gray-600 mb-4">Is this your current timezone?</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center text-gray-900 font-medium">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              <span>{currentTimezone.time} ({currentTimezone.zone}) - {currentTimezone.location}</span>
            </div>
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  Change
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Your Timezone</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    A correct timezone is essential to coordinate lessons with international students
                  </p>
                  
                  <div className="border rounded-lg">
                    <div className="border-b p-3">
                      <h4 className="font-medium">Choose Your Timezone</h4>
                    </div>
                    
                    <div className="p-3 space-y-3">
                      <Input
                        placeholder="Search City"
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="w-full"
                      />
                      
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredCities.map((city, index) => (
                          <button
                            key={index}
                            onClick={() => handleTimezoneSelect(city)}
                            className="w-full flex justify-between items-center p-2 hover:bg-gray-50 rounded text-left"
                          >
                            <span>{city.name}</span>
                            <span className="text-gray-500">{city.time}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimezoneSelector;