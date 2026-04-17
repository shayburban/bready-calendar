
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Search } from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeacherChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');

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

  const chats = [
    { id: 1, name: 'Sarah M.', lastMessage: 'Thank you for the great session!', time: '2:30 PM', unread: 0, avatar: 'S' },
    { id: 2, name: 'John D.', lastMessage: 'Can we reschedule tomorrow\'s session?', time: '1:15 PM', unread: 2, avatar: 'J' },
    { id: 3, name: 'Alice K.', lastMessage: 'I have a question about homework', time: '11:45 AM', unread: 1, avatar: 'A' },
    { id: 4, name: 'Bob R.', lastMessage: 'The materials were very helpful', time: 'Yesterday', unread: 0, avatar: 'B' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your chats...</p>
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
            <span>Chat</span>
          </nav>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TeacherPageTabs activeTabValue="chat" />

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Messages
                <Badge className="bg-blue-500">3 New</Badge>
              </CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                      selectedChat?.id === chat.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {chat.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 truncate">{chat.name}</h4>
                          <span className="text-sm text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <Badge className="bg-red-500">{chat.unread}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Window */}
          <Card className="lg:col-span-2">
            {selectedChat ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedChat.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedChat.name}</h3>
                      <p className="text-sm text-gray-500">Online</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-4 bg-gray-50">
                  <div className="h-[400px] flex items-center justify-center text-gray-500">
                    <p>Chat interface will be implemented here</p>
                  </div>
                </CardContent>
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Type a message..." 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <p className="text-gray-500">Select a conversation to start chatting</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
