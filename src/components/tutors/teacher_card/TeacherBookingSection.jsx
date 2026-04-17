import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, ExternalLink, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

const OfferAndSaveSection = ({ offer }) => {
    const [isSaved, setIsSaved] = useState(false);
    
    return (
        <div className="flex justify-between items-center">
            {offer ? <span className="offer">{offer}</span> : <div />}
            <Button 
                variant="ghost" 
                size="icon" 
                className={`text-gray-500 flex-shrink-0 transition-colors hover:text-blue-500 ${isSaved ? 'text-blue-500' : ''}`}
                onClick={() => setIsSaved(!isSaved)}
                style={{
                    borderRadius: '0px'
                }}
            >
                <Bookmark className={`h-[18px] w-[18px] transition-colors ${isSaved ? 'fill-blue-500 text-blue-500' : 'hover:stroke-blue-500'}`} />
            </Button>
        </div>
    );
};

const PricingPopup = ({ triggerText, title, onOpenChange = () => {} }) => (
    <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
            <button className="text-left w-full text-custom-secondary font-medium text-sm hover:text-brand-blue transition-colors">{triggerText}</button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <DialogDescription>This is a placeholder for the booking flow for {title}.</DialogDescription>
            <DialogFooter><Button>Continue</Button></DialogFooter>
        </DialogContent>
    </Dialog>
);

const PricingSection = ({ hourlyRate, trialUsed, onTrialBooked }) => {
    return (
        <div className="flex flex-col justify-evenly flex-grow price space-y-2">
            <PricingPopup title="Online Class" triggerText={<span>Online Class: <span className="blueTxt">{hourlyRate.online}$</span> /Hr</span>}/>
            <PricingPopup title="Consulting" triggerText={<span>Consulting: <span className="text-gray-400 line-through mr-1">{hourlyRate.originalConsulting}$</span> <span className="blueTxt">{hourlyRate.consulting}$</span> /Hr</span>}/>
            <PricingPopup title="Technical Interview" triggerText={<span>Technical Interview: <span className="blueTxt">{hourlyRate.interview}$</span> /Hr</span>}/>
            {!trialUsed && (
                <PricingPopup 
                    title="Book Trial Lesson" 
                    onOpenChange={(open) => { if(!open) onTrialBooked() }}
                    triggerText={<span>Trial Lesson: <span className="blueTxt">{hourlyRate.trial}$</span> /Hr</span>}
                />
            )}
        </div>
    )
};

const ActionButtons = ({ trialUsed }) => (
  <div className="space-y-2 w-full mt-4">
    <div className="flex items-center gap-2 w-full">
      <button className="btn-pill-outline-green w-full">
        View Profile
      </button>
      <button 
        className="flex-shrink-0 h-10 w-10 border border-gray-300 bg-white rounded-md flex items-center justify-center transition-colors"
        style={{
          borderColor: '#d1d5db'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = 'var(--color-website-green)';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#d1d5db';
        }}
      >
        <Mail className="h-4 w-4 text-gray-500" />
      </button>
    </div>
    <button className="btn-pill-green w-full">
      {trialUsed ? 'Book Now' : 'Book A Trial'}
    </button>
  </div>
);

export default function TeacherBookingSection({ teacher }) {
    const [trialUsed, setTrialUsed] = useState(false);

    return (
        <div className="h-full flex flex-col justify-between overflow-hidden w-full">
            <div>
                <OfferAndSaveSection offer={teacher.offer} />
            </div>
            <div className="flex-grow flex my-4">
              <PricingSection hourlyRate={teacher.hourlyRate} trialUsed={trialUsed} onTrialBooked={() => setTrialUsed(true)} />
            </div>
            <ActionButtons trialUsed={trialUsed} />
        </div>
    );
}