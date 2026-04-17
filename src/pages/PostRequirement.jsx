import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Plus, X, Calendar, Clock, DollarSign, BookOpen } from 'lucide-react';

const RequirementStep = ({ stepNumber, title, isActive = false, isCompleted = false }) => (
    <div className="flex items-center">
        <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3
            ${isActive 
                ? 'bg-brand-blue text-white' 
                : isCompleted 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
            }
        `}>
            {stepNumber}
        </div>
        <span className={`text-sm font-medium ${isActive ? 'text-brand-blue' : 'text-gray-600'}`}>
            {title}
        </span>
    </div>
);

export default function PostRequirement() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        preferredLanguages: [],
        budget: '',
        sessionType: '',
        availability: '',
        experienceLevel: '',
        duration: ''
    });

    const steps = [
        { number: 1, title: "Subject & Description" },
        { number: 2, title: "Teacher Requirements" },
        { number: 3, title: "Budget & Schedule" },
        { number: 4, title: "Review & Post" }
    ];

    const subjects = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
        'Programming', 'Web Design', 'Data Science', 'Languages', 'Music'
    ];

    const languages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
        'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
    ];

    const addLanguage = (language) => {
        if (!formData.preferredLanguages.includes(language)) {
            setFormData({
                ...formData,
                preferredLanguages: [...formData.preferredLanguages, language]
            });
        }
    };

    const removeLanguage = (language) => {
        setFormData({
            ...formData,
            preferredLanguages: formData.preferredLanguages.filter(lang => lang !== language)
        });
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = () => {
        console.log('Submitting requirement:', formData);
        // Here you would typically submit to your backend
        alert('Requirement posted successfully!');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Post Your Learning Requirement</h1>
                    <p className="text-gray-600">Tell us what you want to learn and we'll help you find the perfect teacher</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-between items-center max-w-2xl mx-auto">
                        {steps.map((step, index) => (
                            <RequirementStep 
                                key={step.number}
                                stepNumber={step.number}
                                title={step.title}
                                isActive={currentStep === step.number}
                                isCompleted={currentStep > step.number}
                            />
                        ))}
                    </div>
                </div>

                <Card className="bg-white shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-brand-blue" />
                            Step {currentStep}: {steps[currentStep - 1].title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Subject & Description */}
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What subject do you want to learn?
                                    </label>
                                    <Select onValueChange={(value) => setFormData({...formData, subject: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a subject" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {subjects.map(subject => (
                                                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Describe what you want to learn
                                    </label>
                                    <Textarea 
                                        placeholder="Tell us about your learning goals, current level, and what you want to achieve..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Teacher Requirements */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preferred Teacher Languages
                                    </label>
                                    <Select onValueChange={addLanguage}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Add a language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {languages.map(language => (
                                                <SelectItem key={language} value={language}>{language}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.preferredLanguages.map(language => (
                                            <Badge key={language} variant="secondary" className="flex items-center gap-1">
                                                {language}
                                                <button onClick={() => removeLanguage(language)}>
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Teacher Experience Level
                                    </label>
                                    <Select onValueChange={(value) => setFormData({...formData, experienceLevel: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select experience level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="beginner">Beginner Teacher (1-2 years)</SelectItem>
                                            <SelectItem value="intermediate">Experienced Teacher (3-5 years)</SelectItem>
                                            <SelectItem value="expert">Expert Teacher (5+ years)</SelectItem>
                                            <SelectItem value="any">Any Experience Level</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Budget & Schedule */}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <DollarSign className="h-4 w-4 inline mr-1" />
                                        Budget per hour (USD)
                                    </label>
                                    <Input 
                                        type="number"
                                        placeholder="e.g., 25"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Clock className="h-4 w-4 inline mr-1" />
                                        Session Type
                                    </label>
                                    <Select onValueChange={(value) => setFormData({...formData, sessionType: value})}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select session type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="one-time">One-time Session</SelectItem>
                                            <SelectItem value="weekly">Weekly Sessions</SelectItem>
                                            <SelectItem value="intensive">Intensive Course</SelectItem>
                                            <SelectItem value="flexible">Flexible Schedule</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="h-4 w-4 inline mr-1" />
                                        When are you available?
                                    </label>
                                    <Textarea 
                                        placeholder="e.g., Weekday evenings, Weekend mornings, Flexible timing..."
                                        value={formData.availability}
                                        onChange={(e) => setFormData({...formData, availability: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review & Post */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">Review Your Requirement</h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div><strong>Subject:</strong> {formData.subject}</div>
                                    <div><strong>Description:</strong> {formData.description}</div>
                                    <div><strong>Languages:</strong> {formData.preferredLanguages.join(', ')}</div>
                                    <div><strong>Budget:</strong> ${formData.budget}/hour</div>
                                    <div><strong>Session Type:</strong> {formData.sessionType}</div>
                                    <div><strong>Availability:</strong> {formData.availability}</div>
                                    <div><strong>Experience Level:</strong> {formData.experienceLevel}</div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6 border-t">
                            <Button 
                                variant="outline" 
                                onClick={prevStep}
                                disabled={currentStep === 1}
                            >
                                Previous
                            </Button>
                            {currentStep < 4 ? (
                                <Button 
                                    onClick={nextStep}
                                    className="bg-brand-blue hover:bg-brand-blue-dark"
                                >
                                    Next Step
                                </Button>
                            ) : (
                                <Button 
                                    onClick={handleSubmit}
                                    className="bg-brand-green hover:bg-brand-green-dark"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Post Requirement
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}