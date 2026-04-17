
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, User as UserIcon, Globe } from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeacherSettings() {
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
          <p className="text-gray-600">Loading settings...</p>
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
            <span>Settings</span>
          </nav>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TeacherPageTabs activeTabValue="settings" />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
          <p className="text-gray-600">Manage your account preferences and privacy settings</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Preferences
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user?.full_name?.split(' ')[0] || ''} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.full_name?.split(' ')[1] || ''} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ''} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="Enter your phone number" />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Tell students about yourself..." />
                </div>
                <Button>Update Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch id="email-notifications" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="booking-alerts">New Booking Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified when students book sessions</p>
                  </div>
                  <Switch id="booking-alerts" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="message-notifications">Message Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified of new messages from students</p>
                  </div>
                  <Switch id="message-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="reminder-notifications">Session Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders before sessions</p>
                  </div>
                  <Switch id="reminder-notifications" defaultChecked />
                </div>
                
                <Button>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="profile-visibility">Public Profile</Label>
                    <p className="text-sm text-gray-500">Make your profile visible to all students</p>
                  </div>
                  <Switch id="profile-visibility" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contact-info">Show Contact Info</Label>
                    <p className="text-sm text-gray-500">Display your contact information on profile</p>
                  </div>
                  <Switch id="contact-info" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-accept">Auto-accept Bookings</Label>
                    <p className="text-sm text-gray-500">Automatically accept booking requests</p>
                  </div>
                  <Switch id="auto-accept" />
                </div>
                
                <Button>Update Privacy Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="language">Preferred Language</Label>
                    <Input id="language" defaultValue="English" />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" defaultValue="UTC-5 (Eastern Time)" />
                  </div>
                  <Button>Save Preferences</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline">Change Password</Button>
                    <Button variant="outline">Download My Data</Button>
                    <Button variant="destructive">Deactivate Account</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
