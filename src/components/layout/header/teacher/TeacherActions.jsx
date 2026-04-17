import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Inbox, MessageSquare } from 'lucide-react';
import TeacherWalletDropdown from '../TeacherWalletDropdown';
import TeacherMessagesDropdown from '../TeacherMessagesDropdown';
import TeacherProfileDropdown from '../TeacherProfileDropdown';

export default function TeacherActions({ user, className = "" }) {
    return (
        <div className={`flex items-center space-x-3 lg:space-x-4 ${className}`}>
            <TeacherWalletDropdown balance="5.40" />
            <Link to={createPageUrl('Contact')} className="text-gray-600 hover:text-brand-blue transition-colors text-sm lg:text-base">
                Contact
            </Link>
            <Link to={createPageUrl('TeacherInbox')} className="text-gray-600 hover:text-brand-blue transition-colors relative flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">Inbox</span>
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] h-4 flex items-center justify-center">
                    2
                </Badge>
            </Link>
            <TeacherMessagesDropdown unreadCount={2} />
            <TeacherProfileDropdown user={user} />
        </div>
    );
}