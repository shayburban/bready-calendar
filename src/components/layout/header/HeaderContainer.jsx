
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X } from 'lucide-react';
import useWindowWidth from './hooks/useWindowWidth';

// Define HeaderSearch component as it's used in the outline but not provided in the original file.
// This component handles the search input and its state interaction.
const HeaderSearch = ({ value, onChange, isMobile }) => {
    return (
        <input
            type="text"
            placeholder={isMobile ? "Search (Mobile)" : "Search..."}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Search"
        />
    );
};

export default function HeaderContainer({ allItems, user, headerType }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const windowWidth = useWindowWidth();
    // Lift header search term state to HeaderContainer to persist across breakpoints
    const [headerSearchTerm, setHeaderSearchTerm] = useState(''); 
    
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    // Separate items by position
    const leftItems = allItems?.filter(item => item.position === 'left') || [];
    const rightItems = allItems?.filter(item => item.position === 'right') || [];
    // The searchItem variable is no longer needed as HeaderSearch is directly rendered
    // const searchItem = allItems?.find(item => item.type === 'search'); 

    const renderItem = (item) => {
        if (item.type === 'nav' && item.href && item.text) {
            return (
                <Link 
                    key={item.key}
                    to={createPageUrl(item.href)} 
                    className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)} // Close mobile menu on nav click
                >
                    {item.text}
                </Link>
            );
        }
        
        // This part remains to handle other generic components passed via allItems
        if (item.type === 'component' && item.Component) {
            const Component = item.Component;
            return <Component key={item.key} />;
        }
        
        return null;
    };

    return (
        <div className="container mx-auto px-4">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between h-20">
                {/* Logo */}
                <div className="flex items-center">
                    <Link to={createPageUrl('Home')} className="flex items-center">
                        <span className="text-2xl font-bold text-blue-600">Bready</span>
                    </Link>
                </div>

                {/* Left Navigation */}
                <div className="flex items-center space-x-6">
                    {leftItems.map(renderItem)}
                </div>

                {/* Search (Center) - Now uses HeaderSearch component */}
                <div className="flex-grow max-w-md mx-8">
                    {/* Desktop/Tablet Search */}
                    <HeaderSearch
                        value={headerSearchTerm}
                        onChange={setHeaderSearchTerm}
                    />
                </div>

                {/* Right Actions */}
                <div className="flex items-center space-x-4">
                    {rightItems.map(renderItem)}
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between h-16">
                <Link to={createPageUrl('Home')} className="flex items-center">
                    <span className="text-xl font-bold text-blue-600">Bready</span>
                </Link>
                
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:text-blue-600"
                    aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t py-4 shadow-md">
                    <div className="space-y-4">
                        {/* Mobile Search - Now uses HeaderSearch component */}
                        <div className="px-4">
                            <HeaderSearch
                                isMobile
                                value={headerSearchTerm}
                                onChange={setHeaderSearchTerm}
                            />
                        </div>
                        <div className="space-y-2 px-4">
                            {/* Combine left and right items for mobile navigation */}
                            {leftItems.concat(rightItems).map((item) => (
                                <div key={item.key} className="py-2">
                                    {renderItem(item)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
