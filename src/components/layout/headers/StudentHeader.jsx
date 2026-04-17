
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import HeaderLogo from '../header/HeaderLogo';
import HeaderSearch from '../header/HeaderSearch';
import HeaderAuth from '../header/HeaderAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Search, BookOpen, Menu, X } from 'lucide-react';

export default function StudentHeader({ user, isViewAsMode = false }) {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navLinks = [
        { href: 'StudentDashboard', text: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { href: 'FindTutors', text: 'Find a Teacher', icon: <Search className="h-4 w-4" /> },
        { href: 'MyCourses', text: 'My Courses', icon: <BookOpen className="h-4 w-4" /> },
    ];

    return (
        <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            {/* View As Mode Banner */}
            {isViewAsMode && (
                <div className="bg-orange-500 text-white text-center py-2 text-sm">
                    <span className="font-medium">Admin View Mode Active</span> - Viewing as Student
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-4 text-white hover:bg-orange-600 hover:text-white"
                        onClick={() => {
                            localStorage.removeItem('adminViewAsMode');
                            window.location.href = '/AdminDashboard';
                        }}
                    >
                        Exit View Mode
                    </Button>
                </div>
            )}
            
            <div className="container mx-auto px-4">
                {/* Desktop Header */}
                <div className="hidden md:flex items-center justify-between h-20">
                    <div className="flex items-center space-x-8">
                        <HeaderLogo />
                        <nav className="flex items-center space-x-6">
                            {navLinks.map(link => (
                                <Link key={link.href} to={createPageUrl(link.href)} className="text-gray-600 hover:text-brand-blue transition-colors flex items-center gap-2">
                                    {link.icon}
                                    {link.text}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        <HeaderSearch />
                        <HeaderAuth user={user} />
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between h-16">
                    <HeaderLogo />
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                 <div className="md:hidden bg-white border-t py-4">
                    <div className="container mx-auto px-4 space-y-4">
                        <HeaderSearch />
                        <nav className="flex flex-col space-y-2">
                           {navLinks.map(link => (
                                <Link 
                                    key={link.href} 
                                    to={createPageUrl(link.href)} 
                                    className="flex items-center gap-3 text-gray-700 hover:text-brand-blue p-2 rounded-md hover:bg-gray-100 transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.icon}
                                    <span>{link.text}</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="border-t pt-4">
                            <HeaderAuth user={user} />
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
