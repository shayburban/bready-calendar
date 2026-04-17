
import React, { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  Heart,
  Play,
  Search,
  Filter,
  Grid,
  List,
  Menu,
  X,
  ChevronDown,
  Home,
  Settings,
  BookOpen,
  GraduationCap,
  Clock,
  DollarSign,
  Eye,
  Plus,
  Bell,
  MessageSquare,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Zap,
  Square
} from 'lucide-react';

// Lazy load actual website components for real previews
const LazyTeacherCard = lazy(() => import('../../teachers/TeacherCard'));
const LazyHeroSection = lazy(() => import('../../home/HeroSection'));
const LazyHeaderContainer = lazy(() => import('../../layout/header/HeaderContainer'));
const LazyFooter = lazy(() => import('../../layout/Footer'));

export default function ElementPreview({ group, systemConfig }) {
  if (!group) return null;

  const renderRealWebsitePreview = () => {
    const { components, globalColors, typography } = systemConfig;

    switch (group.id) {
      case 1: // Input Fields - Real website input with custom styling
        return (
          <div className="space-y-3">
            <Input
              placeholder="Search for tutors..."
              className="custom-input"
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
                padding: components.inputs.padding,
                border: components.inputs.border,
              }}
            />
            <Input
              type="email"
              placeholder="Enter your email"
              className="custom-input"
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
                padding: components.inputs.padding,
                border: components.inputs.border,
              }}
            />
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search subjects..."
                className="pl-10 custom-input"
                style={{
                  backgroundColor: components.inputs.backgroundColor,
                  color: components.inputs.textColor,
                  borderRadius: components.inputs.borderRadius,
                  padding: components.inputs.padding,
                  border: components.inputs.border,
                }}
              />
            </div>
          </div>
        );

      case 2: // Dropdown Menus - Real website dropdowns
        return (
          <div className="space-y-3">
            <Select>
              <SelectTrigger
                className="custom-dropdown"
                style={{
                  backgroundColor: components.dropdowns?.backgroundColor || '#ffffff',
                  borderColor: components.dropdowns?.borderColor || '#d1d5db',
                  color: components.dropdowns?.itemTextColor || '#1f2937'
                }}
              >
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger
                className="custom-dropdown"
                style={{
                  backgroundColor: components.dropdowns?.backgroundColor || '#ffffff',
                  borderColor: components.dropdowns?.borderColor || '#d1d5db',
                  color: components.dropdowns?.itemTextColor || '#1f2937'
                }}
              >
                <SelectValue placeholder="Select Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 3: // Checkboxes - Real website checkboxes
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox id="verified" />
              <label htmlFor="verified" className="text-sm font-medium">Verified Teachers Only</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="trial" />
              <label htmlFor="trial" className="text-sm font-medium">Offers Trial Lesson</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="instant" />
              <label htmlFor="instant" className="text-sm font-medium">Instant Booking Available</label>
            </div>
          </div>
        );

      case 4: // Radio Buttons - Real website radio buttons
        return (
          <RadioGroup defaultValue="all">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <label htmlFor="all" className="text-sm font-medium">All Teachers</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="online" id="online" />
              <label htmlFor="online" className="text-sm font-medium">Online Only</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inperson" id="inperson" />
              <label htmlFor="inperson" className="text-sm font-medium">In-Person Only</label>
            </div>
          </RadioGroup>
        );

      case 5: // Text Areas - Real website textareas
        return (
          <div className="space-y-3">
            <Textarea
              placeholder="Describe what you're looking for in a tutor..."
              className="min-h-24"
              style={{
                backgroundColor: components.inputs?.backgroundColor || '#ffffff',
                color: components.inputs?.textColor || '#1f2937',
                borderRadius: components.inputs?.borderRadius || '6px',
                border: components.inputs?.border || '1px solid #d1d5db',
              }}
            />
            <Textarea
              placeholder="Tell us about your teaching experience..."
              className="min-h-32"
              style={{
                backgroundColor: components.inputs?.backgroundColor || '#ffffff',
                color: components.inputs?.textColor || '#1f2937',
                borderRadius: components.inputs?.borderRadius || '6px',
                border: components.inputs?.border || '1px solid #d1d5db',
              }}
            />
          </div>
        );

      case 6: // Sliders - Real website sliders
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Price Range: $10 - $100</label>
              <Slider defaultValue={[25, 75]} max={100} step={1} className="w-full" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Experience: 0 - 20 years</label>
              <Slider defaultValue={[5]} max={20} step={1} className="w-full" />
            </div>
          </div>
        );

      case 7: // Primary Buttons - Real website primary buttons
        return (
          <div className="space-y-3 flex flex-col">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              style={{
                backgroundColor: components.buttons?.variants?.primary?.bg || '#0263c4',
                color: components.buttons?.variants?.primary?.color || '#ffffff',
                borderRadius: components.buttons?.borderRadius || '6px',
                fontWeight: components.buttons?.fontWeight || 500,
              }}
            >
              Find Tutors
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              style={{
                backgroundColor: components.buttons?.variants?.primary?.bg || '#0263c4',
                color: components.buttons?.variants?.primary?.color || '#ffffff',
                borderRadius: components.buttons?.borderRadius || '6px',
                fontWeight: components.buttons?.fontWeight || 500,
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Become a Tutor
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              style={{
                backgroundColor: components.buttons?.variants?.primary?.bg || '#0263c4',
                color: components.buttons?.variants?.primary?.color || '#ffffff',
                borderRadius: components.buttons?.borderRadius || '6px',
                fontWeight: components.buttons?.fontWeight || 500,
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Book Now
            </Button>
          </div>
        );

      case 8: // Secondary Buttons - Real website secondary buttons
        return (
          <div className="space-y-3 flex flex-col">
            <Button
              variant="outline"
              style={{
                backgroundColor: components.buttons?.variants?.secondary?.bg || 'transparent',
                color: components.buttons?.variants?.secondary?.color || '#374151',
                borderRadius: components.buttons?.borderRadius || '6px',
                border: components.buttons?.variants?.secondary?.border || '1px solid #d1d5db',
              }}
            >
              View Profile
            </Button>
            <Button
              variant="outline"
              style={{
                backgroundColor: components.buttons?.variants?.secondary?.bg || 'transparent',
                color: components.buttons?.variants?.secondary?.color || '#374151',
                borderRadius: components.buttons?.borderRadius || '6px',
                border: components.buttons?.variants?.secondary?.border || '1px solid #d1d5db',
              }}
            >
              <Heart className="w-4 h-4 mr-2" />
              Save for Later
            </Button>
            <Button
              variant="outline"
              style={{
                backgroundColor: components.buttons?.variants?.secondary?.bg || 'transparent',
                color: components.buttons?.variants?.secondary?.color || '#374151',
                borderRadius: components.buttons?.borderRadius || '6px',
                border: components.buttons?.variants?.secondary?.border || '1px solid #d1d5db',
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter Results
            </Button>
          </div>
        );

      case 9: // Icon Buttons - Real website icon buttons
        return (
          <div className="flex space-x-3">
            <Button size="icon" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Filter className="w-4 h-4" />
            </Button>
            <Button size="icon" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Heart className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        );

      case 10: // Link Buttons - Real website link buttons
        return (
          <div className="space-y-2">
            <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
              Learn More About Our Platform
            </Button>
            <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
              <Eye className="w-4 h-4 mr-1" />
              View Teacher Profile
            </Button>
            <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
              Read Student Reviews
            </Button>
          </div>
        );

      case 11: // Floating Action Buttons
        return (
          <div className="relative h-24 w-full">
            <Button
              size="icon"
              className="absolute bottom-4 right-4 rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              className="absolute bottom-4 right-20 rounded-full w-12 h-12 bg-green-600 hover:bg-green-700 shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          </div>
        );

      case 12: // Header Navigation - Real website header
        return (
          <div className="bg-white shadow-sm p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="text-xl font-bold text-blue-600">TutorPlatform</div>
                <nav className="hidden md:flex space-x-6">
                  <a href="#" className="text-gray-600 hover:text-blue-600">Find Tutors</a>
                  <a href="#" className="text-gray-600 hover:text-blue-600">Become a Tutor</a>
                  <a href="#" className="text-gray-600 hover:text-blue-600">How it Works</a>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost">Login</Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
              </div>
            </div>
          </div>
        );

      case 13: // Footer - Real website footer
        return (
          <div className="bg-gray-900 text-white p-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3">TutorPlatform</h3>
                <p className="text-gray-400 text-sm">Connecting students with expert tutors worldwide.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">For Students</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li><a href="#" className="hover:text-white">Find Tutors</a></li>
                  <li><a href="#" className="hover:text-white">How it Works</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">For Tutors</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li><a href="#" className="hover:text-white">Become a Tutor</a></li>
                  <li><a href="#" className="hover:text-white">Teacher Resources</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Support</h4>
                <ul className="text-gray-400 text-sm space-y-1">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 14: // Sidebar - Real website sidebar
        return (
          <div className="w-64 bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <Slider defaultValue={[25, 75]} max={100} step={1} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm text-gray-600 ml-2">4.0 & up</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 15: // Breadcrumbs - Real website breadcrumbs
        return (
          <nav className="flex text-sm text-gray-600">
            <a href="#" className="hover:text-blue-600">Home</a>
            <ChevronRight className="w-4 h-4 mx-2" />
            <a href="#" className="hover:text-blue-600">Find Tutors</a>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-900">Mathematics Teachers</span>
          </nav>
        );

      case 16: // Tabs - Real website tabs
        return (
          <div className="w-full">
            <div className="flex border-b">
              <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                Overview
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                Reviews
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                Schedule
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600">
                Pricing
              </button>
            </div>
          </div>
        );

      case 17: // Pagination - Real website pagination
        return (
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <span className="text-gray-400">...</span>
            <Button variant="outline" size="sm">10</Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        );

      case 18: // Cards - Real website cards
        return (
          <div className="space-y-4">
            <Card
              style={{
                borderRadius: components.cards?.borderRadius || '8px',
                padding: components.cards?.padding || '24px',
                boxShadow: components.cards?.shadow || '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: components.cards?.border || '1px solid #e5e7eb'
              }}
            >
              <CardHeader>
                <CardTitle>Featured Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    JD
                  </div>
                  <div>
                    <h3 className="font-semibold">John Doe</h3>
                    <p className="text-sm text-gray-600">Mathematics Teacher</p>
                    <div className="flex items-center mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">4.9 (127 reviews)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                borderRadius: components.cards?.borderRadius || '8px',
                padding: components.cards?.padding || '24px',
                boxShadow: components.cards?.shadow || '0 1px 3px rgba(0, 0, 0, 0.1)',
                border: components.cards?.border || '1px solid #e5e7eb'
              }}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">Start Learning Today</h3>
                  <p className="text-gray-600 text-sm mb-4">Connect with expert tutors in minutes</p>
                  <Button className="w-full">Get Started</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 19: // Modals - Real website modal preview
        return (
          <div className="p-6 bg-white rounded-lg shadow-lg border max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Book a Lesson</h3>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Time</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose time" />
                  </SelectTrigger>
                </Select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button variant="outline" className="flex-1">Cancel</Button>
                <Button className="flex-1">Book Now</Button>
              </div>
            </div>
          </div>
        );

      case 20: // Popover/Dropdown - Real website popover
        return (
          <div className="space-y-4">
            <div className="relative inline-block">
              <Button variant="outline">
                Options <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <div className="absolute top-full mt-1 left-0 bg-white border rounded-md shadow-lg p-2 min-w-40">
                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">Edit Profile</button>
                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">Settings</button>
                <button className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded text-red-600">Sign Out</button>
              </div>
            </div>
          </div>
        );

      case 21: // Accordion - Real website accordion
        return (
          <div className="space-y-2">
            <div className="border rounded-lg">
              <button className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-medium">What subjects do you teach?</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="px-4 pb-4 text-gray-600">
                I specialize in Mathematics, Physics, and Chemistry for high school and college students.
              </div>
            </div>
            <div className="border rounded-lg">
              <button className="w-full flex items-center justify-between p-4 text-left">
                <span className="font-medium">What are your rates?</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        );

      case 22: // Grid Containers - Real website grid
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">Mathematics</h4>
              <p className="text-sm text-gray-600">150+ tutors</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">Physics</h4>
              <p className="text-sm text-gray-600">89+ tutors</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold">Chemistry</h4>
              <p className="text-sm text-gray-600">76+ tutors</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <h4 className="font-semibold">Biology</h4>
              <p className="text-sm text-gray-600">64+ tutors</p>
            </div>
          </div>
        );

      case 23: // Sections - Real website sections
        return (
          <div className="space-y-6">
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-2">Find Your Perfect Tutor</h2>
              <p className="opacity-90">Connect with expert tutors in over 100+ subjects</p>
            </section>
            <section className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Popular Subjects</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Mathematics</Badge>
                <Badge>Physics</Badge>
                <Badge>Chemistry</Badge>
                <Badge>English</Badge>
              </div>
            </section>
          </div>
        );

      case 24: // Tooltips - Real website tooltips
        return (
          <div className="space-y-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover for tooltip</Button>
                </TooltipTrigger>
                <TooltipContent
                  style={{
                    backgroundColor: components.tooltips?.backgroundColor || '#1f2937',
                    color: components.tooltips?.textColor || '#ffffff',
                    borderRadius: components.tooltips?.borderRadius || '4px',
                    padding: components.tooltips?.padding || '8px 12px',
                    fontSize: components.tooltips?.fontSize || '12px',
                  }}
                >
                  <p>This teacher has been verified by our team</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>4.9 Rating</span>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  style={{
                    backgroundColor: components.tooltips?.backgroundColor || '#1f2937',
                    color: components.tooltips?.textColor || '#ffffff',
                    borderRadius: components.tooltips?.borderRadius || '4px',
                    padding: components.tooltips?.padding || '8px 12px',
                    fontSize: components.tooltips?.fontSize || '12px',
                  }}
                >
                  <p>Based on 127 student reviews</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );

      case 25: // Alerts - Real website alerts
        return (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h4 className="text-green-800 font-semibold">Lesson Booked Successfully!</h4>
                <p className="text-green-700 text-sm">Your lesson with John Doe is confirmed for tomorrow at 3 PM.</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h4 className="text-yellow-800 font-semibold">Payment Reminder</h4>
                <p className="text-yellow-700 text-sm">Your payment for this month's lessons is due in 3 days.</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h4 className="text-red-800 font-semibold">Lesson Cancelled</h4>
                <p className="text-red-700 text-sm">Unfortunately, your tutor had to cancel today's lesson. Please reschedule.</p>
              </div>
            </div>
          </div>
        );

      case 26: // Badges - Real website badges
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
              <Badge className="bg-green-100 text-green-800">Top Rated</Badge>
              <Badge className="bg-purple-100 text-purple-800">Expert</Badge>
              <Badge className="bg-yellow-100 text-yellow-800">Popular</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Mathematics</Badge>
              <Badge variant="outline">Physics</Badge>
              <Badge variant="outline">Online Only</Badge>
              <Badge variant="outline">Instant Booking</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Specializations:</span>
              <Badge className="bg-red-100 text-red-800">Calculus</Badge>
              <Badge className="bg-indigo-100 text-indigo-800">Algebra</Badge>
              <Badge className="bg-pink-100 text-pink-800">Geometry</Badge>
            </div>
          </div>
        );

      case 27: // Progress Bars - Real website progress
        return (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Profile Completion</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Student Satisfaction</span>
                <span>96%</span>
              </div>
              <Progress value={96} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Lesson Goal Progress</span>
                <span>7/10 lessons</span>
              </div>
              <Progress value={70} className="h-3" />
            </div>
          </div>
        );

      case 28: // Loading Spinners - Real website loading states
        return (
          <div className="space-y-6 text-center">
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading tutors...</p>
            </div>
            <div>
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Loading profile...</p>
            </div>
            <div className="flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Updating availability...</span>
            </div>
          </div>
        );

      case 29: // Text Headers - Real website headers
        return (
          <div
            className="space-y-4"
            style={{
              fontFamily: typography?.fontFamily || 'Inter, sans-serif',
              color: globalColors?.text || '#1f2937'
            }}
          >
            <h1
              className="text-3xl font-bold"
              style={{
                fontSize: `calc(${typography?.baseSize || '14px'} * ${Math.pow(typography?.headingScale || 1.25, 4)})`,
                fontWeight: typography?.fontWeights?.bold || 700
              }}
            >
              Find Your Perfect Tutor
            </h1>
            <h2
              className="text-2xl font-semibold"
              style={{
                fontSize: `calc(${typography?.baseSize || '14px'} * ${Math.pow(typography?.headingScale || 1.25, 3)})`,
                fontWeight: typography?.fontWeights?.semibold || 600
              }}
            >
              Featured Mathematics Teachers
            </h2>
            <h3
              className="text-xl font-medium"
              style={{
                fontSize: `calc(${typography?.baseSize || '14px'} * ${Math.pow(typography?.headingScale || 1.25, 2)})`,
                fontWeight: typography?.fontWeights?.medium || 500
              }}
            >
              John Doe - Expert Mathematics Tutor
            </h3>
            <h4 className="text-lg font-medium">Lesson Schedule</h4>
          </div>
        );

      case 30: // Body Text - Real website body text
        return (
          <div
            className="space-y-4"
            style={{
              fontFamily: typography?.fontFamily || 'Inter, sans-serif',
              lineHeight: typography?.lineHeight || 1.6
            }}
          >
            <p
              className="text-base"
              style={{
                fontSize: typography?.baseSize || '14px',
                color: globalColors?.text || '#1f2937',
                fontWeight: typography?.fontWeights?.normal || 400
              }}
            >
              Welcome to our tutoring platform! We connect students with expert tutors from around the world.
              Whether you need help with mathematics, science, languages, or any other subject,
              we have qualified professionals ready to help you succeed.
            </p>
            <p
              className="text-sm"
              style={{
                fontSize: `calc(${typography?.baseSize || '14px'} * 0.875)`,
                color: globalColors?.textSecondary || '#6b7280',
                fontWeight: typography?.fontWeights?.normal || 400
              }}
            >
              Our tutors are carefully selected and verified to ensure the highest quality education experience.
              Start your learning journey today with flexible scheduling and personalized lesson plans.
            </p>
            <p className="text-xs text-gray-500">
              * All lessons are conducted through our secure video platform with recording capabilities for review.
            </p>
          </div>
        );

      case 31: // Links - Real website links
        return (
          <div className="space-y-3">
            <div>
              <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">
                View Teacher Profile
              </a>
            </div>
            <div>
              <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                Read All Reviews (127)
              </a>
            </div>
            <div>
              <a href="#" className="text-gray-600 hover:text-gray-800 text-sm">
                Terms of Service
              </a>
            </div>
            <div>
              <a href="#" className="text-red-600 hover:text-red-700 text-sm">
                Report this tutor
              </a>
            </div>
          </div>
        );

      case 32: // Labels - Real website labels
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name *
              </label>
              <Input placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject of Interest
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Learning Style
              </label>
              <RadioGroup defaultValue="visual">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="visual" id="visual" />
                  <label htmlFor="visual" className="text-sm">Visual Learner</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auditory" id="auditory" />
                  <label htmlFor="auditory" className="text-sm">Auditory Learner</label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 33: // Captions - Real website captions
        return (
          <div className="space-y-4">
            <div>
              <img src="/api/placeholder/300/200" alt="Teacher profile" className="rounded-lg mb-2" />
              <p className="text-xs text-gray-500 text-center">
                John Doe teaching a mathematics lesson to high school students
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Lesson Statistics</h4>
              <p className="text-xs text-gray-600">
                Figure 1: Student performance improvement over 3 months of tutoring sessions
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">4.9</span>
              </div>
              <p className="text-xs text-gray-500">
                Based on feedback from 127 students over the past 12 months
              </p>
            </div>
          </div>
        );

      case 34: // Tables - Real website tables
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Tutor</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Subject</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Rating</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Price/hr</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">JD</div>
                      <span>John Doe</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">Mathematics</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span>4.9</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">$45</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Button size="sm" variant="outline">Book</Button>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">SJ</div>
                      <span>Sarah Johnson</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">Physics</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span>4.8</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">$50</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Button size="sm" variant="outline">Book</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case 35: // Lists - Real website lists
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">What You'll Learn:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Advanced calculus concepts and applications</li>
                <li>Problem-solving strategies for complex equations</li>
                <li>Real-world mathematical modeling</li>
                <li>Preparation for standardized tests</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Popular Subjects:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Mathematics (150+ tutors)</li>
                <li>Physics (89+ tutors)</li>
                <li>Chemistry (76+ tutors)</li>
                <li>English (64+ tutors)</li>
                <li>Biology (58+ tutors)</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Quick Actions:</h4>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Book a trial lesson</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>View tutor schedule</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Read student reviews</span>
                </li>
              </ul>
            </div>
          </div>
        );

      case 36: // Profile Cards - Real website teacher profile cards
        return (
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="absolute -bottom-6 left-6">
                  <div className="w-12 h-12 bg-white rounded-full border-4 border-white flex items-center justify-center font-bold text-blue-600">
                    JD
                  </div>
                </div>
              </div>
              <CardContent className="pt-8">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">John Doe</h3>
                    <p className="text-gray-600">Mathematics Expert</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>4.9 (127)</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>5+ years</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>$45/hr</span>
                  </div>
                </div>
                <div className="flex space-x-2 mb-4">
                  <Badge variant="outline" className="text-xs">Calculus</Badge>
                  <Badge variant="outline" className="text-xs">Algebra</Badge>
                  <Badge variant="outline" className="text-xs">Geometry</Badge>
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1">Book Trial</Button>
                  <Button variant="outline" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    SJ
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">Sarah Johnson</h3>
                      <span className="text-lg font-bold text-green-600">$50</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">Physics & Chemistry</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>4.8</span>
                        <span className="text-gray-500 ml-1">(89 reviews)</span>
                      </div>
                      <Button size="sm">View Profile</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 37: // Statistics Cards - Real website metric cards
        return (
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">150+</div>
                <div className="text-sm text-gray-600">Active Tutors</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">5,000+</div>
                <div className="text-sm text-gray-600">Lessons Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">4.9</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">95%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </CardContent>
            </Card>
          </div>
        );

      case 38: // Calendar Components - Real website calendar
        return (
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Available Times</h3>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">January 2024</span>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-medium text-gray-600 p-2">{day}</div>
              ))}
              {Array.from({ length: 35 }, (_, i) => (
                <div
                  key={i}
                  className={`p-2 text-sm cursor-pointer hover:bg-gray-100 rounded ${
                    i === 15 ? 'bg-blue-600 text-white' : i === 22 ? 'bg-green-100 text-green-800' : ''
                  }`}
                >
                  {i > 0 && i < 32 ? i : ''}
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Available</span>
              </div>
            </div>
          </div>
        );

      case 39: // Chat/Message - Real website chat interface
        return (
          <div className="bg-white rounded-lg border h-80 flex flex-col">
            <div className="p-3 border-b bg-gray-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  JD
                </div>
                <div>
                  <div className="font-medium text-sm">John Doe</div>
                  <div className="text-xs text-green-600">Online</div>
                </div>
              </div>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-2 max-w-xs">
                  <p className="text-sm">Hi! I'm ready for our math lesson. Do you have the practice problems?</p>
                  <p className="text-xs text-gray-500 mt-1">2:30 PM</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-lg p-2 max-w-xs">
                  <p className="text-sm">Yes! I've prepared some calculus problems. Let's start with derivatives.</p>
                  <p className="text-xs text-blue-200 mt-1">2:32 PM</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-2 max-w-xs">
                  <p className="text-sm">Perfect! I'm ready to learn.</p>
                  <p className="text-xs text-gray-500 mt-1">2:33 PM</p>
                </div>
              </div>
            </div>
            <div className="p-3 border-t">
              <div className="flex items-center space-x-2">
                <Input placeholder="Type your message..." className="flex-1" />
                <Button size="icon">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 40: // Video Player - Real website video player
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-lg font-medium">Introduction to Calculus</h3>
                <p className="text-gray-300 text-sm">Preview lesson with John Doe</p>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded p-2">
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="icon" className="text-white hover:text-gray-300">
                    <Play className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 bg-gray-600 rounded h-1">
                    <div className="bg-blue-600 h-1 rounded w-1/3"></div>
                  </div>
                  <span className="text-white text-sm">12:34 / 25:18</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 41: // Search Components - Real website search
        return (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search for tutors, subjects, or topics..."
                className="pl-10 h-12 text-lg"
              />
              <Button className="absolute right-2 top-2 h-8">
                Search
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Popular searches:</span>
              <Button variant="link" className="text-sm p-0 h-auto">Mathematics</Button>
              <Button variant="link" className="text-sm p-0 h-auto">Physics</Button>
              <Button variant="link" className="text-sm p-0 h-auto">SAT Prep</Button>
              <Button variant="link" className="text-sm p-0 h-auto">Chemistry</Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Recent Searches</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>Calculus tutors near me</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>AP Physics teachers</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 42: // Filter Panels - Real website filter panel
        return (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              <Button variant="link" className="text-sm p-0">Clear All</Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price Range</label>
                <div className="space-y-2">
                  <Slider defaultValue={[20, 80]} max={100} step={5} />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>$20</span>
                    <span>$80</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rating</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rating5" />
                    <label htmlFor="rating5" className="flex items-center text-sm">
                      <div className="flex mr-2">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                      </div>
                      5 stars
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="rating4" />
                    <label htmlFor="rating4" className="flex items-center text-sm">
                      <div className="flex mr-2">
                        {[1, 2, 3, 4].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                        <Star className="w-3 h-3 text-gray-300" />
                      </div>
                      4+ stars
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Availability</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="weekdays" />
                    <label htmlFor="weekdays" className="text-sm">Weekdays</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="weekends" />
                    <label htmlFor="weekends" className="text-sm">Weekends</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="instant" />
                    <label htmlFor="instant" className="text-sm">Instant Booking</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 43: // Admin Panels - Real website admin dashboard components
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <PieChart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm font-medium">Analytics</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <User className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-sm font-medium">Users</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <div className="text-sm font-medium">Payments</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-sm font-medium">Content</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="flex-1">New tutor registration: John Smith</span>
                    <span className="text-gray-500">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="flex-1">Lesson completed: Math with Sarah</span>
                    <span className="text-gray-500">5 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="flex-1">Payment processed: $45.00</span>
                    <span className="text-gray-500">12 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 44: // Form Sections - Real website form sections
        return (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <Input placeholder="Enter your first name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <Input placeholder="Enter your last name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address *</label>
                  <Input type="email" placeholder="Enter your email" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <Input type="tel" placeholder="Enter your phone" />
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Teaching Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subjects You Teach</label>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Mathematics</Badge>
                    <Badge>Physics</Badge>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Subject
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Teaching Experience</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="5+">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 45: // Data Tables - Real website admin data tables
        return (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tutor Management</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tutor
                  </Button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Tutor</th>
                    <th className="text-left p-3 font-medium">Subjects</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Rating</th>
                    <th className="text-left p-3 font-medium">Students</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                          JD
                        </div>
                        <div>
                          <div className="font-medium">John Doe</div>
                          <div className="text-sm text-gray-600">john@example.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">Math</Badge>
                        <Badge variant="outline" className="text-xs">Physics</Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>4.9</span>
                      </div>
                    </td>
                    <td className="p-3">127</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm">
                          SJ
                        </div>
                        <div>
                          <div className="font-medium">Sarah Johnson</div>
                          <div className="text-sm text-gray-600">sarah@example.com</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">Chemistry</Badge>
                        <Badge variant="outline" className="text-xs">Biology</Badge>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>4.8</span>
                      </div>
                    </td>
                    <td className="p-3">89</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing 1 to 10 of 247 entries
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </div>
        );

      case 46: // Mobile Menu - Real website mobile navigation
        return (
          <div className="bg-white border rounded-lg overflow-hidden max-w-sm">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="text-lg font-bold text-blue-600">Menu</div>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="divide-y">
              <a href="#" className="block p-4 hover:bg-gray-50 flex items-center space-x-3">
                <Home className="w-5 h-5 text-gray-600" />
                <span>Home</span>
              </a>
              <a href="#" className="block p-4 hover:bg-gray-50 flex items-center space-x-3">
                <Search className="w-5 h-5 text-gray-600" />
                <span>Find Tutors</span>
              </a>
              <a href="#" className="block p-4 hover:bg-gray-50 flex items-center space-x-3">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                <span>Become a Tutor</span>
              </a>
              <a href="#" className="block p-4 hover:bg-gray-50 flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-gray-600" />
                <span>How it Works</span>
              </a>
              <a href="#" className="block p-4 hover:bg-gray-50 flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Settings</span>
              </a>
            </div>
            <div className="p-4 border-t bg-gray-50 space-y-2">
              <Button className="w-full">Sign Up</Button>
              <Button variant="outline" className="w-full">Login</Button>
            </div>
          </div>
        );

      case 47: // Mobile Cards - Real website mobile-optimized cards
        return (
          <div className="space-y-3 max-w-sm">
            <Card className="overflow-hidden">
              <div className="flex p-3">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">John Doe</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Mathematics</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span>4.9</span>
                    </div>
                    <span className="font-bold text-blue-600">$45/hr</span>
                  </div>
                </div>
              </div>
              <div className="px-3 pb-3">
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">Book</Button>
                  <Button size="sm" variant="outline">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Quick Lesson</h3>
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Available Now</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">Get help with your homework in minutes</p>
                <Button className="w-full" size="sm">Start Now</Button>
              </div>
            </Card>
          </div>
        );

      case 48: // Mobile Buttons - Real website mobile-optimized buttons
        return (
          <div className="space-y-3 max-w-sm">
            <Button className="w-full h-12 text-base">
              <BookOpen className="w-5 h-5 mr-2" />
              Find Tutors
            </Button>
            <Button variant="outline" className="w-full h-12 text-base">
              <GraduationCap className="w-5 h-5 mr-2" />
              Become a Tutor
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat
              </Button>
              <Button variant="outline" className="h-12">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button size="icon" className="flex-1 h-12">
                <Heart className="w-5 h-5" />
              </Button>
              <Button size="icon" className="flex-1 h-12">
                <Search className="w-5 h-5" />
              </Button>
              <Button size="icon" className="flex-1 h-12">
                <Filter className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <Button className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600">
                <Zap className="w-5 h-5 mr-2" />
                Book Instant Lesson
              </Button>
            </div>
          </div>
        );

      // COMMON COMPONENTS PREVIEWS
      case 49: // Tab Selector
        return (
          <div className="space-y-3">
            <div className="tab-selector border-b">
              <div className="flex space-x-1">
                <button className="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 text-blue-600 border-blue-600 bg-blue-50">
                  Active Tab
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 text-gray-600 border-transparent hover:text-blue-600">
                  Tab 2
                </button>
                <button className="px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 text-gray-600 border-transparent hover:text-blue-600">
                  Tab 3
                </button>
                <Button variant="outline" size="sm" className="ml-2 h-9 px-3 border-dashed">
                  +2 More
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 50: // Global Admin Banner
        return (
          <div className="global-admin-banner bg-red-600 text-white px-4 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Admin Mode: Viewing as Teacher</span>
              </div>
              <Button size="sm" variant="secondary" className="bg-white text-red-600 hover:bg-gray-100">
                Exit Admin Mode
              </Button>
            </div>
          </div>
        );

      case 51: // Progress Bar
        return (
          <div className="space-y-3">
            <div className="progress-bar">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <Progress value={65} className="w-full" />
            </div>
          </div>
        );

      case 52: // Pagination
        return (
          <div className="pagination flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-600 text-white">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        );

      case 53: // Input Components
        return (
          <div className="space-y-3">
            <Input
              placeholder="Custom styled input"
              className="custom-input global-input"
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
                padding: components.inputs.padding,
                border: components.inputs.border,
              }}
            />
          </div>
        );

      case 54: // Searchable Dropdown
        return (
          <div className="searchable-dropdown">
            <div className="relative">
              <Input
                placeholder="Search and select..."
                className="pr-10"
                style={{
                  backgroundColor: components.inputs.backgroundColor,
                  color: components.inputs.textColor,
                  borderRadius: components.inputs.borderRadius,
                }}
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
            </div>
          </div>
        );

      case 55: // Country Tab Selector
        return (
          <div className="country-tab-selector">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800 cursor-pointer">🇺🇸 United States</Badge>
              <Badge variant="outline" className="cursor-pointer">🇬🇧 United Kingdom</Badge>
              <Badge variant="outline" className="cursor-pointer">🇨🇦 Canada</Badge>
              <Badge variant="outline" className="cursor-pointer">+15 More</Badge>
            </div>
          </div>
        );

      case 56: // Multi Language Selector
        return (
          <div className="multi-language-selector">
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                <SelectItem value="fr">🇫🇷 French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 57: // Custom Dropdown Selector
        return (
          <div className="custom-dropdown-selector">
            <Select>
              <SelectTrigger
                style={{
                  backgroundColor: components.dropdowns?.backgroundColor || '#ffffff',
                  borderColor: components.dropdowns?.borderColor || '#d1d5db',
                  color: components.dropdowns?.itemTextColor || '#1f2937'
                }}
              >
                <SelectValue placeholder="Custom Dropdown" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 58: // Date Range Picker
        return (
          <div className="date-range-picker flex items-center gap-2">
            <Input
              type="date"
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
              }}
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
              }}
            />
          </div>
        );

      case 59: // Time Input
        return (
          <div className="custom-time-input">
            <Input
              type="time"
              defaultValue="09:00"
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
              }}
            />
          </div>
        );

      case 60: // Availability Window
        return (
          <div className="availability-window p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Availability Window</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">From</label>
                <Input type="time" defaultValue="09:00" />
              </div>
              <div>
                <label className="text-sm text-gray-600">To</label>
                <Input type="time" defaultValue="17:00" />
              </div>
            </div>
          </div>
        );

      case 61: // Advance Booking Selector
        return (
          <div className="advance-booking-selector p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Advance Booking</h4>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="7" className="w-16" />
              <Select>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">in advance</span>
            </div>
          </div>
        );

      case 62: // Break Time Selector
        return (
          <div className="break-time-selector p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Break Time Between Classes</h4>
            <div className="flex items-center gap-2">
              <Input type="number" defaultValue="15" className="w-16" />
              <span className="text-sm text-gray-600">minutes</span>
            </div>
          </div>
        );

      case 63: // Dual Handle Slider
        return (
          <div className="dual-handle-slider p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Price Range</h4>
            <div className="space-y-2">
              <Slider
                defaultValue={[20, 80]}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>$20</span>
                <span>$80</span>
              </div>
            </div>
          </div>
        );

      case 64: // Single Handle Slider
        return (
          <div className="single-handle-slider p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Experience Level</h4>
            <div className="space-y-2">
              <Slider
                defaultValue={[60]}
                max={100}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>
          </div>
        );

      case 65: // Overflow Tag Display
        return (
          <div className="overflow-tag-display">
            <div className="flex flex-wrap gap-2">
              <Badge>Mathematics</Badge>
              <Badge>Physics</Badge>
              <Badge>Chemistry</Badge>
              <Badge variant="outline">+3 more</Badge>
            </div>
          </div>
        );

      case 66: // Selectable Country Tags
        return (
          <div className="selectable-country-tags">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-green-100 text-green-800 cursor-pointer">✓ United States</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">United Kingdom</Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">Canada</Badge>
            </div>
          </div>
        );

      case 67: // IP Country Detection
        return (
          <div className="ip-country-detection p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <MapPin className="w-4 h-4" />
              <span>Detected location: United States 🇺🇸</span>
            </div>
          </div>
        );

      case 68: // Dynamic Timezone
        return (
          <div className="dynamic-timezone p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Timezone</span>
              <Badge variant="outline">UTC-5 (EST)</Badge>
            </div>
          </div>
        );

      case 69: // Custom City Input
        return (
          <div className="custom-city-input">
            <Input
              placeholder="Enter your city..."
              style={{
                backgroundColor: components.inputs.backgroundColor,
                color: components.inputs.textColor,
                borderRadius: components.inputs.borderRadius,
              }}
            />
            <p className="text-xs text-gray-500 mt-1">Custom cities require admin approval</p>
          </div>
        );

      case 70: // Teacher Calendar Availability
        return (
          <div className="teacher-calendar-availability p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Weekly Schedule</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monday</span>
                <div className="flex gap-1">
                  <Badge className="bg-green-100 text-green-800 text-xs">9:00 AM</Badge>
                  <Badge className="bg-green-100 text-green-800 text-xs">2:00 PM</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tuesday</span>
                <Badge variant="outline" className="text-xs">Unavailable</Badge>
              </div>
            </div>
          </div>
        );

      case 71: // Time Slot Row
        return (
          <div className="time-slot-row flex items-center gap-2">
            <Input type="time" defaultValue="09:00" className="w-24" />
            <span className="text-gray-500">-</span>
            <Input type="time" defaultValue="10:00" className="w-24" />
            <Button variant="ghost" size="sm" className="text-red-600">
              <X className="w-4 h-4" />
            </Button>
          </div>
        );

      case 72: // Day Schedule Row
        return (
          <div className="day-schedule-row p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Monday</span>
              <Checkbox />
            </div>
            <div className="space-y-1">
              <div className="time-slot-row flex items-center gap-2">
                <Input type="time" defaultValue="09:00" className="w-20 text-xs" />
                <span className="text-gray-400">-</span>
                <Input type="time" defaultValue="12:00" className="w-20 text-xs" />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Square className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Preview not available for this element</p>
            <p className="text-xs mt-2">Group #{group.id}: {group.name}</p>
          </div>
        );
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">#{group.id}</Badge>
          <span className="text-sm font-medium">{group.name}</span>
        </div>
        <Badge className="text-xs">{group.category}</Badge>
      </div>

      <div className="bg-white rounded border p-4 min-h-32 flex items-center justify-center">
        <Suspense fallback={
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading preview...</span>
          </div>
        }>
          {renderRealWebsitePreview()}
        </Suspense>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        <strong>Targets:</strong> {group.selector}
      </div>
    </div>
  );
}
