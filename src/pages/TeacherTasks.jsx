
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ClipboardList, Plus, Calendar, Clock, AlertTriangle } from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeacherTasks() {
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

  const tasks = [
    { id: 1, title: 'Prepare materials for Sarah\'s session', priority: 'high', dueDate: 'Today 3:00 PM', completed: false, type: 'preparation' },
    { id: 2, title: 'Review homework assignments', priority: 'medium', dueDate: 'Tomorrow', completed: false, type: 'review' },
    { id: 3, title: 'Update availability calendar', priority: 'low', dueDate: 'This week', completed: true, type: 'admin' },
    { id: 4, title: 'Send feedback to John D.', priority: 'high', dueDate: 'Overdue', completed: false, type: 'communication' },
    { id: 5, title: 'Prepare quiz for Alice K.', priority: 'medium', dueDate: 'Friday', completed: false, type: 'preparation' },
  ];

  const toggleTask = (taskId) => {
    // Task toggle logic would go here
    console.log('Toggle task:', taskId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
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
            <span>Task Manager</span>
          </nav>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TeacherPageTabs activeTabValue="tasks" />

      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Task Manager</h2>
            <p className="text-gray-600">Keep track of your teaching tasks and deadlines</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Active Tasks
                <Badge className="bg-orange-500">
                  {tasks.filter(t => !t.completed).length} Pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-lg flex items-center gap-4 ${
                      task.completed ? 'bg-gray-50 opacity-75' : 'bg-white'
                    }`}
                  >
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h4>
                        <Badge variant={
                          task.priority === 'high' ? 'destructive' : 
                          task.priority === 'medium' ? 'default' : 
                          'secondary'
                        }>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          {task.dueDate === 'Overdue' ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          <span className={task.dueDate === 'Overdue' ? 'text-red-500 font-medium' : ''}>
                            {task.dueDate}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tasks.filter(t => t.priority === 'high' && !t.completed).length}</p>
                <p className="text-sm text-gray-600">tasks pending</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tasks.filter(t => t.dueDate.includes('Today')).length}</p>
                <p className="text-sm text-gray-600">tasks due</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{tasks.filter(t => t.completed).length}</p>
                <p className="text-sm text-gray-600">this week</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
