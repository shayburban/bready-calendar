import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { AdminImpersonationLog } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  GraduationCap,
  UserCheck,
  Calendar,
  TrendingUp,
  Eye,
  Shield,
  Activity,
  Clock,
  Fingerprint,
  BarChart3, // Added BarChart3 for the new analytics card
  DollarSign, // Added icon for Dynamic Pricing & Payments
  CheckSquare, // Added icon for Pending Approvals & Quality Control
  Edit, // Added Edit icon for Content & Media Management
  Settings, // Added Settings icon for System Design Management
  AlertTriangle, // New icon for Booking Disputes
  MessageSquare, // New icon for Support Tickets
  ArrowLeftRight, // New icon for Refunds & Credits
  Bell, // New icon for Notification Center
  Lock, // New icon for Security Center
  Database, // New icon for Data & Backups
  Zap, // New icon for Integrations
  FileText // Added for the new card
} from 'lucide-react';
import MetricsWidget from '../components/admin/MetricsWidget';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TabSelector from '../components/common/TabSelector';

// Import ONLY existing page components for tab navigation
import AdminContentManagement from './AdminContentManagement';
import AdminSystemDesign from './AdminSystemDesign';
import AdminAnalytics from './AdminAnalytics';
import AdminRoleManagement from './AdminRoleManagement';
import AdminPricingManagement from './AdminPricingManagement';
import AdminPendingApprovals from './AdminPendingApprovals';
import UserSearchInsights from './UserSearchInsights';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewAsMode, setViewAsMode] = useState(null);
  const [impersonateUserId, setImpersonateUserId] = useState('');
  const [impersonateError, setImpersonateError] = useState('');
  const [analytics, setAnalytics] = useState({
    totalUsers: 1247,
    totalTeachers: 156,
    totalStudents: 1067,
    totalAdmins: 24,
    activeSessions: 89,
    bookingsToday: 23,
    bookingsWeek: 167,
    bookingsMonth: 692,
    revenue: 12450,
    engagement: 76
  });

  // TabSelector items - Home first, then all Quick Actions
  const adminTabs = [
    { label: 'Home', value: 'home' },
    { label: 'User Management', value: 'user-management' },
    { label: 'Teacher Verification', value: 'teacher-verification' },
    { label: 'Payments & Payouts', value: 'payments-payouts' },
    { label: 'Booking Disputes', value: 'booking-disputes' },
    { label: 'Booking Management', value: 'booking-management' },
    { label: 'Quality Control', value: 'quality-control' },
    { label: 'Support Tickets', value: 'support-tickets' },
    { label: 'Refunds & Credits', value: 'refunds-credits' },
    { label: 'Analytics Reports', value: 'analytics-reports' },
    { label: 'User Search Insights', value: 'user-search-insights' },
    { label: 'Fraud Detection', value: 'fraud-detection' },
    { label: 'Performance Metrics', value: 'performance-metrics' },
    { label: 'User Engagement', value: 'user-engagement' },
    { label: 'Notification Center', value: 'notification-center' },
    { label: 'Security Center', value: 'security-center' },
    { label: 'Data & Backups', value: 'data-backups' },
    { label: 'Integrations', value: 'integrations' },
    { label: 'Content & Media Management', value: 'content-media' },
    { label: 'System Design', value: 'system-design' },
    { label: 'Advanced Analytics', value: 'advanced-analytics' },
    { label: 'Role Management', value: 'role-management' },
    { label: 'Dynamic Pricing & Tiers', value: 'dynamic-pricing' },
    { label: 'Pending Approvals', value: 'pending-approvals' }
  ];

  const [activeTab, setActiveTab] = React.useState('home');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin' && !(currentUser.roles && currentUser.roles.includes('admin'))) {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
        
        const viewAsData = localStorage.getItem('adminViewAsMode');
        if (viewAsData) {
          setViewAsMode(JSON.parse(viewAsData).role);
        }

      } catch (e) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleViewAsUser = (role) => {
    setViewAsMode(role);
    localStorage.setItem('adminViewAsMode', JSON.stringify({
      active: true,
      role: role,
      adminId: user.id
    }));
    
    // Trigger custom event to update global banner
    window.dispatchEvent(new CustomEvent('adminBannerStateChange'));
    
    const targetPath = role === 'teacher' ? 'TeacherDashboard' : role === 'student' ? 'StudentDashboard' : 'Home';
    window.location.href = `/${targetPath}`;
  };

  const handleImpersonate = async () => {
    if (!impersonateUserId) {
        setImpersonateError('Please enter a User ID or Email.');
        return;
    }
    setImpersonateError('');

    try {
        let targetUser = await User.get(impersonateUserId).catch(() => null);
        if (!targetUser) {
            const usersByEmail = await User.filter({ email: impersonateUserId });
            if (usersByEmail.length > 0) {
                targetUser = usersByEmail[0];
            } else {
                setImpersonateError('User not found.');
                return;
            }
        }

        if (targetUser.id === user.id) {
            setImpersonateError("You cannot impersonate yourself.");
            return;
        }

        await AdminImpersonationLog.create({
            admin_user_id: user.id,
            admin_user_email: user.email,
            impersonated_user_id: targetUser.id,
            impersonated_user_email: targetUser.email,
            impersonation_timestamp: new Date().toISOString()
        });

        localStorage.setItem('adminImpersonation', JSON.stringify({
            active: true,
            targetUserId: targetUser.id,
            targetUserEmail: targetUser.email,
            adminId: user.id
        }));

        // Trigger custom event to update global banner
        window.dispatchEvent(new CustomEvent('adminBannerStateChange'));

        window.location.href = '/';
        
    } catch (error) {
        console.error("Impersonation failed:", error);
        setImpersonateError('An error occurred during impersonation.');
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">User Impersonation</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Fingerprint className="w-5 h-5 mr-2 text-purple-600" />
                    View as Specific User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="flex-grow">
                      <Input 
                        placeholder="Enter User ID or Email"
                        value={impersonateUserId}
                        onChange={(e) => setImpersonateUserId(e.target.value)}
                      />
                      {impersonateError && <p className="text-red-500 text-xs mt-1">{impersonateError}</p>}
                    </div>
                    <Button onClick={handleImpersonate}>
                      Impersonate User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Website Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricsWidget
                  title="Total Users"
                  value={analytics.totalUsers}
                  icon={<Users className="w-6 h-6" />}
                  trend="+12%"
                  color="blue"
                />
                <MetricsWidget
                  title="Teachers"
                  value={analytics.totalTeachers}
                  icon={<GraduationCap className="w-6 h-6" />}
                  trend="+8%"
                  color="green"
                />
                <MetricsWidget
                  title="Students"
                  value={analytics.totalStudents}
                  icon={<UserCheck className="w-6 h-6" />}
                  trend="+15%"
                  color="purple"
                />
                <MetricsWidget
                  title="Active Sessions"
                  value={analytics.activeSessions}
                  icon={<Activity className="w-6 h-6" />}
                  trend="Live"
                  color="orange"
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricsWidget
                  title="Bookings Today"
                  value={analytics.bookingsToday}
                  icon={<Calendar className="w-6 h-6" />}
                  trend="+5%"
                  color="blue"
                />
                <MetricsWidget
                  title="This Week"
                  value={analytics.bookingsWeek}
                  icon={<Clock className="w-6 h-6" />}
                  trend="+18%"
                  color="green"
                />
                <MetricsWidget
                  title="This Month"
                  value={analytics.bookingsMonth}
                  icon={<TrendingUp className="w-6 h-6" />}
                  trend="+22%"
                  color="purple"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* TIER 1: CRITICAL OPERATIONS */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      User Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
                    <div className="mt-2 text-xs text-blue-600">
                      {analytics.totalUsers} active users
                    </div>
                  </CardContent>
                </Card>

                <Link to={createPageUrl('AdminTeacherVerification')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-orange-600" />
                        Teacher Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Verify teacher credentials and documents</p>
                      <div className="mt-2 text-xs text-orange-600">
                        12 pending verifications
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminPaymentsManagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                        Payments & Payouts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Manage teacher payments and platform revenue</p>
                      <div className="mt-2 text-xs text-green-600">
                        ${analytics.revenue} this month
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminBookingDisputes')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                        Booking Disputes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Resolve booking conflicts and disputes</p>
                      <div className="mt-2 text-xs text-red-600">
                        3 urgent disputes
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* TIER 2: OPERATIONAL MANAGEMENT */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Booking Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">View and manage all platform bookings</p>
                    <div className="mt-2 text-xs text-blue-600">
                      {analytics.bookingsToday} bookings today
                    </div>
                  </CardContent>
                </Card>

                <Link to={createPageUrl('AdminQualityControl')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckSquare className="w-5 h-5 mr-2 text-purple-600" />
                        Quality Control
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Monitor session quality and teacher performance</p>
                      <div className="mt-2 text-xs text-purple-600">
                        4.8/5 avg rating
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminSupportTickets')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                        Support Tickets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Handle user support requests and issues</p>
                      <div className="mt-2 text-xs text-blue-600">
                        8 open tickets
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminRefundsManagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ArrowLeftRight className="w-5 h-5 mr-2 text-orange-600" />
                        Refunds & Credits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Process refunds and student credits</p>
                      <div className="mt-2 text-xs text-orange-600">
                        5 pending refunds
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* TIER 3: ANALYTICS & INSIGHTS */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Analytics Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Detailed analytics and reporting tools</p>
                    <div className="mt-2 text-xs text-green-600">
                      +22% growth this month
                    </div>
                  </CardContent>
                </Card>

                <Link to={createPageUrl('UserSearchInsights')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        User Search Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Analyze user search queries and trends.</p>
                      <div className="mt-2 text-xs text-indigo-600">
                        New Feature
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminFraudDetection')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-red-600" />
                        Fraud Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Monitor suspicious activities and fake profiles</p>
                      <div className="mt-2 text-xs text-red-600">
                        2 flagged accounts
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminPerformanceMetrics')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Track KPIs and business performance</p>
                      <div className="mt-2 text-xs text-green-600">
                        All systems operational
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminUserEngagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-purple-600" />
                        User Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Monitor user activity and retention</p>
                      <div className="mt-2 text-xs text-purple-600">
                        {analytics.engagement}% active users
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* TIER 4: PLATFORM MANAGEMENT */}
                <Link to={createPageUrl('AdminNotificationCenter')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-yellow-600" />
                        Notification Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Send announcements and alerts to users</p>
                      <div className="mt-2 text-xs text-yellow-600">
                        3 scheduled alerts
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminSecurityCenter')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Lock className="w-5 h-5 mr-2 text-red-600" />
                        Security Center
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Monitor security logs and access controls</p>
                      <div className="mt-2 text-xs text-green-600">
                        No security alerts
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminBackupManagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Database className="w-5 h-5 mr-2 text-blue-600" />
                        Data & Backups
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Manage data backups and exports</p>
                      <div className="mt-2 text-xs text-blue-600">
                        Last backup: 2 hours ago
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminIntegrations')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                        Integrations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Manage third-party integrations and APIs</p>
                      <div className="mt-2 text-xs text-green-600">
                        12 active integrations
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* TIER 5: CONFIGURATION */}
                <Link to={createPageUrl('AdminContentManagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Edit className="w-5 h-5 mr-2" />
                        Content & Media Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Manage photo guidelines, video tips, and registration content</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminSystemDesign')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        System Design
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Customize global design elements and component styling</p>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to={createPageUrl('AdminAnalytics')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Advanced Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">AI-powered booking analytics and predictions</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminRoleManagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Role Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Define application roles and perspectives</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminPricingManagement')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Dynamic Pricing & Tiers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Manage commission rates, trial rules, and package tiers.</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link to={createPageUrl('AdminPendingApprovals')}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckSquare className="w-5 h-5 mr-2" />
                        Pending Approvals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">Verify or delete custom inputs from teachers.</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </>
        );

      case 'user-management': 
        return (
            <div className="py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">User Management Overview</h2>
                <p className="text-gray-600">Here you can manage user accounts, roles, and permissions.</p>
                <div className="mt-4 p-4 border rounded-md bg-white">
                  This section will contain detailed user management tools.
                </div>
            </div>
        );
      case 'booking-management': 
        return (
            <div className="py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Management Overview</h2>
                <p className="text-gray-600">Here you can view and manage all platform bookings.</p>
                <div className="mt-4 p-4 border rounded-md bg-white">
                  This section will contain detailed booking management tools.
                </div>
            </div>
        );
      case 'analytics-reports': 
        return (
            <div className="py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Analytics Reports Overview</h2>
                <p className="text-gray-600">Here you can access detailed analytics and reporting tools.</p>
                <div className="mt-4 p-4 border rounded-md bg-white">
                  This section will contain various analytics dashboards.
                </div>
            </div>
        );
      // Existing pages that work
      case 'user-search-insights':
        return <UserSearchInsights />;
      case 'content-media':
        return <AdminContentManagement />;
      case 'system-design':
        return <AdminSystemDesign />;
      case 'advanced-analytics':
        return <AdminAnalytics />;
      case 'role-management':
        return <AdminRoleManagement />;
      case 'dynamic-pricing':
        return <AdminPricingManagement />;
      case 'pending-approvals':
        return <AdminPendingApprovals />;
      
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">This section is under development</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user?.full_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
                <Select onValueChange={handleViewAsUser} value={viewAsMode || ""}>
                  <SelectTrigger className="w-48">
                    <Eye className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="View as Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">View as Teacher</SelectItem>
                    <SelectItem value="student">View as Student</SelectItem>
                    <SelectItem value="guest">View as Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Global TabSelector */}
        <div className="mb-8">
          <TabSelector
            tabs={adminTabs}
            moreLabel="+X More"
            activeTab={activeTab}
            onTabChange={setActiveTab}
            maxVisibleTabs={4}
          />
        </div>

        {/* Dynamic content based on selected tab */}
        {renderTabContent()}
      </div>
    </div>
  );
}