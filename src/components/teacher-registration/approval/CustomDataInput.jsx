import React, { useState } from 'react';
import { useService } from '../ServiceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CustomDataInput = ({
    dataType,
    onSubmit,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [levelValue, setLevelValue] = useState('');
    const [proficiencyValue, setProficiencyValue] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const { subjects } = useService();

    const safeSubjects = subjects || [];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue) return;

        let payload = {};
        if (dataType === 'language') {
            payload = { language: inputValue, proficiency: proficiencyValue };
        } else if (dataType === 'subject') {
            payload = { subject: inputValue, level: levelValue };
        } else if (dataType === 'specialization') {
            payload = { specialization: inputValue, subject: selectedSubject, level: levelValue };
        } else if (dataType === 'board') {
            payload = { boardName: inputValue, subject: selectedSubject };
        } else if (dataType === 'exam') {
            payload = { examName: inputValue, subject: selectedSubject };
        }

        if (typeof onSubmit === 'function') {
            onSubmit(payload);
        } else {
            console.error(`CustomDataInput Error: onSubmit prop is not a function for dataType='${dataType}'.`);
        }
        
        setInputValue('');
        setLevelValue('');
        setProficiencyValue('');
        setSelectedSubject('');
    };
    
    const triggerText = `Did not find your ${dataType}? Click here.`;
    const submitButtonText = `Submit Custom ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`;

    const getFields = () => {
        const nameLabel = `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Name`;
        const namePlaceholder = `e.g., Your custom ${dataType}`;
        
        switch (dataType) {
            case 'language':
                return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="language-name" className="text-xs">Language Name</Label>
                            <Input id="language-name" placeholder="e.g., Mandarin" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="language-proficiency" className="text-xs">Proficiency Level</Label>
                            <Input id="language-proficiency" placeholder="e.g., Native" value={proficiencyValue} onChange={(e) => setProficiencyValue(e.target.value)} />
                        </div>
                    </>
                );

            case 'subject':
                return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="subject-name" className="text-xs">Subject Name</Label>
                            <Input id="subject-name" placeholder={namePlaceholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="subject-level" className="text-xs">Level</Label>
                            <Input id="subject-level" placeholder="e.g., Advanced" value={levelValue} onChange={(e) => setLevelValue(e.target.value)} />
                        </div>
                    </>
                );
            
            case 'specialization':
                 return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="specialization-name" className="text-xs">Specialization Name</Label>
                            <Input id="specialization-name" placeholder={namePlaceholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="specialization-level" className="text-xs">Level</Label>
                            <Input id="specialization-level" placeholder="e.g., Expert" value={levelValue} onChange={(e) => setLevelValue(e.target.value)} />
                        </div>
                         <div className="space-y-1 md:col-span-2">
                            <Label htmlFor="specialization-subject-select" className="text-xs">Related Subject</Label>
                            <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                                <SelectTrigger id="specialization-subject-select">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeSubjects.map(sub => (
                                        <SelectItem key={sub.id} value={sub.subName}>{sub.subName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            case 'board':
                 return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="board-name" className="text-xs">Board Name</Label>
                            <Input id="board-name" placeholder={namePlaceholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="board-subject-select" className="text-xs">Related Subject</Label>
                            <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                                <SelectTrigger id="board-subject-select">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeSubjects.map(sub => (
                                        <SelectItem key={sub.id} value={sub.subName}>{sub.subName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            case 'exam':
                 return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="exam-name" className="text-xs">Exam Name</Label>
                            <Input id="exam-name" placeholder={namePlaceholder} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="exam-subject-select" className="text-xs">Related Subject</Label>
                            <Select onValueChange={setSelectedSubject} value={selectedSubject}>
                                <SelectTrigger id="exam-subject-select">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeSubjects.map(sub => (
                                        <SelectItem key={sub.id} value={sub.subName}>{sub.subName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );

            default:
                return (
                     <div className="space-y-1">
                        <Label htmlFor={`${dataType}-name-input`} className="text-xs">{nameLabel}</Label>
                        <Input
                            id={`${dataType}-name-input`}
                            type="text"
                            placeholder={namePlaceholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                    </div>
                );
        }
    };

    return (
        <Accordion type="single" collapsible className="w-full mt-2">
            <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="flex flex-1 items-center justify-between font-medium transition-all [&[data-state=open]>svg]:rotate-180 text-xs text-blue-600 hover:text-blue-800 py-1 no-underline hover:no-underline">
                    {triggerText}
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 bg-white rounded-md border mt-2">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {getFields()}
                            </div>
                            <Button type="submit" disabled={!inputValue} size="sm">
                                <Send className="w-3 h-3 mr-2" />
                                {submitButtonText}
                            </Button>
                        </form>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

export default CustomDataInput;