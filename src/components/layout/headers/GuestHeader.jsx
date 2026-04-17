
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SearchInput from '../header/SearchInput';
import LanguageCurrencyDropdown from '../header/LanguageCurrencyDropdown';
import { Button } from '@/components/ui/button';
import useWindowWidth from '../header/hooks/useWindowWidth';
import DesktopHeader from '../header/DesktopHeader';
import TabletHeader from '../header/TabletHeader';
import MobileHeader from '../header/MobileHeader';
import SlidingMenu from '../header/SlidingMenu';
import EnhancedSearchPanel from '../../ai/EnhancedSearchPanel';
import { useToast } from "@/components/ui/use-toast";

export default function GuestHeader({ isViewAsMode = false }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const windowWidth = useWindowWidth();
    const { toast } = useToast();

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    const guestItems = [
        // Center Search Item
        { key: 'search', type: 'search', Component: SearchInput, priority: 3, position: 'center' },
        
        // Left-aligned navigation
        { key: 'become_teacher', type: 'nav', href: 'TeacherRegistration', text: 'Become A Teacher', priority: 1, position: 'left' },
        { key: 'find_teachers', type: 'nav', href: 'FindTutors', text: 'Find Teachers', priority: 2, position: 'left' },

        // Right-aligned actions (in new order with updated priorities)
        { 
            key: 'lang', 
            type: 'component', 
            Component: LanguageCurrencyDropdown, 
            priority: 8, 
            position: 'right' 
        },
        { 
            key: 'signup', 
            type: 'component', 
            Component: () => <Button className="btn-pill-outline-green">Sign Up</Button>, 
            priority: 7, 
            position: 'right' 
        },
        { 
            key: 'login', 
            type: 'component', 
            Component: () => <Button className="btn-signup">Login</Button>, 
            priority: 6, 
            position: 'right' 
        },
        { 
            key: 'post_requirement', 
            type: 'component', 
            Component: () => (
                <Link to={createPageUrl('PostRequirement')}>
                    <Button className="btn-pill-green whitespace-nowrap">Post Requirement</Button>
                </Link>
            ), 
            priority: 5, // Highest priority, collapses last
            position: 'right' 
        },
    ];
    
    // On Desktop, all items that overflow are sent to the menu
    // On Tablet/Mobile, we select specific items to show in the menu
    const itemsForMenu = isDesktop ? guestItems : guestItems.filter(item => item.key !== 'search');

    const handleSearch = (searchParams) => {
        toast({
            title: `Searching for: ${searchParams.query}`,
            description: `Mode: ${searchParams.type}`,
        });
        setIsSearchOpen(false);
        // Add navigation/search logic here
    };

    return (
        <>
            <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
                {/* View As Mode Banner */}
                {isViewAsMode && (
                    <div className="bg-orange-500 text-white text-center py-2 text-sm">
                        <span className="font-medium">Admin View Mode Active</span> - Viewing as Guest
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="ml-4 text-white hover:bg-orange-600"
                            onClick={() => {
                                localStorage.removeItem('adminViewAsMode');
                                window.location.href = '/AdminDashboard';
                            }}
                        >
                            Exit View Mode
                        </Button>
                    </div>
                )}
                <div className="h-20 flex items-center justify-between"> {/* This div ensures the height and proper alignment of the main header content */}
                    {isDesktop && <DesktopHeader allItems={guestItems} isMenuOpen={isMenuOpen} onMenuClick={() => setIsMenuOpen(!isMenuOpen)} />}
                    {isTablet && <TabletHeader onMenuClick={() => setIsMenuOpen(!isMenuOpen)} onSearchClick={() => setIsSearchOpen(true)} />}
                    {isMobile && <MobileHeader onMenuClick={() => setIsMenuOpen(!isMenuOpen)} onSearchClick={() => setIsSearchOpen(true)} />}
                </div>
            </header>

            <SlidingMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                items={itemsForMenu}
                menuSide={isDesktop ? 'right' : 'left'}
            />

            <EnhancedSearchPanel 
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSearch={handleSearch}
            />
        </>
    );
}
