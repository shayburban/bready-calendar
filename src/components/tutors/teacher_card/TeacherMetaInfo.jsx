import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, ChevronDown } from 'lucide-react';

const LanguageItem = ({ lang }) => (
    <div className="w-1/4 text-center px-1">
        <img src={lang.flag} alt={lang.name} className="h-5 mx-auto mb-1" />
        <p className="text-xs leading-tight">
            {lang.name}
            <br />
            <span className="text-gray-500">{lang.level}</span>
        </p>
    </div>
);

const LanguagesSpoken = ({ languages }) => {
    const visibleLanguages = languages.slice(0, 3);
    const hiddenLanguages = languages.slice(3);

    return (
        <div className="border rounded-md p-2 mt-3">
            <h4 className="text-center font-semibold text-sm mb-2">Speaks</h4>
            <div className="flex items-start justify-center">
                {visibleLanguages.map(lang => <LanguageItem key={lang.name} lang={lang} />)}
                
                {hiddenLanguages.length > 0 && (
                    <div className="w-1/4 flex items-center justify-center pt-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="text-gray-500 hover:text-gray-800"><ChevronDown className="w-5 h-5" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {hiddenLanguages.map(lang => (
                                    <DropdownMenuItem key={lang.name} className="flex gap-2">
                                        <img src={lang.flag} alt={lang.name} className="h-4" />
                                        <span>{lang.name} ({lang.level})</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function TeacherMetaInfo({ location, languages, bio }) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                {location}
            </p>
            <LanguagesSpoken languages={languages} />
            <div className="text-xs text-gray-600 p-2 border rounded-md">
                <p className="font-bold">About me:</p>
                <p className="line-clamp-3">{bio}</p>
            </div>
        </div>
    );
}