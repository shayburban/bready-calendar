
import React from 'react';
import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TeacherPageTabs from '../components/common/TeacherPageTabs';

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {user?.full_name ? `${user.full_name}'s Profile` : 'My Profile'}
          </h1>
          <nav className="text-sm opacity-80">
            <Link 
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Website Homepage
            </Link>
            <span className="mx-2">/</span>
            <span>My Profile</span>
          </nav>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TeacherPageTabs activeTabValue="profile" />

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Information</h2>
          <p className="text-gray-600">Welcome to your profile page. Here you can manage your teaching information, update your availability, and track your performance.</p>
          
          <div className="mt-6 space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-800">Account Details</h3>
              <p className="text-sm text-gray-600 mt-1">Name: {user?.full_name || 'Not set'}</p>
              <p className="text-sm text-gray-600">Email: {user?.email || 'Not set'}</p>
              <p className="text-sm text-gray-600">Role: {user?.role || 'Not set'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
