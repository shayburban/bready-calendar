import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import SearchInput from './SearchInput'; // Assuming this is the desired search component

const SlidingMenu = ({ isOpen, onClose, items, menuSide = 'right' }) => {
    const translateClass = menuSide === 'right' 
        ? (isOpen ? 'translate-x-0' : 'translate-x-full')
        : (isOpen ? 'translate-x-0' : '-translate-x-full');
    
    const positionClass = menuSide === 'right' ? 'right-0' : 'left-0';

    const menuNavItems = items.filter(item => item.type === 'nav');
    const menuActionItems = items.filter(item => item.type === 'component');
    const menuSearchItem = items.find(item => item.type === 'search');

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-40 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            
            {/* Menu Panel */}
            <div className={`fixed top-0 ${positionClass} h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${translateClass} w-80 max-w-[85vw]`}>
                <div className="p-6 h-full overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Search */}
                    {menuSearchItem && (
                        <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Search</p>
                            <SearchInput />
                        </div>
                    )}
                    
                    {/* Navigation */}
                    {menuNavItems.length > 0 && (
                        <nav className="flex flex-col space-y-2 mb-6">
                            {menuNavItems.map(item => (
                                <Link key={item.key} to={createPageUrl(item.href)} className="text-gray-800 hover:text-brand-blue p-2 rounded-md transition-colors text-base" onClick={onClose}>
                                    {item.text}
                                </Link>
                            ))}
                        </nav>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col space-y-3 pt-6 border-t">
                        {menuActionItems.map(item => (
                            <div 
                                key={item.key} 
                                // --- UPDATED LOGIC ---
                                // Stop the menu from closing only for the language dropdown
                                onClick={item.key !== 'lang' ? onClose : undefined}
                            >
                                <item.Component />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SlidingMenu;