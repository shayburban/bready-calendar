import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function ServicesFilter() {
    const services = [
        { name: "Online Classes", icon: "🎓", count: 234 },
        { name: "Consulting", icon: "💼", count: 156 },
        { name: "Technical Interview", icon: "👔", count: 89 },
        { name: "Homework Help", icon: "📝", count: 201 },
        { name: "Test Preparation", icon: "📊", count: 167 },
        { name: "Project Guidance", icon: "🚀", count: 145 }
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {services.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Checkbox id={`service-${index}`} />
                            <span className="text-lg">{service.icon}</span>
                            <label
                              htmlFor={`service-${index}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {service.name}
                            </label>
                        </div>
                        <span className="text-xs text-gray-500">({service.count})</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center pt-2">
                <Button variant="ghost" size="sm" className="text-gray-500">Reset</Button>
            </div>
        </div>
    );
}