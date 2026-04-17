import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, Plus } from 'lucide-react';

export default function TeacherNavigation({ className = "" }) {
    const navLinks = [
        { href: 'Home', text: 'Home', icon: <Home className="h-4 w-4" /> },
        { href: 'StudentPosts', text: 'View Student Posts', icon: <Users className="h-4 w-4" /> },
        { href: 'PostRequirement', text: 'Post A Requirement', icon: <Plus className="h-4 w-4" /> },
    ];

    return (
        <nav className={`flex items-center space-x-4 lg:space-x-6 ${className}`}>
            {navLinks.map(link => (
                <Link 
                    key={link.href} 
                    to={createPageUrl(link.href)} 
                    className="text-gray-600 hover:text-brand-blue transition-colors flex items-center gap-2 whitespace-nowrap text-sm lg:text-base"
                >
                    <span className="hidden sm:inline">{link.icon}</span>
                    {link.text}
                </Link>
            ))}
        </nav>
    );
}