import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ServiceTag = ({ name, href, tooltip }) => (
    <div className="relative group">
        <Link to={createPageUrl(href)} className="text-white bg-black bg-opacity-20 px-3 py-1 rounded-full text-sm hover:bg-opacity-40 transition-all">
            {name}
        </Link>
        <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {tooltip}
        </div>
    </div>
);

export default function HeroSection() {
    return (
        <div className="relative text-white">
            {/* You can replace this with your own banner image after uploading it. */}
            <img src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2070&auto=format&fit=crop" alt="Banner" className="w-full h-[500px] object-cover" />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center p-4">
                    <h1 className="text-4xl md:text-6xl font-bold mb-2">Find The Perfect Online Teacher</h1>
                    <h3 className="text-xl md:text-2xl font-light text-gray-200 mb-8">To Receive The Best Solution</h3>
                    
                    <div className="bg-white rounded-lg shadow-lg p-2 max-w-2xl mx-auto flex items-center gap-2">
                        <Input 
                            type="text" 
                            placeholder="Search a subject or keyword" 
                            className="flex-grow border-none focus:ring-0 text-gray-700" 
                        />
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px] border-none focus:ring-0 text-gray-500">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Services</SelectItem>
                                <SelectItem value="online-class">Online Class</SelectItem>
                                <SelectItem value="consulting">Consulting</SelectItem>
                                <SelectItem value="interview">Technical Interview</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button size="icon" className="bg-brand-blue hover:bg-brand-blue-dark">
                            <Search className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
                        <span className="text-gray-300">Our Services:</span>
                        <ServiceTag name="Online Class" href="FindTutors" tooltip="Private online lessons with video." />
                        <ServiceTag name="Consulting" href="FindTutors" tooltip="Consult with a teacher about your problem." />
                        <ServiceTag name="Technical Interview" href="FindTutors" tooltip="Prepare for a job interview in a professional way." />
                    </div>
                </div>
            </div>
        </div>
    );
}