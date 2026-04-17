import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HeaderNavigation({ links = [], className = "" }) {
    return (
        <nav className={`flex items-center space-x-5 ${className}`}>
            {links.map(link => (
                <Link 
                    key={link.href} 
                    to={createPageUrl(link.href)} 
                    className="text-gray-600 hover:text-brand-blue transition-colors whitespace-nowrap text-sm lg:text-base"
                >
                    {link.text}
                </Link>
            ))}
        </nav>
    );
}