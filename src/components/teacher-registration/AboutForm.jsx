import React, { useState, useEffect } from 'react';
import { useTeacher } from './TeacherContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

const AboutForm = () => {
    const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();
    const [englishBio, setEnglishBio] = useState(personalInfo.bio || '');
    const [localLanguageBio, setLocalLanguageBio] = useState(personalInfo.localLanguageBio || '');
    const [activeTab, setActiveTab] = useState('english');
    const [agreedToTerms, setAgreedToTerms] = useState(true);

    const MAX_LENGTH = 1000;
    const MIN_LENGTH = 50;

    useEffect(() => {
        // Update the main bio field based on active tab
        if (activeTab === 'english') {
            setPersonalInfo(prev => ({ ...prev, bio: englishBio }));
        } else {
            setPersonalInfo(prev => ({ ...prev, localLanguageBio: localLanguageBio }));
        }
    }, [englishBio, localLanguageBio, activeTab, setPersonalInfo]);

    const handleBioChange = (value, language) => {
        if (value.length <= MAX_LENGTH) {
            if (language === 'english') {
                setEnglishBio(value);
            } else {
                setLocalLanguageBio(value);
            }
            // Clear error if minimum length is met
            if (value.length >= MIN_LENGTH) {
                setErrors(prev => ({ ...prev, bio: null }));
            }
        }
    };

    const getCharacterCountColor = (count) => {
        const changeColorThreshold = 0.75 * MAX_LENGTH;
        if (count >= MAX_LENGTH) {
            return 'text-red-600 font-bold';
        } else if (count > changeColorThreshold) {
            return 'text-orange-500 font-bold';
        }
        return 'text-gray-500';
    };

    const getCurrentBio = () => {
        return activeTab === 'english' ? englishBio : localLanguageBio;
    };

    const getCurrentCount = () => {
        return getCurrentBio().length;
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-2xl">About</CardTitle>
                <p className="text-gray-600">
                    Describe yourself in English is a <strong>must</strong>.
                </p>
            </CardHeader>
            <CardContent className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Profile Photo */}
                    <div className="lg:col-span-4 flex justify-center">
                        <Avatar className="w-48 h-48 border-4 border-gray-200 shadow-lg">
                            <AvatarImage 
                                src={personalInfo.profilePicture} 
                                alt="Profile Photo" 
                                className="object-cover"
                            />
                            <AvatarFallback className="bg-gray-100">
                                <User className="w-24 h-24 text-gray-400" />
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    {/* Right Column: Bio Form */}
                    <div className="lg:col-span-8">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="english" className="text-sm">
                                    English
                                </TabsTrigger>
                                <TabsTrigger value="local" className="text-sm">
                                    Local Language
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="english" className="space-y-4">
                                <h3 className="text-lg font-semibold">Introduce Yourself</h3>
                                
                                <div className="flex items-start space-x-2 mb-4">
                                    <Checkbox 
                                        id="terms-english"
                                        checked={agreedToTerms}
                                        onCheckedChange={setAgreedToTerms}
                                        className="mt-1"
                                    />
                                    <label 
                                        htmlFor="terms-english" 
                                        className="text-sm text-gray-600 leading-relaxed"
                                    >
                                        Don't share contact information like phone number, email etc. 
                                        It is forbidden by the platform.
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <Textarea
                                        value={englishBio}
                                        onChange={(e) => handleBioChange(e.target.value, 'english')}
                                        placeholder="Please write about yourself and what makes you a good teacher in the selected language"
                                        className="min-h-[120px] resize-none"
                                        maxLength={MAX_LENGTH}
                                    />
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="space-x-4">
                                            <span className={getCharacterCountColor(englishBio.length)}>
                                                {englishBio.length}
                                            </span>
                                            <span className="text-gray-500">/ {MAX_LENGTH}</span>
                                            <span className="text-gray-500 ml-4">Minimum {MIN_LENGTH}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="local" className="space-y-4">
                                <h3 className="text-lg font-semibold">Introduce Yourself</h3>
                                
                                <div className="flex items-start space-x-2 mb-4">
                                    <Checkbox 
                                        id="terms-local"
                                        checked={agreedToTerms}
                                        onCheckedChange={setAgreedToTerms}
                                        className="mt-1"
                                    />
                                    <label 
                                        htmlFor="terms-local" 
                                        className="text-sm text-gray-600 leading-relaxed"
                                    >
                                        Don't share contact information like phone number, email etc. 
                                        It is forbidden by the platform.
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <Textarea
                                        value={localLanguageBio}
                                        onChange={(e) => handleBioChange(e.target.value, 'local')}
                                        placeholder="Please write about yourself and what makes you a good teacher in the selected language"
                                        className="min-h-[120px] resize-none"
                                        maxLength={MAX_LENGTH}
                                    />
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="space-x-4">
                                            <span className={getCharacterCountColor(localLanguageBio.length)}>
                                                {localLanguageBio.length}
                                            </span>
                                            <span className="text-gray-500">/ {MAX_LENGTH}</span>
                                            <span className="text-gray-500 ml-4">Minimum {MIN_LENGTH}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {errors.bio && (
                            <p className="text-red-500 text-sm mt-2">{errors.bio}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AboutForm;