import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Search } from 'lucide-react';
import HeaderLogo from './HeaderLogo';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LanguageCurrencyDropdown from './LanguageCurrencyDropdown';

const TabletHeader = ({ onMenuClick, onSearchClick }) => {
    return (
        <div className="container mx-auto px-4 h-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open menu">
                    <Menu className="h-6 w-6" />
                </Button>
                <HeaderLogo />
            </div>
            
            <div className="flex items-center gap-2">
                <LanguageCurrencyDropdown />
                <Button variant="ghost" size="icon" onClick={onSearchClick} aria-label="Open search">
                    <Search className="h-6 w-6" />
                </Button>
            </div>
        </div>
    );
};

export default TabletHeader;