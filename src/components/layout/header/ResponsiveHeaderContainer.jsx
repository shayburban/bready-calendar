
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsiveNavigation } from './hooks/useResponsiveNavigation';

export default function ResponsiveHeaderContainer({ 
    allItems = [], 
    headerType = "guest",
    reservedWidth = 730,
    alwaysVisibleItems = ['login']
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [searchMode, setSearchMode] = useState('filter');
    const [windowWidth, setWindowWidth] = useState(1024);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            const handleResize = () => setWindowWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    // ESC key handler
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setIsMobileMenuOpen(false);
                setIsMobileSearchOpen(false);
            }
        };

        if (isMobileMenuOpen || isMobileSearchOpen) {
            document.addEventListener('keydown', handleEscKey);
            return () => document.removeEventListener('keydown', handleEscKey);
        }
    }, [isMobileMenuOpen, isMobileSearchOpen]);

    const {
        visibleItems,
        overflowItems,
        containerRef,
        setItemRef
    } = useResponsiveNavigation({
        items: allItems,
        reservedWidth,
        alwaysVisibleItems
    });

    // Separate items by position
    const leftItems = visibleItems.filter(item => item.position === 'left');
    const rightItems = visibleItems.filter(item => item.position === 'right');
    const searchItem = allItems.find(item => item.type === 'search');

    // Determine viewport size
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    const renderNavigationItem = (item) => {
        const Component = item.Component;
        
        if (item.type === 'nav') {
            return (
                <Link
                    key={item.key}
                    to={createPageUrl(item.href)}
                    ref={(el) => setItemRef(item.key, el)}
                    className="text-gray-700 hover:text-brand-blue px-3 py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap"
                    aria-label={item.text}
                >
                    {item.text}
                </Link>
            );
        }
        
        if (item.type === 'component' && Component) {
            return (
                <div key={item.key} ref={(el) => setItemRef(item.key, el)}>
                    <Component />
                </div>
            );
        }
        
        return null;
    };

    // PC Mode Hamburger (replaces "More" dropdown)
    const renderPCHamburger = () => {
        const hasOverflowItems = overflowItems.length > 0;
        
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="transition-transform duration-150"
                aria-label="Toggle menu"
            >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
        );
    };

    const MobileSearchComponent = () => {
        if (!searchItem) return null;
        
        return (
            <div className={`
                absolute top-full left-0 right-0 bg-white border-t shadow-lg z-50
                transition-all duration-300 ease-in-out
                ${isMobileSearchOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
                ${searchMode === 'ai' ? 'pb-20' : 'pb-4'}
            `}>
                <div className="container mx-auto px-4 py-4">
                    {searchItem.Component && <searchItem.Component />}
                </div>
            </div>
        );
    };

    const renderSlidingMenu = () => {
        const slideDirection = isDesktop ? 'right' : 'left';
        const translateClass = isDesktop 
            ? (isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full')
            : (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full');
        
        const positionClass = isDesktop ? 'right-0' : 'left-0';
        
        // --- UPDATED LOGIC TO PREVENT DUPLICATES ---
        let itemsForMenu;
        if (isDesktop) {
            // On desktop, the menu contains only items that are NOT visible in the header.
            const visibleItemKeys = new Set(visibleItems.map(item => item.key));
            itemsForMenu = allItems.filter(item => !visibleItemKeys.has(item.key));
        } else {
            // On mobile/tablet, the menu contains all items as they are not in the main bar.
            itemsForMenu = allItems;
        }

        const menuNavItems = itemsForMenu.filter(item => item.position === 'left' && item.type === 'nav');
        const menuActionItems = itemsForMenu.filter(item => item.position === 'right' && item.type === 'component');
        const menuSearchItem = itemsForMenu.find(item => item.type === 'search');
        // --- END UPDATED LOGIC ---

        return (
            <>
                {/* Backdrop */}
                <div 
                    className={`
                        fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-40
                        ${isMobileMenuOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
                
                {/* Menu Panel */}
                <div className={`
                    fixed top-0 ${positionClass} h-full bg-white shadow-xl z-50
                    transform transition-transform duration-300 ease-in-out
                    ${translateClass}
                    ${isDesktop ? 'w-96' : 'w-80 max-w-[85vw]'}
                `}>
                    <div className="p-6 h-full overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        {/* Search Bar in Menu (if it's meant to be in the menu) */}
                        {menuSearchItem && (
                            <div className="mb-6 pb-4 border-b">
                                <div className="w-full">
                                    {menuSearchItem.Component && <menuSearchItem.Component />}
                                </div>
                            </div>
                        )}
                        
                        {/* Navigation Items */}
                        {menuNavItems.length > 0 && (
                            <nav className="space-y-2 mb-6">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                    Navigation
                                </h3>
                                {menuNavItems.map(item => (
                                    <Link
                                        key={item.key}
                                        to={createPageUrl(item.href)}
                                        className="block px-4 py-3 text-gray-700 hover:text-brand-blue hover:bg-gray-50 rounded-lg transition-colors duration-150 font-medium"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {item.text}
                                    </Link>
                                ))}
                            </nav>
                        )}
                        
                        {/* Action Items */}
                        {menuActionItems.length > 0 && (
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                    Account
                                </h3>
                                {menuActionItems.map(item => (
                                    <div key={item.key} className="px-4">
                                        {item.Component && <item.Component />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    };

    return (
        <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
            <div className="container mx-auto px-4" ref={containerRef}>
                <div className="flex items-center justify-between h-20">
                    {/* Mobile Layout */}
                    {isMobile && (
                        <>
                            {/* Left: Hamburger Menu */}
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="transition-transform duration-150"
                                    aria-label="Toggle mobile menu"
                                >
                                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                </Button>
                            </div>

                            {/* Center: Logo */}
                            <div className="absolute left-1/2 transform -translate-x-1/2">
                                <Link to={createPageUrl('Home')} className="flex items-center">
                                    <span className="text-xl font-bold text-gray-800">TutorVerse</span>
                                </Link>
                            </div>

                            {/* Right: Search Icon */}
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                                    className="transition-transform duration-150"
                                    aria-label="Toggle search"
                                >
                                    {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Tablet Layout */}
                    {isTablet && (
                        <>
                            {/* Left: Hamburger Menu */}
                            <div className="flex items-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="transition-transform duration-150 mr-4"
                                    aria-label="Toggle menu"
                                >
                                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                </Button>
                                
                                <Link to={createPageUrl('Home')} className="flex items-center">
                                    <span className="text-2xl font-bold text-gray-800">TutorVerse</span>
                                </Link>
                            </div>

                            {/* Center: Search Bar */}
                            <div className="flex-1 max-w-md mx-8">
                                {searchItem && searchItem.Component && <searchItem.Component />}
                            </div>

                            {/* Right: Empty space for balance */}
                            <div className="w-10"></div>
                        </>
                    )}

                    {/* Desktop Navigation */}
                    {isDesktop && (
                        <>
                            <div className="flex items-center">
                                <Link to={createPageUrl('Home')} className="flex items-center">
                                    <span className="text-2xl font-bold text-gray-800">TutorVerse</span>
                                </Link>
                            </div>

                            <div className="flex items-center flex-1 justify-between ml-8">
                                <nav className="flex items-center space-x-1">
                                    {leftItems.map(renderNavigationItem)}
                                </nav>

                                {searchItem && (
                                    <div className={`flex-1 mx-8 transition-all duration-300 ${
                                        windowWidth < 900 ? 'max-w-[150px]' : 'max-w-md'
                                    }`}>
                                        {searchItem.Component && <searchItem.Component />}
                                    </div>
                                )}

                                <div className="flex items-center space-x-3">
                                    {rightItems.map(renderNavigationItem)}
                                    {/* PC Hamburger replaces "More" dropdown */}
                                    {(overflowItems.length > 0 || allItems.length > visibleItems.length) && renderPCHamburger()}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Mobile Search Overlay */}
                {isMobile && <MobileSearchComponent />}

                {/* Sliding Menu for all modes */}
                {isMobileMenuOpen && renderSlidingMenu()}
            </div>
        </header>
    );
}
