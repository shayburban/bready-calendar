import Layout from "./Layout.jsx";

import Home from "./Home";

import FindTutors from "./FindTutors";

import MyProfile from "./MyProfile";

import AdminDashboard from "./AdminDashboard";

import TeacherRegistration from "./TeacherRegistration";

import PostRequirement from "./PostRequirement";

import TeacherDashboard from "./TeacherDashboard";

import StudentDashboard from "./StudentDashboard";

import LiveSession from "./LiveSession";

import BookingCalendar from "./BookingCalendar";

import InputSystemTest from "./InputSystemTest";

import TeacherCalendar from "./TeacherCalendar";

import TeacherCalendarWeekly from "./TeacherCalendarWeekly";

import AdminRoleManagement from "./AdminRoleManagement";

import AdminAnalytics from "./AdminAnalytics";

import AdminPricingManagement from "./AdminPricingManagement";

import AdminPendingApprovals from "./AdminPendingApprovals";

import AdminContentManagement from "./AdminContentManagement";

import AdminSystemDesign from "./AdminSystemDesign";

import UserSearchInsights from "./UserSearchInsights";

import TeacherInbox from "./TeacherInbox";

import TeacherChat from "./TeacherChat";

import TeacherTasks from "./TeacherTasks";

import TeacherStatistics from "./TeacherStatistics";

import TeacherFinance from "./TeacherFinance";

import TeacherSettings from "./TeacherSettings";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    FindTutors: FindTutors,
    
    MyProfile: MyProfile,
    
    AdminDashboard: AdminDashboard,
    
    TeacherRegistration: TeacherRegistration,
    
    PostRequirement: PostRequirement,
    
    TeacherDashboard: TeacherDashboard,
    
    StudentDashboard: StudentDashboard,
    
    LiveSession: LiveSession,
    
    BookingCalendar: BookingCalendar,
    
    InputSystemTest: InputSystemTest,
    
    TeacherCalendar: TeacherCalendar,
    
    TeacherCalendarWeekly: TeacherCalendarWeekly,
    
    AdminRoleManagement: AdminRoleManagement,
    
    AdminAnalytics: AdminAnalytics,
    
    AdminPricingManagement: AdminPricingManagement,
    
    AdminPendingApprovals: AdminPendingApprovals,
    
    AdminContentManagement: AdminContentManagement,
    
    AdminSystemDesign: AdminSystemDesign,
    
    UserSearchInsights: UserSearchInsights,
    
    TeacherInbox: TeacherInbox,
    
    TeacherChat: TeacherChat,
    
    TeacherTasks: TeacherTasks,
    
    TeacherStatistics: TeacherStatistics,
    
    TeacherFinance: TeacherFinance,
    
    TeacherSettings: TeacherSettings,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/FindTutors" element={<FindTutors />} />
                
                <Route path="/MyProfile" element={<MyProfile />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/TeacherRegistration" element={<TeacherRegistration />} />
                
                <Route path="/PostRequirement" element={<PostRequirement />} />
                
                <Route path="/TeacherDashboard" element={<TeacherDashboard />} />
                
                <Route path="/StudentDashboard" element={<StudentDashboard />} />
                
                <Route path="/LiveSession" element={<LiveSession />} />
                
                <Route path="/BookingCalendar" element={<BookingCalendar />} />
                
                <Route path="/InputSystemTest" element={<InputSystemTest />} />
                
                <Route path="/TeacherCalendar" element={<TeacherCalendar />} />
                
                <Route path="/TeacherCalendarWeekly" element={<TeacherCalendarWeekly />} />
                
                <Route path="/AdminRoleManagement" element={<AdminRoleManagement />} />
                
                <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
                
                <Route path="/AdminPricingManagement" element={<AdminPricingManagement />} />
                
                <Route path="/AdminPendingApprovals" element={<AdminPendingApprovals />} />
                
                <Route path="/AdminContentManagement" element={<AdminContentManagement />} />
                
                <Route path="/AdminSystemDesign" element={<AdminSystemDesign />} />
                
                <Route path="/UserSearchInsights" element={<UserSearchInsights />} />
                
                <Route path="/TeacherInbox" element={<TeacherInbox />} />
                
                <Route path="/TeacherChat" element={<TeacherChat />} />
                
                <Route path="/TeacherTasks" element={<TeacherTasks />} />
                
                <Route path="/TeacherStatistics" element={<TeacherStatistics />} />
                
                <Route path="/TeacherFinance" element={<TeacherFinance />} />
                
                <Route path="/TeacherSettings" element={<TeacherSettings />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}