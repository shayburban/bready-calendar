import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import GuestHeader from './headers/GuestHeader';
import StudentHeader from './headers/StudentHeader';
import TeacherHeader from './headers/TeacherHeader';
import AdminHeader from './headers/AdminHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function Header({ topOffset = '0px' }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewAsMode, setViewAsMode] = useState(null);
    const [isImpersonating, setIsImpersonating] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Check for impersonation mode first
                const impersonationData = localStorage.getItem('adminImpersonation');
                if (impersonationData) {
                    const parsed = JSON.parse(impersonationData);
                    if (parsed.active && parsed.targetUserId) {
                        const targetUser = await User.get(parsed.targetUserId);
                        setUser(targetUser);
                        setIsImpersonating(true);
                        setLoading(false);
                        return;
                    }
                }

                const currentUser = await User.me();
                setUser(currentUser);
                
                // Check for view as mode
                const viewAsData = localStorage.getItem('adminViewAsMode');
                if (viewAsData && (currentUser.role === 'admin' || (currentUser.roles && currentUser.roles.includes('admin')))) {
                    const parsed = JSON.parse(viewAsData);
                    if (parsed.active) {
                        setViewAsMode(parsed.role);
                    }
                }
            } catch (e) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    // Use the topOffset directly as received from Layout - no additional calculation needed
    const headerStyle = {
      position: 'fixed',
      top: topOffset,
      left: 0,
      right: 0,
      zIndex: 50
    };

    if (loading) {
        return (
            <header className="bg-white shadow-md" style={headerStyle}>
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <div className="flex items-center space-x-4">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
            </header>
        );
    }
    
    // Handle impersonation mode - show impersonated user's header
    if (isImpersonating) {
        switch (user?.role) {
            case 'student':
                return <StudentHeader user={user} isViewAsMode={true} topOffset={topOffset} />;
            case 'teacher':
                return <TeacherHeader user={user} isViewAsMode={true} topOffset={topOffset} />;
            default:
                return <GuestHeader isViewAsMode={true} topOffset={topOffset} />;
        }
    }

    // Handle view as mode - show admin as different role
    if (user?.role === 'admin' && viewAsMode) {
        switch (viewAsMode) {
            case 'student':
                return <StudentHeader user={{...user, role: 'student'}} isViewAsMode={true} topOffset={topOffset} />;
            case 'teacher':
                return <TeacherHeader user={{...user, role: 'teacher'}} isViewAsMode={true} topOffset={topOffset} />;
            case 'guest':
                return <GuestHeader isViewAsMode={true} topOffset={topOffset} />;
            default:
                return <AdminHeader user={user} topOffset={topOffset} />;
        }
    }

    // Normal mode - show user's actual role header
    switch (user?.role) {
        case 'student':
            return <StudentHeader user={user} topOffset={topOffset} />;
        case 'teacher':
            return <TeacherHeader user={user} topOffset={topOffset} />;
        case 'admin':
            return <AdminHeader user={user} topOffset={topOffset} />;
        default:
            return <GuestHeader topOffset={topOffset} />;
    }
}