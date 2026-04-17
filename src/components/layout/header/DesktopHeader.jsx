import React, { useRef, useEffect, useState } from 'react';
import { useResponsiveNavigation } from './hooks/useResponsiveNavigation';
import HeaderLogo from './HeaderLogo';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import SearchInput from './SearchInput';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DesktopHeader = ({ allItems, onMenuClick, isMenuOpen }) => {
    const logoRef = useRef(null);
    const menuButtonRef = useRef(null);
    const [staticWidth, setStaticWidth] = useState(0);

    useEffect(() => {
        const logoWidth = logoRef.current ? logoRef.current.offsetWidth : 120; // default width
        const menuButtonWidth = menuButtonRef.current ? menuButtonRef.current.offsetWidth : 50;
        setStaticWidth(logoWidth + menuButtonWidth + 40); // 40px for padding/margins
    }, []);

    const { visibleItems, overflowItems, containerRef, setItemRef } = useResponsiveNavigation({
        items: allItems.filter(item => item.type !== 'search'),
        reservedWidth: staticWidth,
    });
    
    const navItems = visibleItems.filter(item => item.position === 'left');
    const actionItems = visibleItems.filter(item => item.position === 'right');
    const searchItem = allItems.find(item => item.type === 'search');

    return (
        <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4" ref={containerRef}>
            <div ref={logoRef}>
                 <HeaderLogo />
            </div>

            <nav className="flex items-center gap-1">
                {navItems.map(item => (
                     <Link key={item.key} to={createPageUrl(item.href)} ref={el => setItemRef(item.key, el)} className="text-gray-700 hover:text-brand-blue px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap">
                        {item.text}
                     </Link>
                ))}
            </nav>

            <div className="flex-1 flex justify-center px-4">
                 {searchItem && <SearchInput />}
            </div>

            <nav className="flex items-center gap-2">
                 {actionItems.map(item => (
                    <div key={item.key} ref={el => setItemRef(item.key, el)}>
                        <item.Component />
                    </div>
                ))}
            </nav>
            
            <div ref={menuButtonRef}>
                {overflowItems.length > 0 && (
                     <Button variant="ghost" size="icon" onClick={onMenuClick} aria-label="Toggle menu">
                         {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                     </Button>
                )}
            </div>
        </div>
    );
};

export default DesktopHeader;