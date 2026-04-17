import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User } from '@/api/entities';
import { 
  User as UserIcon, 
  ChevronDown, 
  Shield, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AdminHeader({ user, topOffset = '0px' }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const clearViewMode = () => {
    localStorage.removeItem('adminViewAsMode');
    localStorage.removeItem('adminImpersonation');
    window.dispatchEvent(new CustomEvent('adminBannerStateChange'));
    window.location.reload();
  };

  const headerStyle = {
    position: 'fixed',
    top: topOffset,
    left: 0,
    right: 0,
    zIndex: 50
  };

  return (
    <header className="bg-white shadow-md border-b" style={headerStyle}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to={createPageUrl('Home')} className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Bready</span>
            </Link>
            <div className="hidden md:flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Admin Mode</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              <Link 
                to={createPageUrl('AdminDashboard')} 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to={createPageUrl('AdminRoleManagement')} 
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                Roles & Perspectives
              </Link>
              <span className="text-gray-300">|</span>
              <button
                onClick={clearViewMode}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
              >
                Exit View Mode
              </button>
            </nav>
            
            {/* Admin User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-5 h-5" />
                    <span className="hidden lg:block font-medium">{user.full_name}</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Shield className="w-3 h-3 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">Administrator</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('AdminDashboard')} className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl('AdminRoleManagement')} className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Roles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative z-50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full bg-white shadow-lg border-t z-40">
            <div className="px-4 py-6 space-y-4">
              <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 rounded-full w-fit">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Mode</span>
              </div>
              
              <nav className="space-y-3">
                <Link 
                  to={createPageUrl('AdminDashboard')}
                  className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to={createPageUrl('AdminRoleManagement')}
                  className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Roles & Perspectives
                </Link>
                <button
                  onClick={() => {
                    clearViewMode();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block text-orange-600 hover:text-orange-700 font-medium py-2"
                >
                  Exit View Mode
                </button>
              </nav>
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-5 h-5" />
                  <div>
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}