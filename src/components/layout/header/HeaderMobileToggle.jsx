import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function HeaderMobileToggle({ isOpen, onToggle, className = "" }) {
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={onToggle}
            className={`flex-shrink-0 ${className}`}
        >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
    );
}