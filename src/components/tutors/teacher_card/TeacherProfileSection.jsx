import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Star, ChevronDown, Info, BookOpen, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SubjectsDropdown = ({ subjects }) => {
    if (!subjects || subjects.length === 0) return null;
    const mainSubject = subjects[0];
    const otherSubjects = subjects.slice(1);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 text-gray-800 font-normal text-base hover:bg-transparent">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                    {mainSubject.name}
                    {otherSubjects.length > 0 && <ChevronDown className="h-4 w-4 ml-1" />}
                </Button>
            </DropdownMenuTrigger>
            {otherSubjects.length > 0 && (
                <DropdownMenuContent align="start">
                    {otherSubjects.map((sub, index) => (
                         <DropdownMenuItem key={index} className="text-sm">
                            <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                            {sub.name} ({sub.level})
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            )}
        </DropdownMenu>
    );
};

const ProfileInfo = ({ teacher }) => (
  <div className="flex items-start mb-4">
    <div className="flex-shrink-0 mr-3 relative">
      <a href="#">
        <img
          src={teacher.profileImage}
          alt={teacher.name}
          className="w-16 h-16 rounded-full object-cover shadow border-2 border-white"
        />
        <div className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-white" style={{ bottom: '2px', right: '2px' }}></div>
      </a>
    </div>
    <div className="flex-grow">
      <div className="flex items-center mb-1">
        <h3 className="text-xl font-semibold text-gray-900"><a href="#" className="hover:underline">{teacher.name}</a></h3>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                        <Info className="h-4 w-4 text-gray-400" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Detailed teacher information here.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>

      <div className="my-1">
        <SubjectsDropdown subjects={teacher.subjects} />
      </div>

      <div className="flex items-center text-sm mb-1">
        <span className="font-bold mr-1">{teacher.rating.toFixed(1)}</span>
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-gray-500 ml-2">({teacher.reviews} reviews)</span>
      </div>

      {teacher.tag && (
        <h3 className="text-top-rated mt-1">
          {teacher.tag}
        </h3>
      )}
    </div>
  </div>
);

const LanguagesGrid = ({ languages }) => {
  const visibleLanguages = languages.slice(0, 3);
  const overflowLanguages = languages.slice(3);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hasOverflow = overflowLanguages.length > 0;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Speaks</h4>
      <div className="relative">
        <div className="flex items-start" style={{ gap: '40px' }}>
          <div className="flex-grow flex items-start justify-start" style={{ gap: '40px' }}>
            {visibleLanguages.map((lang, index) => (
              <div key={index} className="text-center flex-shrink-0">
                <img src={lang.flag} alt={lang.name} className="w-6 h-4 mx-auto mb-1 rounded-sm" />
                <p className="text-xs text-gray-600">{lang.name}</p>
                <p className="text-xs text-gray-500">{lang.level}</p>
              </div>
            ))}
          </div>

          {hasOverflow && (
            <div className="absolute right-0 top-0">
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-1 text-xs"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-max fixed" 
                  sideOffset={5}
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  {overflowLanguages.map((lang, index) => (
                    <DropdownMenuItem key={index} className="flex items-center gap-2 py-2 border-b last:border-b-0">
                      <img src={lang.flag} alt={lang.name} className="w-4 h-3 rounded-sm" />
                      <span className="text-sm">{lang.name} ({lang.level})</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DescriptionSection = ({ teacher, expanded, onToggle }) => {
    const isLongBio = teacher.bio.length > 120;
    const words = teacher.bio.split(' ');
    const firstLineWords = Math.floor(words.length * 0.3);
    const firstLineText = words.slice(0, firstLineWords).join(' ');

    return (
        <div className="overflow-hidden">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <div className="text-sm text-gray-600 leading-relaxed relative">
                <AnimatePresence mode="wait">
                    {expanded ? (
                        <motion.div
                            key="expanded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pr-8"
                        >
                            <label className="tab-label">
                                {teacher.bio}
                            </label>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="collapsed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="pr-8"
                        >
                            <label className="tab-label">
                                {firstLineText}
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
                {isLongBio && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggle}
                        className="description-btn absolute right-0 top-0 p-0 h-auto inline-flex items-center"
                    >
                        {expanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default function TeacherProfileSection({ teacher, expandedDescription, onToggleDescription }) {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <ProfileInfo teacher={teacher} />
            <LanguagesGrid languages={teacher.languages} />
            <DescriptionSection
                teacher={teacher}
                expanded={expandedDescription}
                onToggle={onToggleDescription}
            />
        </div>
    );
}