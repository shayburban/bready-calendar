import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from '@/api/entities';
import { ChevronDown } from 'lucide-react';

export default function HeaderAuth({ user }) {
    if (!user) {
        // This case is handled by GuestHeader, but added for robustness
        return null;
    }

    const getDashboardUrl = () => {
        switch (user.role) {
            case 'teacher':
                return createPageUrl('TeacherDashboard');
            case 'student':
                return createPageUrl('StudentDashboard');
            case 'admin':
                return createPageUrl('AdminDashboard');
            default:
                return createPageUrl('Home');
        }
    };

    return (
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.full_name}&background=0D8ABC&color=fff`} alt="user" className="w-6 h-6 rounded-full" />
                    {user.full_name.split(' ')[0]}
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to={createPageUrl('MyProfile')}>Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to={getDashboardUrl()}>Dashboard</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => User.logout()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}