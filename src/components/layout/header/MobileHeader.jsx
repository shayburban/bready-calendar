import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Search } from 'lucide-react';
import HeaderLogo from './HeaderLogo';

const MobileHeader = ({ onMenuClick, onSearchClick }) => {
    return (
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open menu">
                <Menu className="h-6 w-6" />
            </Button>
            <div className="absolute left-1/2 -translate-x-1/2">
                <HeaderLogo />
            </div>
            <Button variant="ghost" size="icon" onClick={onSearchClick} aria-label="Open search">
                <Search className="h-6 w-6" />
            </Button>
        </div>
    );
};

export default MobileHeader;