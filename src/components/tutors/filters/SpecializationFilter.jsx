import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

export default function SpecializationFilter() {
    const [searchTerm, setSearchTerm] = useState('');
    
    const specializations = [
        "Bio Chemistry",
        "Organic Chemistry", 
        "Physical Chemistry",
        "Analytical Chemistry",
        "Inorganic Chemistry",
        "Environmental Chemistry",
        "Medicinal Chemistry",
        "Polymer Chemistry"
    ];

    const filteredSpecs = specializations.filter(spec => 
        spec.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="relative">
                <Input 
                    type="search" 
                    placeholder="Search specializations..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredSpecs.map((spec, index) => (
                    <div key={spec} className="flex items-center space-x-2">
                        <Checkbox id={`spec-${index}`} defaultChecked={index < 2} />
                        <label
                          htmlFor={`spec-${index}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {spec}
                        </label>
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