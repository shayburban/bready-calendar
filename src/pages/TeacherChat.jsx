import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Search,
  Info,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Ban,
  Video,
  CalendarPlus,
  Package,
} from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FILTERS = ['All', 'Unread', 'As A Teacher', 'As A Student'];

const CONTACTS = [
  {
    id: 1,
    name: 'Mark R.',
    role: 'T',
    preview: 'Lorem Ipsum sit',
    time: '13:21',
    unread: 0,
    active: true,
  },
  {
    id: 2,
    name: 'Mark R.',
    role: 'S',
    preview: 'Lorem Ipsum sit',
    time: '13:21',
    unread: 2,
  },
  {
    id: 3,
    name: 'Mark R.',
    role: 'T',
    preview: 'Lorem Ipsum sit',
    time: 'Yesterday',
    unread: 0,
  },
  {
    id: 4,
    name: 'Mark R.',
    role: 'S',
    preview: 'Lorem Ipsum sit',
    time: 'Monday',
    unread: 0,
  },
  {
    id: 5,
    name: 'Mark R.',
    role: 'T',
    preview: 'Lorem Ipsum sit',
    time: '12.11.2021',
    unread: 0,
  },
  {
    id: 6,
    name: 'Mark R.',
    role: 'S',
    preview: 'Lorem Ipsum sit',
    time: '12.11.2021',
    unread: 0,
  },
  {
    id: 7,
    name: 'Mark R.',
    role: 'T',
    preview: 'Lorem Ipsum sit',
    time: '12.11.2021',
    unread: 0,
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    side: 'left',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    time: '22:16',
  },
  {
    id: 2,
    side: 'right',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam quis lorem quis diam accumsan aliquet quis a urna.',
    time: '22:16',
    status: 'sent',
  },
  {
    id: 3,
    side: 'right',
    text: 'Lorem ipsum amet, consectetur adipiscing elit.',
    time: '22:16',
    status: 'delivered',
  },
  {
    id: 4,
    side: 'right',
    text: 'Lorem ipsum dolor sit amet, consectetur elit.',
    time: '22:16',
    status: 'read',
  },
  {
    id: 5,
    side: 'right',
    text: 'Lorem ipsum dolor sit amet, consectetur elit.',
    time: '22:16',
    status: 'restricted',
  },
];

const STATUS_LABELS = {
  sent: 'Message Sent To User',
  delivered: 'Message Delivered To User',
  read: 'User Has Read Your Message',
  restricted: 'Message Violates Website Policy',
};

function Initials({ name }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    (parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '');
  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
      {letters.toUpperCase()}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'sent')
    return <Check className="w-3.5 h-3.5 text-gray-400" />;
  if (status === 'delivered')
    return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
  if (status === 'read')
    return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
  if (status === 'restricted')
    return <Ban className="w-3.5 h-3.5 text-red-500" />;
  return null;
}

export default function TeacherChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(CONTACTS[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    User.me()
      .then(setUser)
      .catch((e) => console.error('Error fetching user:', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const filteredContacts = CONTACTS.filter((c) => {
    if (activeFilter === 'Unread' && c.unread === 0) return false;
    if (activeFilter === 'As A Teacher' && c.role !== 'T') return false;
    if (activeFilter === 'As A Student' && c.role !== 'S') return false;
    if (
      searchTerm &&
      !c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages([
      ...messages,
      {
        id: Date.now(),
        side: 'right',
        text,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        status: 'sent',
      },
    ]);
    setDraft('');
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Teacher Chat</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Teacher Chat</span>
          </nav>
        </div>
      </div>

      <TeacherPageTabs activeTabValue="chat" />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 h-[640px]">
            {/* LEFT — contact list */}
            <aside className="md:col-span-4 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search teacher"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="px-4 py-2 border-b">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {FILTERS.map((f) => (
                    <li key={f}>
                      <button
                        type="button"
                        onClick={() => setActiveFilter(f)}
                        className={`py-1 font-medium transition-colors ${
                          activeFilter === f
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {f}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedContact(c)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                      selectedContact?.id === c.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Initials name={c.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h6 className="font-semibold text-gray-900 truncate">
                          {c.name} ({c.role})
                        </h6>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="w-4 h-4 rounded-full border border-gray-400 text-gray-500 text-[10px] flex items-center justify-center">
                                <Info className="w-2.5 h-2.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-xs text-xs"
                            >
                              {c.role === 'T'
                                ? 'You are chatting as a teacher.'
                                : 'You are chatting as a student.'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {c.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {c.time}
                      </span>
                      {c.unread > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {filteredContacts.length === 0 && (
                  <p className="p-6 text-sm text-gray-500 text-center">
                    No conversations found.
                  </p>
                )}
              </div>
            </aside>

            {/* RIGHT — chat panel */}
            <section className="md:col-span-8 flex flex-col bg-gray-50">
              {selectedContact ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
                    <Initials name={selectedContact.name} />
                    <div className="flex-1 min-w-0">
                      <h6 className="font-semibold text-gray-900">
                        {selectedContact.name} ({selectedContact.role})
                      </h6>
                      <p className="text-xs text-gray-500">
                        It&apos;s 11:54 for Teacher Name
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Video className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Skype</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Video className="w-4 h-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Google Meet</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Video className="w-4 h-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Zoom</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="outline" size="sm" className="h-8">
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Book For Student
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        <Package className="w-4 h-4 mr-1" />
                        Buy Packages
                      </Button>
                    </div>
                  </div>

                  {/* Message scroll area */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                    <div className="flex justify-center mb-4">
                      <span className="bg-white border text-xs text-gray-600 rounded-full px-3 py-1">
                        12 September 2021
                      </span>
                    </div>

                    <div className="space-y-3">
                      {messages.map((m) =>
                        m.side === 'left' ? (
                          <div key={m.id} className="flex items-start gap-2">
                            <Initials name={selectedContact.name} />
                            <div className="max-w-md bg-white border rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm">
                              <p className="text-sm text-gray-800">{m.text}</p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {m.time}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div key={m.id} className="flex justify-end">
                            <div className="max-w-md bg-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-2 shadow-sm">
                              <p className="text-sm">{m.text}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] opacity-80">
                                  {m.time}
                                </span>
                                {m.status && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                          <StatusIcon status={m.status} />
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {STATUS_LABELS[m.status]}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Compose tray */}
                  <div className="border-t bg-white px-3 py-2 flex items-center gap-2">
                    <label
                      className="p-2 text-gray-500 hover:text-gray-800 cursor-pointer"
                      aria-label="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                      <input type="file" className="hidden" />
                    </label>
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message here..."
                      className="flex-1 border-none shadow-none focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      onClick={sendMessage}
                      className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 w-10 p-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to start chatting
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
