import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Paperclip, Send, Info, Video, Phone, Check, CheckCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Message = ({ msg }) => {
    const isSender = msg.from === 'me';
    const readReceipts = {
        sent: <Check size={16} className="text-gray-400" />,
        delivered: <CheckCheck size={16} className="text-gray-400" />,
        read: <CheckCheck size={16} className="text-blue-500" />,
    };

    return (
        <div className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
            {!isSender && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback>{msg.name.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <div 
                className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2 ${isSender ? 'bg-brand-blue text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}
            >
                <p className="text-sm">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-xs ${isSender ? 'text-blue-100 opacity-75' : 'text-gray-500'}`}>{msg.time}</span>
                    {isSender && readReceipts[msg.status]}
                </div>
            </div>
        </div>
    );
};

export default function TeacherChatInterface({ chat, onBack }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState(chat.messages);
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }
    }, [messages]);

    const handleSend = () => {
        if (!message.trim()) return;
        const newMessage = {
            id: messages.length + 1,
            from: 'me',
            text: message,
            time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
            status: 'sent',
        };
        setMessages([...messages, newMessage]);
        setMessage('');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log("Uploading file:", file.name);
            // Mock sending file as a message
            const newMessage = {
                id: messages.length + 1,
                from: 'me',
                text: `File: ${file.name}`,
                time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()),
                status: 'sent',
            };
            setMessages([...messages, newMessage]);
        }
    };

    return (
        <div className="w-[400px] h-[550px] flex flex-col bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
                        <ArrowLeft size={18} />
                    </Button>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={chat.avatar} />
                        <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                        <div className="flex items-center gap-1">
                            <p className="font-semibold text-sm text-gray-800">{chat.name}</p>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="h-4 w-4 bg-gray-200 text-gray-600 text-xs rounded-full flex items-center justify-center">i</button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Student since: {new Date().getFullYear()}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <p className="text-xs text-gray-500">It's {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date())} for {chat.name}</p>
                    </div>
                </div>
                <div className="flex items-center justify-start gap-2 text-sm text-gray-600 mt-2 pl-10 border-t pt-2">
                    <a href="#" className="hover:text-brand-blue">Book for Student</a>
                    <a href="#" className="hover:text-brand-blue">Buy Packages</a>
                    <div className="flex-grow" />
                    <a href="#" className="hover:text-brand-blue"><Video size={16} /></a>
                    <a href="#" className="hover:text-brand-blue"><Phone size={16} /></a>
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    <div className="text-center text-xs text-gray-400">12 September 2023</div>
                    {messages.map((msg) => (
                        <Message key={msg.id} msg={msg} />
                    ))}
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-gray-50 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={20} />
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <Input 
                    placeholder="Type your message..."
                    className="flex-grow"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button size="icon" className="bg-brand-green hover:bg-brand-green-dark" onClick={handleSend}>
                    <Send size={20} />
                </Button>
            </div>
        </div>
    );
}