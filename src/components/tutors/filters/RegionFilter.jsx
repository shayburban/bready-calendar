import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

export default function RegionFilter() {
    const [searchTerm, setSearchTerm] = useState('');
    
    const regions = [
        { name: "North America", count: 234, flag: "🇺🇸" },
        { name: "Europe", count: 189, flag: "🇪🇺" },
        { name: "Asia", count: 156, flag: "🌏" },
        { name: "South America", count: 78, flag: "🇧🇷" },
        { name: "Africa", count: 45, flag: "🌍" },
        { name: "Oceania", count: 23, flag: "🇦🇺" }
    ];

    const filteredRegions = regions.filter(region => 
        region.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Input 
                    type="search" 
                    placeholder="Search regions..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
                {filteredRegions.map((region, index) => (
                    <div key={region.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Checkbox id={`region-${index}`} />
                            <span className="text-lg">{region.flag}</span>
                            <label
                              htmlFor={`region-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {region.name}
                            </label>
                        </div>
                        <span className="text-xs text-gray-500">({region.count})</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center pt-2">
                <Button variant="link" className="p-0 h-auto text-blue-600 text-sm">View More</Button>
                <Button variant="ghost" size="sm" className="text-gray-500">Reset</Button>
            </div>
        </div>
    );
}