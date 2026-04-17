import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination() {
    return (
        <div className="flex justify-center items-center flex-wrap gap-2" style={{ margin: '48px 0' }}>
            <Button variant="outline" size="icon" disabled>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Input type="text" className="w-12 text-center" defaultValue="1" />
            <Button variant="ghost" size="sm">2</Button>
            <Button variant="ghost" size="sm">3</Button>
            <Button variant="ghost" size="sm">4</Button>
            <Button variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">Of 20</span>
        </div>
    );
}