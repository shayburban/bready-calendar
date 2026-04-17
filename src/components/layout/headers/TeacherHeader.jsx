import React from 'react';
import HeaderContainer from '../header/HeaderContainer';
import LanguageCurrencyDropdown from '../header/LanguageCurrencyDropdown';
import SearchInput from '../header/SearchInput';
import TeacherWalletDropdown from '../header/TeacherWalletDropdown';
import TeacherMessagesDropdown from '../header/TeacherMessagesDropdown';
import TeacherProfileDropdown from '../header/TeacherProfileDropdown';
import { Button } from '@/components/ui/button';

export default function TeacherHeader({ user, isViewAsMode = false, topOffset = '0px' }) {
    // Create a wrapper component that passes the user prop correctly
    const TeacherProfileDropdownWithUser = () => <TeacherProfileDropdown user={user} />;

    const teacherItems = [
        // Search Item (special positioning)
        { key: 'search', type: 'search', Component: SearchInput },
        
        // Left-aligned navigation
        { key: 'dashboard', type: 'nav', href: 'TeacherDashboard', text: 'Dashboard', priority: 10, position: 'left' },
        { key: 'students', type: 'nav', href: 'MyStudents', text: 'My Students', priority: 9, position: 'left' },
        { key: 'schedule', type: 'nav', href: 'MySchedule', text: 'Schedule', priority: 8, position: 'left' },
        
        // Right-aligned actions
        { key: 'lang', type: 'component', Component: LanguageCurrencyDropdown, priority: 5, position: 'right' },
        { key: 'wallet', type: 'component', Component: TeacherWalletDropdown, priority: 7, position: 'right' },
        { key: 'messages', type: 'component', Component: TeacherMessagesDropdown, priority: 8, position: 'right' },
        { key: 'profile', type: 'component', Component: TeacherProfileDropdownWithUser, priority: 9, position: 'right' },
    ];

    const headerStyle = {
        position: 'fixed',
        top: topOffset,
        left: 0,
        right: 0,
        zIndex: 50
    };

    return (
        <header className="bg-white shadow-md" style={headerStyle}>
            {/* View As Mode Banner - removed since it's now handled globally */}
            
            {/* Main Header Container */}
            <HeaderContainer allItems={teacherItems} user={user} headerType="teacher" />
        </header>
    );
}