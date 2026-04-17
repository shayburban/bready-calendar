import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Dedicated hamburger menu order configuration
const HAMBURGER_MENU_ORDER = [
    { key: 'post', order: 1 },
    { key: 'find', order: 2 },
    { key: 'become', order: 3 },
    { key: 'signup', order: 4 },
    { key: 'login', order: 5 },
    { key: 'lang', order: 6 }, // Extra spacing after this
];

const GuestHeaderHamburgerMenu = ({ overflowItems, isOpen, onClose }) => {
    const renderHamburgerItem = (item) => {
        if (item.type === 'nav') {
            return (
                <Link 
                    key={item.key} 
                    to={createPageUrl(item.href)} 
                    className="block text-gray-700 hover:text-blue-600 py-3 px-4 text-base font-medium transition-colors"
                    onClick={onClose}
                >
                    {item.text}
                </Link>
            );
        }
        if (item.type === 'component') {
            return (
                <div 
                    key={item.key} 
                    className={`py-3 px-4 ${item.key === 'lang' ? 'border-b border-gray-100 mb-2 pb-4' : ''}`}
                >
                    {React.createElement(item.Component)}
                </div>
            );
        }
        return null;
    };

    // Sort items according to hamburger menu order
    const sortedOverflowItems = overflowItems.sort((a, b) => {
        const orderA = HAMBURGER_MENU_ORDER.find(o => o.key === a.key)?.order || 999;
        const orderB = HAMBURGER_MENU_ORDER.find(o => o.key === b.key)?.order || 999;
        return orderA - orderB;
    });

    if (!isOpen || overflowItems.length === 0) {
        return null;
    }

    return (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-lg shadow-lg z-20">
            <div className="py-2">
                {sortedOverflowItems.map(renderHamburgerItem)}
            </div>
        </div>
    );
};

export default GuestHeaderHamburgerMenu;