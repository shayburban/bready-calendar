import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Mail, User, Play } from 'lucide-react';

const PriceListItem = ({ label, price, originalPrice = null }) => (
    <div className="flex justify-between items-center text-sm py-1">
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
            {originalPrice && <span className="text-gray-400 line-through">${originalPrice}</span>}
            <span className="font-bold text-gray-800">${price}</span>
        </div>
    </div>
);

export default function PricingAndActions({ hourlyRate, offer, onBook }) {
    return (
        <div className="h-full flex flex-col justify-between border rounded-md p-3 bg-gray-50/50">
            <div>
                <PriceListItem label="Online Class" price={hourlyRate.online} />
                <PriceListItem label="Consulting" price={hourlyRate.consulting} originalPrice={hourlyRate.originalConsulting}/>
                <PriceListItem label="Tech Interview" price={hourlyRate.interview} />
                <hr className="my-2"/>
                <PriceListItem label="Trial (30 min)" price={hourlyRate.trial} />
            </div>

            <div className="space-y-2 mt-4">
                <div className="flex justify-center">
                    {offer && <Badge className="bg-green-100 text-green-800">{offer}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full"><Bookmark className="w-4 h-4 mr-1"/> Save</Button>
                    <Button variant="outline" size="sm" className="w-full"><Mail className="w-4 h-4 mr-1"/> Message</Button>
                    <Button variant="outline" size="sm" className="w-full"><User className="w-4 h-4 mr-1"/> Profile</Button>
                    <Button onClick={onBook} className="w-full" size="sm"><Play className="w-4 h-4 mr-1"/> Book Trial</Button>
                </div>
            </div>
        </div>
    );
}