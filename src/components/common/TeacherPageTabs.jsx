
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TabSelector from './TabSelector';
import { createPageUrl } from '@/utils';
import {
  User as UserIcon,
  Calendar,
  Bell,
  MessageSquare,
  PieChart,
  DollarSign,
  Settings,
  ClipboardList, // Assuming this exists for Task Manager
} from 'lucide-react';

const teacherTabsConfig = [
  { value: 'profile', label: 'My Profile', href: 'MyProfile', icon: <UserIcon className="w-4 h-4" /> },
  { value: 'calendar', label: 'Calendar', href: 'TeacherCalendar', icon: <Calendar className="w-4 h-4" /> },
  { value: 'inbox', label: 'Inbox', href: 'TeacherInbox', icon: <Bell className="w-4 h-4" />, badge: 2 },
  { value: 'chat', label: 'Chat', href: 'TeacherChat', icon: <MessageSquare className="w-4 h-4" />, badge: 2 },
  { value: 'tasks', label: 'Task Manager', href: 'TeacherTasks', icon: <ClipboardList className="w-4 h-4" /> },
  { value: 'stats', label: 'Statistics', href: 'TeacherStatistics', icon: <PieChart className="w-4 h-4" /> },
  { value: 'finance', label: 'Finance', href: 'TeacherFinance', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'settings', label: 'Settings', href: 'TeacherSettings', icon: <Settings className="w-4 h-4" /> },
];

export default function TeacherPageTabs({ activeTabValue }) {
  const navigate = useNavigate();

  const handleTabChange = (tabValue) => {
    const tab = teacherTabsConfig.find(t => t.value === tabValue);
    if (tab && tab.href) {
        if (tab.href.startsWith('#')) {
            console.log(`Navigation to ${tab.label} is a placeholder.`);
        } else {
            navigate(createPageUrl(tab.href));
        }
    }
  };

  // Enhance tab labels with icons and badges for the TabSelector
  const tabsForSelector = teacherTabsConfig.map(tab => ({
    value: tab.value,
    label: (
      <span className="flex items-center space-x-2">
        {tab.icon}
        <span>{tab.label}</span>
        {tab.badge && <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>}
      </span>
    ),
  }));

  return (
    <div className="bg-white border-b">
        <div className="container mx-auto px-6">
            <TabSelector
              tabs={tabsForSelector}
              activeTab={activeTabValue}
              onTabChange={handleTabChange}
              maxVisibleTabs={6}
              moreLabel="+ More"
            />
        </div>
    </div>
  );
}
