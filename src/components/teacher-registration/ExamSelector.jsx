import React, { useState } from 'react';
import { useTeacher } from './TeacherContext';
import { useService } from './ServiceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, X, Plus, FileText, Check } from 'lucide-react';
import CustomDataInput from './approval/CustomDataInput';
import ApprovalStatusIndicator from './approval/ApprovalStatusIndicator';

const ExamSelector = () => {
  const { allExams, dispatchAllExams, currentExam, dispatchCurrentExam } = useTeacher();
  const { exams: predefinedExams, subjects: predefinedSubjects } = useService();
  const [openExam, setOpenExam] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);

  // Safe data with null checks
  const safeExams = predefinedExams || [];
  const safeSubjects = predefinedSubjects || [];
  const safeAllExams = allExams || [];

  const addExam = () => {
    if (currentExam?.examName && currentExam?.subject) {
      const newExam = {
        ...currentExam,
        id: Date.now().toString()
      };
      
      dispatchAllExams({ type: 'ADD_EXAM', payload: newExam });
      dispatchCurrentExam({ type: 'RESET' });
      setOpenExam(false);
      setOpenSubject(false);
    }
  };

  const addCustomExam = (customData) => {
    const newExam = {
      examName: customData.exam,
      subject: customData.subject,
      id: Date.now().toString(),
      isCustom: true,
      status: 'pending'
    };
    dispatchAllExams({ type: 'ADD_EXAM', payload: newExam });
  };

  const removeExam = (examToRemove) => {
    dispatchAllExams({ type: 'REMOVE_EXAM', payload: examToRemove.id });
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50/50">
      <h3 className="text-lg font-semibold text-gray-700">Competitive Exams</h3>
      <p className="text-xs text-gray-500 mb-2">e.g., JEE, NEET, SAT</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs">Select Exam</Label>
          <Popover open={openExam} onOpenChange={setOpenExam}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {currentExam?.examName || "Select Exam..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search exam..." />
                <CommandList>
                  <CommandEmpty>No exam found.</CommandEmpty>
                  <CommandGroup>
                    {safeExams.map((exam) => (
                      exam && exam.id ? (
                        <CommandItem
                          key={exam.id}
                          value={exam.exam || ''}
                          onSelect={(currentValue) => {
                            dispatchCurrentExam({ type: 'SET_EXAM', payload: currentValue });
                            setOpenExam(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${currentExam?.examName === exam.exam ? "opacity-100" : "opacity-0"}`} />
                          {exam.exam || 'Unknown Exam'}
                        </CommandItem>
                      ) : null
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs">Select Subject</Label>
          <Popover open={openSubject} onOpenChange={setOpenSubject}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!currentExam?.examName}>
                {currentExam?.subject || "Select Subject..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search subject..." />
                <CommandList>
                  <CommandEmpty>No subject found.</CommandEmpty>
                  <CommandGroup>
                    {safeSubjects.map((subject) => (
                      subject && subject.id ? (
                        <CommandItem
                          key={subject.id}
                          value={subject.subName || ''}
                          onSelect={(currentValue) => {
                            dispatchCurrentExam({ type: 'SET_SUBJECT', payload: currentValue });
                            setOpenSubject(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${currentExam?.subject === subject.subName ? "opacity-100" : "opacity-0"}`} />
                          {subject.subName || 'Unknown Subject'}
                        </CommandItem>
                      ) : null
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={addExam} disabled={!currentExam?.examName || !currentExam?.subject}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      <CustomDataInput
        dataType="exam"
        onAdd={addCustomExam}
        fields={[
          { name: 'exam', label: 'Exam Name', placeholder: 'e.g., Olympiad' },
          { name: 'subject', label: 'Related Subject', placeholder: 'e.g., Science' }
        ]}
        triggerText="Did not find your exam? Click here."
        buttonText="Submit Custom Exam"
      />

      <div className="mt-4 space-y-2">
        {safeAllExams.map((exam) => (
          exam && exam.id ? (
            <Badge key={exam.id} variant="secondary" className="flex items-center justify-between w-full p-2">
              <span>{exam.examName || 'Unknown'} - {exam.subject || 'Unknown'}</span>
              <div className="flex items-center gap-2">
                {exam.isCustom && <ApprovalStatusIndicator status={exam.status} />}
                <button
                  onClick={() => removeExam(exam)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </Badge>
          ) : null
        ))}
      </div>
    </div>
  );
};

export default ExamSelector;