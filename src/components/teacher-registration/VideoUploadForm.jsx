import React, { useState } from 'react';
import { useTeacher } from './TeacherContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Video, Play } from 'lucide-react';

const VideoTipsList = ({ title, tips }) => (
    <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <ul className="space-y-3">
            {tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-gray-400 mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-600 text-sm leading-relaxed">{tip}</span>
                </li>
            ))}
        </ul>
    </div>
);

const ExampleLink = ({ title, href = "#" }) => (
    <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Examples</h3>
        <a 
            href={href} 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            onClick={(e) => e.preventDefault()}
        >
            <Video className="w-4 h-4 mr-2" />
            {title}
        </a>
    </div>
);

const VideoUploadForm = () => {
    const { personalInfo, setPersonalInfo, errors, setErrors } = useTeacher();
    const [introVideoLink, setIntroVideoLink] = useState(personalInfo.videoIntro || '');
    const [demoVideoLink, setDemoVideoLink] = useState(personalInfo.demoVideo || '');
    const [acceptTermsIntro, setAcceptTermsIntro] = useState(true);
    const [skipIntroVideo, setSkipIntroVideo] = useState(false);
    const [acceptTermsDemo, setAcceptTermsDemo] = useState(true);
    const [skipDemoVideo, setSkipDemoVideo] = useState(false);

    const handleIntroVideoChange = (value) => {
        setIntroVideoLink(value);
        setPersonalInfo(prev => ({ ...prev, videoIntro: value }));
        // Clear any existing errors
        if (errors.video) {
            setErrors(prev => ({ ...prev, video: null }));
        }
    };

    const handleDemoVideoChange = (value) => {
        setDemoVideoLink(value);
        setPersonalInfo(prev => ({ ...prev, demoVideo: value }));
    };

    const introVideoTips = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Donec sit amet ex ac ex porttitor dictum.",
        "Aenean facilisis mi ac justo porttitor, in malesuada .",
        "Nam malesuada ligula quis dolor venenatis vehicula.",
        "Aenean malesuada nibh at luctus erat vulputate.",
        "Divamus nec magna id risus laoreet rutrum sit amet eu purus."
    ];

    const demoVideoTips = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        "Donec sit amet ex ac ex porttitor dictum.",
        "Aenean facilisis mi ac justo porttitor, in malesuada .",
        "Nam malesuada ligula quis dolor venenatis vehicula.",
        "Aenean malesuada nibh at luctus erat vulputate.",
        "Divamus nec magna id risus laoreet rutrum sit amet eu purus."
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column: Video Upload Forms */}
            <div className="space-y-6">
                {/* Introduction Video Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl text-gray-800">Introduction Video</CardTitle>
                        <h3 className="text-base font-semibold text-gray-700 mt-2">Paste A Link To Your Video</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Post your introduction video to get better chance of acceptance to our community.
                            Do about 2 minutes introduction about yourself and what you teach in English.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            value={introVideoLink}
                            onChange={(e) => handleIntroVideoChange(e.target.value)}
                            placeholder="Paste Your Link Here"
                            className="w-full"
                        />
                        
                        <div className="space-y-3">
                            <div className="flex items-start space-x-2">
                                <Checkbox 
                                    id="accept-terms-intro"
                                    checked={acceptTermsIntro}
                                    onCheckedChange={setAcceptTermsIntro}
                                    className="mt-1"
                                />
                                <label htmlFor="accept-terms-intro" className="text-sm text-gray-600">
                                    Accept{' '}
                                    <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()}>
                                        Terms and Conditions
                                    </a>
                                </label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                                <Checkbox 
                                    id="skip-intro-video"
                                    checked={skipIntroVideo}
                                    onCheckedChange={setSkipIntroVideo}
                                    className="mt-1"
                                />
                                <label htmlFor="skip-intro-video" className="text-sm text-gray-600 leading-relaxed">
                                    Skip Introduction video. We recommend not to skip introduction video, as you will
                                    have better chances to book students.
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Demo Video Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl text-gray-800">Demo Video</CardTitle>
                        <h3 className="text-base font-semibold text-gray-700 mt-2">Paste A Link To Your Video</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Post your lesson to get better chance of acceptance to our community. Do about
                            30 minutes (max. 45 min.) online lesson and add it to your profile registration form.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            value={demoVideoLink}
                            onChange={(e) => handleDemoVideoChange(e.target.value)}
                            placeholder="Paste Your Link Here"
                            className="w-full"
                        />
                        
                        <div className="space-y-3">
                            <div className="flex items-start space-x-2">
                                <Checkbox 
                                    id="accept-terms-demo"
                                    checked={acceptTermsDemo}
                                    onCheckedChange={setAcceptTermsDemo}
                                    className="mt-1"
                                />
                                <label htmlFor="accept-terms-demo" className="text-sm text-gray-600">
                                    Accept{' '}
                                    <a href="#" className="text-blue-600 hover:underline" onClick={(e) => e.preventDefault()}>
                                        Terms and Conditions
                                    </a>
                                </label>
                            </div>
                            
                            <div className="flex items-start space-x-2">
                                <Checkbox 
                                    id="skip-demo-video"
                                    checked={skipDemoVideo}
                                    onCheckedChange={setSkipDemoVideo}
                                    className="mt-1"
                                />
                                <label htmlFor="skip-demo-video" className="text-sm text-gray-600 leading-relaxed">
                                    Skip Demo video. We recommend not to skip Demo video, as you will
                                    have better chances to book students.
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Tips and Examples */}
            <div className="space-y-8">
                <VideoTipsList 
                    title="Tips For A Successful Introduction Video"
                    tips={introVideoTips}
                />
                
                <ExampleLink title="Example-1" />
                
                <VideoTipsList 
                    title="Tips For A Successful Lesson Video"
                    tips={demoVideoTips}
                />
                
                <ExampleLink title="Example-2" />
            </div>

            {/* Error Display */}
            {errors.video && (
                <div className="col-span-full">
                    <p className="text-red-500 text-sm">{errors.video}</p>
                </div>
            )}
        </div>
    );
};

export default VideoUploadForm;