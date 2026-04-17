import React, { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import TeacherChatInterface from './TeacherChatInterface';
import useOnClickOutside from '../../hooks/useOnClickOutside';

const mockConversations = [
    { id: 1, name: 'Alice Smith', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face', lastMessage: 'Great, thank you!', time: '10:42', unread: 2, messages: [{id: 1, from: 'Alice Smith', name: 'Alice', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face', text: 'Great, thank you!', time: '10:42', status: 'read' }] },
    { id: 2, name: 'Bob Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face', lastMessage: 'Can we reschedule for Friday?', time: '09:15', unread: 0, messages: [{id: 1, from: 'Bob Johnson', name: 'Bob', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face', text: 'Can we reschedule for Friday?', time: '09:15', status: 'read' }] },
    { id: 3, name: 'Charlie Brown', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face', lastMessage: 'I have a question about the homework.', time: 'Yesterday', unread: 0, messages: [{id: 1, from: 'Charlie Brown', name: 'Charlie', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face', text: 'I have a question about the homework.', time: 'Yesterday', status: 'read' }] },
];

const ConversationItem = ({ convo, onSelect }) => (
    <div 
        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => onSelect(convo)}
    >
        <Avatar>
            <AvatarImage src={convo.avatar} />
            <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow overflow-hidden">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-sm truncate">{convo.name}</p>
                <p className="text-xs text-gray-500 flex-shrink-0">{convo.time}</p>
            </div>
            <div className="flex justify-between items-start">
                <p className="text-xs text-gray-600 truncate">{convo.lastMessage}</p>
                {convo.unread > 0 && (
                    <Badge className="bg-brand-green text-white h-5 w-5 flex items-center justify-center p-0">{convo.unread}</Badge>
                )}
            </div>
        </div>
    </div>
);

const ConversationList = ({ onSelectConversation }) => (
    <div className="w-80">
        <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-800">Messages</h3>
        </div>
        <ScrollArea className="h-96">
            <div>
                {mockConversations.map(convo => (
                    <ConversationItem key={convo.id} convo={convo} onSelect={onSelectConversation} />
                ))}
            </div>
        </ScrollArea>
        <div className="p-2 border-t text-center">
            <Button variant="link" className="text-sm text-brand-blue">View all in Inbox</Button>
        </div>
    </div>
);

export default function TeacherMessagesDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const dropdownRef = useRef(null);

    // This hook ensures that when a chat is open and we click outside,
    // the whole dropdown closes, not just the chat view.
    useOnClickOutside(dropdownRef, () => {
        if (isOpen) {
            setIsOpen(false);
            // Delay resetting chat to avoid UI flicker
            setTimeout(() => setSelectedChat(null), 150);
        }
    });

    const handleSelectConversation = (chat) => {
        setSelectedChat(chat);
    };

    const handleBack = () => {
        setSelectedChat(null);
    };

    // When the dropdown is closed, reset the view
    const onOpenChange = (open) => {
        setIsOpen(open);
        if (!open) {
            setTimeout(() => setSelectedChat(null), 150);
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Mail size={22} />
                    <div className="absolute top-1 right-1 w-2 h-2 bg-brand-green rounded-full" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-0 w-auto" align="end" ref={dropdownRef}>
                {selectedChat ? (
                    <TeacherChatInterface chat={selectedChat} onBack={handleBack} />
                ) : (
                    <ConversationList onSelectConversation={handleSelectConversation} />
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}