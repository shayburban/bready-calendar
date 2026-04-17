import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Calendar, LayoutDashboard, DollarSign, BarChart2, Settings, LogOut } from 'lucide-react';

export default function TeacherProfileDropdown({ user, onLogout }) {
    const getInitials = (name) => {
        if (!name) return 'U';
        const names = name.split(' ');
        if (names.length === 1) return names[0].charAt(0).toUpperCase();
        return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 focus:outline-none">
                    <Avatar>
                        <AvatarImage src={user?.profilePicture || "https://github.com/shadcn.png"} alt={user?.full_name} />
                        <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                    <div className="font-medium">{user?.full_name}</div>
                    <div className="font-normal text-sm text-gray-500">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl('MyProfile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to={createPageUrl('TeacherCalendar')}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Calendar</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="#">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Task Manager</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="#">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span>Finance</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link to="#">
                        <BarChart2 className="mr-2 h-4 w-4" />
                        <span>Statistics</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link to="#">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}