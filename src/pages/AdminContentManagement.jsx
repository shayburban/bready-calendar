
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  Video, 
  Save, 
  Plus, 
  Trash2, 
  Edit3,
  Eye,
  Upload,
  Shield,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import TabSelector from '../components/common/TabSelector';

export default function AdminContentManagement() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('photo-guidelines');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, section: '', changes: [] });

  // Photo Guidelines State
  const [photoGuidelines, setPhotoGuidelines] = useState({
    rules: [
      {
        id: 1,
        text: "Use a clear, professional headshot with good lighting and minimal background distractions.",
        examples: {
          enabled: true,
          items: [
            { type: 'good', description: 'Professional headshot with clean background' },
            { type: 'bad', description: 'Poor lighting or distracting background' },
            { type: 'bad', description: 'Unprofessional angle or appearance' }
          ]
        }
      },
      {
        id: 2,
        text: "Ensure your face is well lit and unobstructed (no sunglasses) for best results.",
        examples: {
          enabled: true,
          items: [
            { type: 'good', description: 'Clear, well-lit face' },
            { type: 'bad', description: 'Face obscured by sunglasses' },
            { type: 'bad', description: 'Poor lighting or shadows' }
          ]
        }
      }
    ],
    fileRequirements: {
      formats: "JPG/PNG/WEBP",
      maxSize: "5 MB",
      recommendations: "Use high-resolution images for best quality"
    }
  });

  // Video Guidelines State
  const [videoGuidelines, setVideoGuidelines] = useState({
    introVideoTips: [
      "Keep your introduction concise and engaging (30-60 seconds)",
      "Speak clearly and at a moderate pace",
      "Highlight your expertise and teaching approach", 
      "Ensure good lighting and audio quality",
      "Maintain eye contact with the camera",
      "End with an encouraging call-to-action"
    ],
    lessonVideoTips: [
      "Structure your lessons with clear learning objectives",
      "Use visual aids and examples to illustrate concepts",
      "Engage students with interactive questions",
      "Maintain energy and enthusiasm throughout", 
      "Summarize key points at the end",
      "Provide actionable next steps for students"
    ],
    examples: [
      {
        id: 'example-1',
        title: 'Introduction Video Example',
        description: 'Professional teacher introduction showcasing expertise',
        enabled: true
      },
      {
        id: 'example-2', 
        title: 'Lesson Video Example',
        description: 'Well-structured lesson with clear explanations',
        enabled: true
      }
    ],
    fileRequirements: {
      formats: "MP4/MOV/AVI",
      maxSize: "100 MB",
      duration: "30 seconds - 5 minutes recommended",
      quality: "720p minimum, 1080p preferred"
    }
  });

  const contentTabs = [
    {
      label: 'Photo Guidelines (Step 2)',
      value: 'photo-guidelines',
      icon: <Camera className="w-4 h-4" />,
    },
    {
      label: 'Video Guidelines (Step 4)',
      value: 'video-guidelines',
      icon: <Video className="w-4 h-4" />,
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin' && !(currentUser.roles && currentUser.roles.includes('admin'))) {
          window.location.href = '/';
          return;
        }
        setUser(currentUser);
      } catch (e) {
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSaveSection = (section) => {
    setConfirmDialog({
      open: true,
      section: section,
      changes: [`Updated ${section} content and guidelines`]
    });
  };

  const confirmSave = async () => {
    setSaving(true);
    setConfirmDialog({ open: false, section: '', changes: [] });
    
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you'd save to your backend/entity here
    console.log('Saved content configuration:', {
      photoGuidelines,
      videoGuidelines
    });
    
    setSaving(false);
  };

  const addPhotoRule = () => {
    const newRule = {
      id: Date.now(),
      text: "New photo guideline rule",
      examples: {
        enabled: false,
        items: []
      }
    };
    setPhotoGuidelines(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  };

  const removePhotoRule = (id) => {
    setPhotoGuidelines(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== id)
    }));
  };

  const updatePhotoRule = (id, field, value) => {
    setPhotoGuidelines(prev => ({
      ...prev,
      rules: prev.rules.map(rule =>
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const addVideoTip = (section) => {
    if (section === 'intro') {
      setVideoGuidelines(prev => ({
        ...prev,
        introVideoTips: [...prev.introVideoTips, "New tip for introduction videos"]
      }));
    } else {
      setVideoGuidelines(prev => ({
        ...prev,
        lessonVideoTips: [...prev.lessonVideoTips, "New tip for lesson videos"]
      }));
    }
  };

  const updateVideoTip = (section, index, value) => {
    if (section === 'intro') {
      setVideoGuidelines(prev => ({
        ...prev,
        introVideoTips: prev.introVideoTips.map((tip, i) => i === index ? value : tip)
      }));
    } else {
      setVideoGuidelines(prev => ({
        ...prev,
        lessonVideoTips: prev.lessonVideoTips.map((tip, i) => i === index ? value : tip)
      }));
    }
  };

  const removeVideoTip = (section, index) => {
    if (section === 'intro') {
      setVideoGuidelines(prev => ({
        ...prev,
        introVideoTips: prev.introVideoTips.filter((_, i) => i !== index)
      }));
    } else {
      setVideoGuidelines(prev => ({
        ...prev,
        lessonVideoTips: prev.lessonVideoTips.filter((_, i) => i !== index)
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content & Media Management</h1>
                <p className="text-gray-600">Manage guidelines, tips, and content for teacher registration</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <TabSelector
            tabs={contentTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>
        
        {activeTab === 'photo-guidelines' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photo Upload Guidelines - Step 2
                  </CardTitle>
                  <Button 
                    onClick={() => handleSaveSection('Photo Guidelines')}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo Rules */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Photo Rules</h3>
                    <Button onClick={addPhotoRule} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {photoGuidelines.rules.map((rule, index) => (
                      <Card key={rule.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 mr-3">
                              <Textarea
                                value={rule.text}
                                onChange={(e) => updatePhotoRule(rule.id, 'text', e.target.value)}
                                placeholder="Enter rule text..."
                                className="min-h-[60px]"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removePhotoRule(rule.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rule.examples.enabled}
                              onChange={(e) => updatePhotoRule(rule.id, 'examples', {
                                ...rule.examples,
                                enabled: e.target.checked
                              })}
                            />
                            <span className="text-sm text-gray-600">Show "View Photo Examples" link</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* File Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">File Requirements</h3>
                  <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Supported Formats</label>
                        <Input
                          value={photoGuidelines.fileRequirements.formats}
                          onChange={(e) => setPhotoGuidelines(prev => ({
                            ...prev,
                            fileRequirements: { ...prev.fileRequirements, formats: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Maximum File Size</label>
                        <Input
                          value={photoGuidelines.fileRequirements.maxSize}
                          onChange={(e) => setPhotoGuidelines(prev => ({
                            ...prev,
                            fileRequirements: { ...prev.fileRequirements, maxSize: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'video-guidelines' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Video Upload Guidelines - Step 4
                  </CardTitle>
                  <Button 
                    onClick={() => handleSaveSection('Video Guidelines')}
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Introduction Video Tips */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Tips For A Successful Introduction Video</h3>
                    <Button onClick={() => addVideoTip('intro')} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tip
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {videoGuidelines.introVideoTips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                        <Textarea
                          value={tip}
                          onChange={(e) => updateVideoTip('intro', index, e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeVideoTip('intro', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lesson Video Tips */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Tips For A Successful Lesson Video</h3>
                    <Button onClick={() => addVideoTip('lesson')} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Tip
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {videoGuidelines.lessonVideoTips.map((tip, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0 mt-2"></div>
                        <Textarea
                          value={tip}
                          onChange={(e) => updateVideoTip('lesson', index, e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeVideoTip('lesson', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Examples */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Video Examples</h3>
                  <div className="space-y-3">
                    {videoGuidelines.examples.map((example) => (
                      <Card key={example.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Video className="w-5 h-5 text-blue-500" />
                            <div>
                              <Input
                                value={example.title}
                                onChange={(e) => setVideoGuidelines(prev => ({
                                  ...prev,
                                  examples: prev.examples.map(ex =>
                                    ex.id === example.id ? { ...ex, title: e.target.value } : ex
                                  )
                                }))}
                                className="font-medium"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={example.enabled ? "default" : "secondary"}>
                              {example.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVideoGuidelines(prev => ({
                                ...prev,
                                examples: prev.examples.map(ex =>
                                  ex.id === example.id ? { ...ex, enabled: !ex.enabled } : ex
                                )
                              }))}
                            >
                              {example.enabled ? "Disable" : "Enable"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* File Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">File Requirements</h3>
                  <Card className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Supported Formats</label>
                        <Input
                          value={videoGuidelines.fileRequirements.formats}
                          onChange={(e) => setVideoGuidelines(prev => ({
                            ...prev,
                            fileRequirements: { ...prev.fileRequirements, formats: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Maximum File Size</label>
                        <Input
                          value={videoGuidelines.fileRequirements.maxSize}
                          onChange={(e) => setVideoGuidelines(prev => ({
                            ...prev,
                            fileRequirements: { ...prev.fileRequirements, maxSize: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Recommended Duration</label>
                        <Input
                          value={videoGuidelines.fileRequirements.duration}
                          onChange={(e) => setVideoGuidelines(prev => ({
                            ...prev,
                            fileRequirements: { ...prev.fileRequirements, duration: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Video Quality</label>
                        <Input
                          value={videoGuidelines.fileRequirements.quality}
                          onChange={(e) => setVideoGuidelines(prev => ({
                            ...prev,
                            fileRequirements: { ...prev.fileRequirements, quality: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Save Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the changes to {confirmDialog.section}? This will update the guidelines shown to teachers during registration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
