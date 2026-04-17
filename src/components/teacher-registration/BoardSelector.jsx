import React, { useState } from 'react';
import { useTeacher } from './TeacherContext';
import { useService } from './ServiceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, X, Plus, GraduationCap, Check } from 'lucide-react';
import CustomDataInput from './approval/CustomDataInput';
import ApprovalStatusIndicator from './approval/ApprovalStatusIndicator';

const BoardSelector = () => {
  const { allBoards, dispatchAllBoards, currentBoard, dispatchCurrentBoard } = useTeacher();
  const { boards: predefinedBoards, subjects: predefinedSubjects } = useService();
  const [openBoard, setOpenBoard] = useState(false);
  const [openSubject, setOpenSubject] = useState(false);

  // Safe data with null checks
  const safeBoards = predefinedBoards || [];
  const safeSubjects = predefinedSubjects || [];
  const safeAllBoards = allBoards || [];

  const addBoard = () => {
    if (currentBoard?.boardName && currentBoard?.subject) {
      const newBoard = {
        ...currentBoard,
        id: Date.now().toString()
      };
      
      dispatchAllBoards({ type: 'ADD_BOARD', payload: newBoard });
      dispatchCurrentBoard({ type: 'RESET' });
      setOpenBoard(false);
      setOpenSubject(false);
    }
  };

  const addCustomBoard = (customData) => {
    const newBoard = {
      boardName: customData.board,
      subject: customData.subject,
      id: Date.now().toString(),
      isCustom: true,
      status: 'pending'
    };
    dispatchAllBoards({ type: 'ADD_BOARD', payload: newBoard });
  };
  
  const removeBoard = (boardToRemove) => {
    dispatchAllBoards({ type: 'REMOVE_BOARD', payload: boardToRemove.id });
  };

  return (
    <div className="p-4 border rounded-md bg-gray-50/50">
      <h3 className="text-lg font-semibold text-gray-700">Board</h3>
      <p className="text-xs text-gray-500 mb-2">e.g., CBSE, ICSE, IB</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[180px]">
          <Label className="text-xs">Select Board</Label>
          <Popover open={openBoard} onOpenChange={setOpenBoard}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between">
                {currentBoard?.boardName || "Select Board..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search board..." />
                <CommandList>
                  <CommandEmpty>No board found.</CommandEmpty>
                  <CommandGroup>
                    {safeBoards.map((board) => (
                      board && board.id ? (
                        <CommandItem
                          key={board.id}
                          value={board.board || ''}
                          onSelect={(currentValue) => {
                            dispatchCurrentBoard({ type: 'SET_BOARD', payload: currentValue });
                            setOpenBoard(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${currentBoard?.boardName === board.board ? "opacity-100" : "opacity-0"}`} />
                          {board.board || 'Unknown Board'}
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
              <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!currentBoard?.boardName}>
                {currentBoard?.subject || "Select Subject..."}
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
                            dispatchCurrentBoard({ type: 'SET_SUBJECT', payload: currentValue });
                            setOpenSubject(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${currentBoard?.subject === subject.subName ? "opacity-100" : "opacity-0"}`} />
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
        
        <Button onClick={addBoard} disabled={!currentBoard?.boardName || !currentBoard?.subject}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>
      
      <CustomDataInput
        dataType="board"
        onAdd={addCustomBoard}
        fields={[
          { name: 'board', label: 'Board Name', placeholder: 'e.g., State Board' },
          { name: 'subject', label: 'Related Subject', placeholder: 'e.g., Mathematics' }
        ]}
        triggerText="Did not find your board? Click here."
        buttonText="Submit Custom Board"
      />

      <div className="mt-4 space-y-2">
        {safeAllBoards.map((board) => (
          board && board.id ? (
            <Badge key={board.id} variant="secondary" className="flex items-center justify-between w-full p-2">
              <span>{board.boardName || 'Unknown'} - {board.subject || 'Unknown'}</span>
              <div className="flex items-center gap-2">
                {board.isCustom && <ApprovalStatusIndicator status={board.status} />}
                <button
                  onClick={() => removeBoard(board)}
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

export default BoardSelector;