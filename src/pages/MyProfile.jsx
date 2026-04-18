import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, TeacherProfile, Country, Booking } from '@/api/entities';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Pencil, Plus, X, Copy, Facebook, Twitter, MessageCircle, AlertTriangle,
  Search, CreditCard, Trash2, RefreshCw, Paperclip,
} from 'lucide-react';

const SECTIONS = [
  { id: 'personal', label: 'Personal Information' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'payment', label: 'Payment' },
  { id: 'availability', label: 'Availability And Pricing' },
  { id: 'cancellation', label: 'Cancellation Policy' },
  { id: 'password', label: 'Password' },
  { id: 'portfolio', label: 'Portfolio Pictures' },
  { id: 'search', label: 'Search Definitions' },
  { id: 'posts', label: 'Posts' },
  { id: 'invite', label: 'Invite Students' },
  { id: 'support', label: 'Support' },
];

const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

function SectionCard({ children, editable = true, className = '' }) {
  return (
    <Card className={`shadow-sm mb-5 ${className}`}>
      <CardContent className="p-4">
        {editable && (
          <div className="flex justify-end mb-1">
            <button className="p-1.5 text-gray-500 hover:text-blue-600">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function Chip({ children, icon }) {
  return (
    <span className="inline-flex items-center gap-2 border bg-white py-1.5 px-3 text-sm">
      {icon}
      <span>{children}</span>
    </span>
  );
}

/* ---------------- 1. Personal Information ---------------- */
function PersonalInformation({ user, country, profile }) {
  const tz = country?.timezone || 'UTC';
  const localTime = (() => {
    try {
      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: tz });
    } catch { return ''; }
  })();
  return (
    <div>
      <SectionCard>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3 text-center">
            <Avatar className="w-32 h-32 mx-auto mb-2">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                {initials(user?.full_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-gray-500">JPG or PNG format<br />maximum 5 MB</p>
          </div>
          <div className="md:col-span-9">
            <h4 className="font-semibold text-gray-900">First Name &amp; Last Name <span className="text-sm text-gray-500 font-normal">(How you are seen as a teacher, by your students)</span></h4>
            <p className="text-gray-700 mb-3">{user?.full_name || 'Not set'}</p>
            <h4 className="font-semibold text-gray-900 mt-3">User Name <span className="text-sm text-gray-500 font-normal">(How you are seen as a student, by your teachers)</span></h4>
            <p className="text-gray-700">{user?.email?.split('@')[0] || 'Not set'}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="font-semibold text-gray-900">Email</h4>
        <div className="flex flex-wrap items-center mb-4 gap-4">
          <span className="text-gray-700">{user?.email || '—'}</span>
          <Button variant="outline" size="sm">Send Verification Email</Button>
        </div>
        <h4 className="font-semibold text-gray-900">Phone Number</h4>
        <div className="flex flex-wrap items-center mb-4 gap-4">
          <span className="text-gray-700">{user?.phone || '—'}</span>
          <Button variant="outline" size="sm">Send Verification Code</Button>
        </div>
        <h4 className="font-semibold text-gray-900">Country, City &amp; Time Zone</h4>
        <span className="text-gray-700">
          {country?.country_name || user?.country_code || '—'}
          {profile?.location ? `, ${profile.location}` : ''}
          {` (${localTime}) ${tz}`}
        </span>
      </SectionCard>

      <SectionCard>
        <h4 className="font-semibold text-gray-900">Company Name</h4>
        <span className="text-gray-700">{profile?.company_name || 'Company Name'}</span>
      </SectionCard>

      <SectionCard>
        <h4 className="font-semibold text-gray-900 mb-3">Languages Spoken</h4>
        <div className="flex flex-wrap gap-3">
          {(profile?.languages || ['English, Expert', 'Hebrew, Native', 'Spanish, Intermediate']).map((l, i) => (
            <Chip key={i}>{l}</Chip>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="font-semibold text-gray-900 mb-3">Subject Taught</h4>
        <div className="flex flex-wrap gap-3 mb-5">
          {(profile?.subjects || ['Chemistry, Expert']).map((s, i) => (
            <Chip key={i}>{s}</Chip>
          ))}
        </div>
        <h4 className="font-semibold text-gray-900 mb-3">Specialisation Of Subject</h4>
        <div className="flex flex-wrap gap-3 mb-5">
          <Chip>Organic Chemistry</Chip>
          <Chip>Bio Chemistry</Chip>
        </div>
        <h4 className="font-semibold text-gray-900 mb-3">Course Taught In</h4>
        <p className="text-gray-700">{country?.country_name || 'United States'}</p>
        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Board</h4>
            <div className="flex flex-wrap gap-3 mb-3"><Chip>Board Name</Chip></div>
            <h4 className="font-semibold text-gray-900 mb-3">Board Subject</h4>
            <div className="flex flex-wrap gap-3"><Chip>Board, Subject</Chip></div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Exam</h4>
            <div className="flex flex-wrap gap-3 mb-3"><Chip>Exam Name</Chip></div>
            <h4 className="font-semibold text-gray-900 mb-3">Exam Subject</h4>
            <div className="flex flex-wrap gap-3"><Chip>Exam, Subject</Chip></div>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <Tabs defaultValue="eng">
          <TabsList>
            <TabsTrigger value="eng">English</TabsTrigger>
            <TabsTrigger value="local">Local Language</TabsTrigger>
          </TabsList>
          <TabsContent value="eng" className="pt-4">
            <h3 className="font-semibold mb-2">Introduce Yourself</h3>
            <p className="text-gray-700">{profile?.bio || 'Tell students about your teaching style, experience, and what makes you unique.'}</p>
          </TabsContent>
          <TabsContent value="local" className="pt-4">
            <p className="text-gray-500 italic">No localized bio yet.</p>
          </TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard>
        <Tabs defaultValue="edu">
          <TabsList>
            <TabsTrigger value="edu">Education</TabsTrigger>
            <TabsTrigger value="teching">Teaching Experience</TabsTrigger>
            <TabsTrigger value="indsry">Industry Experience</TabsTrigger>
          </TabsList>
          <TabsContent value="edu" className="pt-4">
            <h4 className="font-semibold mb-2">Qualification</h4>
            <div className="flex flex-wrap gap-3 mb-5"><Chip>B.Sc. Chemistry</Chip></div>
            <h4 className="font-semibold mb-2">Qualification Files</h4>
            <div className="flex flex-wrap gap-3 mb-5"><Chip>degree.pdf</Chip></div>
            <h4 className="font-semibold mb-2">Certification</h4>
            <div className="flex flex-wrap gap-3 mb-5"><Chip>Teaching Certificate</Chip></div>
          </TabsContent>
          <TabsContent value="teching" className="pt-4">
            <div className="flex flex-wrap gap-3 mb-5">
              <Chip>1. Greenfield Academy, Science Teacher, 5 Years</Chip>
              <Chip>2. Online Tutor, 3 Years</Chip>
            </div>
            <Label>Are You Currently Full Time At A School/College?</Label>
            <p className="mb-5">Yes</p>
            <Label>Years Of Online Teaching</Label>
            <p className="mb-5">5 Years</p>
            <Label>Years Of Offline Teaching</Label>
            <p className="mb-5">8 Years</p>
          </TabsContent>
          <TabsContent value="indsry" className="pt-4">
            <div className="flex flex-wrap gap-3 mb-5">
              <Chip>Company Name, Job Title, Years</Chip>
            </div>
            <Label>Are You Currently Full Time At A Company?</Label>
            <p className="mb-5">No</p>
            <Label>Years Of Industry Experience</Label>
            <p>3 Years</p>
          </TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard>
        <h4 className="font-semibold mb-3">Introduction Video</h4>
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 rounded">
          No video uploaded
        </div>
      </SectionCard>

      <SectionCard>
        <h4 className="font-semibold mb-3">Demo Video</h4>
        <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 rounded">
          No demo uploaded
        </div>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Vacation Mode</h4>
        <p className="text-sm text-gray-600 mb-3">
          When vacation mode is activated you won't be seen in the teacher listing and your availability won't be seen by users.
        </p>
        <Switch />
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Delete Account</h4>
        <p className="text-sm text-gray-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Are you sure? Deleted accounts cannot be reactivated.
        </p>
        <Button variant="outline" className="mt-3 text-red-600 border-red-300 hover:bg-red-50">
          Delete Account
        </Button>
      </SectionCard>
    </div>
  );
}

/* ---------------- 2. Notifications ---------------- */
function Notifications() {
  return (
    <div>
      <SectionCard>
        <h4 className="font-semibold mb-2">Send Teacher A Quick Reminder</h4>
        <p className="text-sm text-gray-600 mb-3">General reminder that will be relevant for different teachers:</p>
        <div className="flex items-center gap-3 mb-3">
          <p>Hi</p>
          <Input value="User Name" disabled className="w-40" />
        </div>
        <p className="mb-3">I would like to remind you that we have a booking.</p>
        <div className="flex items-center gap-3 mb-3">
          <p>session in</p>
          <Input value="Schedule" disabled className="w-40" />
        </div>
        <p>Please confirm arrival.</p>
      </SectionCard>

      <h2 className="text-xl font-semibold mt-6 mb-3">Reminder Notification</h2>
      <SectionCard editable={false}>
        <h4 className="font-semibold">Email Notification</h4>
        <div className="flex flex-wrap items-center gap-3 mt-2 mb-3">
          <p className="text-gray-700">Notification Before Booking:</p>
          <Badge variant="outline">1 day before</Badge>
          <Button variant="ghost" size="sm"><X className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm"><Plus className="w-4 h-4" /></Button>
        </div>
        <label className="flex items-start gap-2 mb-3">
          <Checkbox defaultChecked />
          <span className="text-sm">Receive Email before free cancellation (Only when the teacher is a student)</span>
        </label>
        <label className="flex items-start gap-2">
          <Checkbox defaultChecked />
          <span className="text-sm">Receive Bready offers</span>
        </label>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold">Alarm Clock</h4>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <p className="text-gray-700">Notification Before Booking:</p>
          <Badge variant="outline">2 hours before</Badge>
          <Button variant="ghost" size="sm"><X className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm"><Plus className="w-4 h-4" /></Button>
        </div>
      </SectionCard>

      <h2 className="text-xl font-semibold mt-6 mb-3">Messages Notification</h2>
      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">SMS Notification</h4>
        <Tabs defaultValue="tchr">
          <TabsList>
            <TabsTrigger value="tchr">As A Teacher</TabsTrigger>
            <TabsTrigger value="stnd">As A Student</TabsTrigger>
          </TabsList>
          <TabsContent value="tchr" className="pt-4">
            <label className="flex items-start gap-2 mb-3">
              <Checkbox defaultChecked />
              <span className="text-sm">Receive SMS link when a student sends you the message for the first time.</span>
            </label>
            <label className="flex items-start gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm">Receive SMS link when a student request to change booking details.</span>
            </label>
          </TabsContent>
          <TabsContent value="stnd" className="pt-4">
            <label className="flex items-start gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm">Receive a link to SMS for first reply from a teacher.</span>
            </label>
          </TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Sync Calendar</h4>
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <p className="text-gray-700">Synchronize Calendar with</p>
          <label className="flex items-center gap-2"><Checkbox /> Google</label>
          <label className="flex items-center gap-2"><Checkbox /> Apple</label>
        </div>
        <Card className="shadow-sm border">
          <CardContent className="p-4">
            <Label>To sync with Google/Apple calendar please enter your email</Label>
            <Input type="email" placeholder="Type your email id" className="mt-2" />
            <div className="flex justify-end gap-3 mt-3">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700">Sync</Button>
            </div>
          </CardContent>
        </Card>
      </SectionCard>
    </div>
  );
}

/* ---------------- 3. Payment ---------------- */
function Payment() {
  return (
    <div>
      <SectionCard>
        <h4 className="font-semibold mb-3">Default Currency</h4>
        <Select defaultValue="usd">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="usd">USD</SelectItem>
            <SelectItem value="eur">EUR</SelectItem>
            <SelectItem value="gbp">GBP</SelectItem>
            <SelectItem value="ils">ILS</SelectItem>
            <SelectItem value="inr">INR</SelectItem>
          </SelectContent>
        </Select>
        <h4 className="font-semibold mt-5 mb-3">Credit Card Details</h4>
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center justify-between border rounded p-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">•••• •••• •••• 42{n}2</span>
                <span className="text-xs text-gray-500">Expires 12/26</span>
              </div>
              <Button variant="ghost" size="sm">
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <Button className="bg-green-600 hover:bg-green-700 mt-4">Add Card</Button>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Withdraw Earnings</h4>
        <p className="text-sm text-gray-600 mb-3">Available to withdraw: <span className="font-semibold">$0.00</span></p>
        <div className="flex gap-3">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-green-600 hover:bg-green-700">Withdraw Money</Button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- 4. Availability And Pricing ---------------- */
function AvailabilityPricing() {
  const services = [
    { name: 'Trial', price: 10, note: 'Trial lesson needs to be 50% of the lowest service you offer.' },
    { name: 'Consulting', price: 40, note: 'Including commission and charges but excluding taxes.' },
    { name: 'Online Class', price: 50, note: 'Including commission and charges but excluding taxes.' },
    { name: 'Technical Interview', price: 60, note: 'Including commission and charges but excluding taxes.' },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Availability With Other Calendars</h2>
      <p className="text-sm text-gray-600 mb-3">
        When you add things on Google Calendar and you have an available time on the platform,
        Google Calendar will delete the availability on the platform.
      </p>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-2">Pricing</h4>
        <p className="text-sm text-gray-600 mb-4">
          The accumulation of teaching hours <strong>doesn't</strong> depend on the service you teach. Trial Lesson is a <strong>must</strong>.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {services.map((s) => (
            <Card key={s.name} className="border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{s.name}</h3>
                <p className="text-xs text-gray-600 mb-3">{s.note}</p>
                <Label>Price Students Pay ($/Hr)</Label>
                <Input type="number" defaultValue={s.price} className="mt-1 mb-3" />
                <h4 className="font-semibold mt-2 mb-2">Amount You Will Receive</h4>
                <div className="text-sm space-y-1">
                  <p><u>2 - 20 Hrs</u> — 24% fee — Receive <span className="text-blue-600 font-semibold">${(s.price * 0.76).toFixed(0)}</span></p>
                  <p><u>21 - 50 Hrs</u> — 22% fee — Receive <span className="text-blue-600 font-semibold">${(s.price * 0.78).toFixed(0)}</span></p>
                  <p><u>50+ Hrs</u> — 20% fee — Receive <span className="text-blue-600 font-semibold">${(s.price * 0.80).toFixed(0)}</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>

      <SectionCard editable={false}>
        <h2 className="text-xl font-semibold mb-2">Commissions</h2>
        <p className="text-sm text-gray-600 mb-4">
          The accumulation of teaching hours <strong>doesn't</strong> depend on the service you teach.
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <div><p className="underline font-semibold mb-1">2 - 20 Teaching Hrs</p><p><span className="font-bold">24%</span> Bready commission &amp; charges</p></div>
          <div><p className="underline font-semibold mb-1">21 - 50 Teaching Hrs</p><p><span className="font-bold">22%</span> Bready commission &amp; charges</p></div>
          <div><p className="underline font-semibold mb-1">50+ Teaching Hrs</p><p><span className="font-bold">20%</span> Bready commission &amp; charges</p></div>
        </div>
        <div className="mt-4">
          <p className="text-lg font-semibold mb-2">Trial Lesson</p>
          <p><span className="font-bold">10%</span> Bready commission &amp; charges — only first lesson</p>
        </div>
      </SectionCard>

      <SectionCard editable={false}>
        <h2 className="text-xl font-semibold mb-2">Packages</h2>
        <p className="text-sm text-gray-600 mb-4">
          The accumulation of hours <strong>doesn't</strong> depend on the service you teach.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {['Consulting', 'Online Class', 'Technical Interview'].map((svc) => (
            <Card key={svc} className="border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-3">{svc}</h3>
                <div className="flex gap-2 mb-2">
                  <Select defaultValue="5">
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Hrs</SelectItem>
                      <SelectItem value="10">10 Hrs</SelectItem>
                      <SelectItem value="20">20 Hrs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Price" />
                </div>
                <Tabs defaultValue="5">
                  <TabsList>
                    <TabsTrigger value="5">5 Hrs</TabsTrigger>
                    <TabsTrigger value="10">10 Hrs</TabsTrigger>
                    <TabsTrigger value="20">20 Hrs</TabsTrigger>
                  </TabsList>
                  <TabsContent value="5" className="pt-3">
                    <p className="text-sm">Total $100 — after 24% fees receive <span className="text-blue-600 font-semibold">$76</span></p>
                  </TabsContent>
                  <TabsContent value="10" className="pt-3">
                    <p className="text-sm">Total $200 — after 22% fees receive <span className="text-blue-600 font-semibold">$156</span></p>
                  </TabsContent>
                  <TabsContent value="20" className="pt-3">
                    <p className="text-sm">Total $400 — after 20% fees receive <span className="text-blue-600 font-semibold">$320</span></p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- 5. Cancellation Policy ---------------- */
function CancellationPolicy() {
  const [feePct, setFeePct] = useState([0]);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Cancellation Policies If Student Cancels</h2>
      <SectionCard editable={false}>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border">
            <CardContent className="p-4">
              <h3 className="text-center font-semibold mb-3">Select Fees Commission</h3>
              <Label className="text-center block">Percentage</Label>
              <div className="text-center text-xl font-semibold mt-1 mb-2">{feePct[0]}%</div>
              <Slider value={feePct} onValueChange={setFeePct} min={0} max={100} step={1} />
              <label className="flex items-center gap-2 mt-4">
                <Checkbox defaultChecked /> No Refund
              </label>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <h3 className="text-center font-semibold mb-3">Free Cancellation Before Booking</h3>
              <div className="flex justify-center gap-3">
                <div className="text-center">
                  <Label>Day</Label>
                  <Input type="number" defaultValue="0" className="w-20 text-center mt-1" />
                </div>
                <span className="self-end pb-2">&amp;</span>
                <div className="text-center">
                  <Label>Hours</Label>
                  <Input type="number" defaultValue="0" className="w-20 text-center mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4">
              <h3 className="text-center font-semibold mb-3">Trial Lesson</h3>
              <p className="text-sm text-center text-gray-600">
                No cancellation fees will be taken for canceling a trial lesson. Only the first hour with a specific student.
              </p>
            </CardContent>
          </Card>
        </div>

        <h4 className="font-semibold mt-6 mb-2">Fees You Will Receive</h4>
        <p className="text-sm text-gray-600 mb-3">Including commission and charges.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { hrs: '2 - 20 Teaching Hrs', fee: '24%' },
            { hrs: '21 - 50 Teaching Hrs', fee: '22%' },
            { hrs: '50+ Teaching Hrs', fee: '20%' },
          ].map((t) => (
            <Card key={t.hrs} className="border">
              <CardContent className="p-4">
                <p className="underline text-sm">{t.hrs}</p>
                <p className="mb-3 mt-1">{t.fee} (Website Fees)</p>
                <p className="font-semibold mb-1">Receive</p>
                <ul className="text-sm space-y-1">
                  <li>Consulting <span className="text-blue-600 font-semibold">$15</span></li>
                  <li>Online Classes <span className="text-blue-600 font-semibold">$15</span></li>
                  <li>Technical Interview <span className="text-blue-600 font-semibold">$15</span></li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="font-semibold underline mt-5">Package Fees</p>
        <p className="text-sm text-gray-600">Same cancellation policies as regular hour.</p>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Penalty</h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
          <li>5 cancellations per 100 meetings (5% minimum) — ranking in teacher listing will decrease.</li>
          <li>More than 5 cancellations per 100 meetings — ranking will decrease with higher weight.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

/* ---------------- 6. Password ---------------- */
function Password() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Change Password</h2>
      <SectionCard editable={false}>
        <Label>E-mail Or Phone No.</Label>
        <Input type="email" placeholder="E-mail or phone no." className="mt-1 mb-4" />
        <Label>Current Password</Label>
        <Input type="password" className="mt-1 mb-4" />
        <Label>New Password</Label>
        <Input type="password" className="mt-1 mb-4" />
        <Label>Confirm New Password</Label>
        <Input type="password" className="mt-1 mb-4" />
        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-green-600 hover:bg-green-700">Save Password</Button>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- 7. Portfolio Pictures ---------------- */
function Portfolio() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Portfolio</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <label className="aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
          <Plus className="w-8 h-8 text-gray-400" />
          <input type="file" className="hidden" />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Add Photo<br />JPG or PNG (max. 5MB)
          </p>
        </label>
        {[1, 2, 3].map((n) => (
          <div key={n} className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded relative group">
            <button className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow opacity-0 group-hover:opacity-100 transition">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 8. Search Definitions ---------------- */
function SearchDefinitions() {
  const [rate, setRate] = useState([0, 200]);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Search Definitions</h2>
      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Speaks</h4>
        <Input placeholder="Type to search..." className="mb-3" />
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="gap-1">English <X className="w-3 h-3" /></Badge>
          <Badge variant="outline" className="gap-1">French <X className="w-3 h-3" /></Badge>
        </div>
        <div className="space-y-2">
          {['English', 'French', 'German', 'Spanish', 'Hindi'].map((l) => (
            <label key={l} className="flex items-center gap-2 text-sm">
              <Checkbox defaultChecked={l === 'English' || l === 'French'} /> {l}
            </label>
          ))}
        </div>
        <div className="text-right mt-3">
          <Button variant="link" size="sm" className="h-auto px-0">Reset</Button>
        </div>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Hourly Rate</h4>
        <div className="flex items-center gap-2 justify-center mb-3">
          <span>${rate[0]}</span><span>-</span><span>${rate[1]}</span><span>USD</span>
        </div>
        <Slider value={rate} onValueChange={setRate} min={0} max={200} step={1} />
        <div className="text-right mt-3">
          <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setRate([0, 200])}>Reset</Button>
        </div>
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Course</h4>
        <Label>Board</Label>
        <Input placeholder="Select board" className="mt-1 mb-3" />
        <Label>Exam</Label>
        <Input placeholder="Select exam" className="mt-1" />
      </SectionCard>

      <SectionCard editable={false}>
        <h4 className="font-semibold mb-3">Cancellation Fees</h4>
        <h3 className="text-sm font-semibold mb-2">Fees Percentage</h3>
        <Slider defaultValue={[0, 100]} min={0} max={100} step={1} />
        <h3 className="text-sm font-semibold mt-4 mb-2">Free Cancellation Before</h3>
        <div className="flex justify-center gap-3">
          <div className="text-center">
            <Label>Day</Label>
            <Input type="number" defaultValue="0" className="w-20 text-center mt-1" />
          </div>
          <span className="self-end pb-2">&amp;</span>
          <div className="text-center">
            <Label>Hours</Label>
            <Input type="number" defaultValue="0" className="w-20 text-center mt-1" />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- 9. Posts ---------------- */
function Posts() {
  const posts = [
    { id: 1, title: 'Student requirement / question', anon: true, specialization: 'Organic Chemistry', speaks: 'English', subjects: 'Chemistry', course: 'High School', experience: '3+ years', service: 'Consulting' },
    { id: 2, title: 'Student requirement / question', anon: false, specialization: 'Calculus', speaks: 'English, Spanish', subjects: 'Mathematics', course: 'University', experience: '5+ years', service: 'Online Class' },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">My Posts</h2>
      {posts.map((p) => (
        <SectionCard key={p.id} editable={false}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Student Post</h3>
            {p.anon && <Badge variant="outline">Anonymous</Badge>}
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Paperclip className="w-4 h-4 text-gray-500" />
            <a href="#" className="font-medium text-blue-600 hover:underline">{p.title}</a>
          </div>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <p><span className="font-semibold">Specialization:</span> {p.specialization}</p>
            <p><span className="font-semibold">Speaks At Least:</span> {p.speaks}</p>
            <p><span className="font-semibold">Subjects:</span> {p.subjects}</p>
            <p><span className="font-semibold">Course:</span> {p.course}</p>
            <p><span className="font-semibold">Experience Needed:</span> {p.experience}</p>
            <p><span className="font-semibold">Service:</span> {p.service}</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="border-green-500 text-green-700">Close Post</Button>
            <Button variant="ghost" className="text-gray-600">
              <RefreshCw className="w-4 h-4 mr-2" /> Repost
            </Button>
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

/* ---------------- 10. Invite Students ---------------- */
function InviteStudents({ user }) {
  const inviteLink = `https://bready.com/invite/${user?.id || 'you'}`;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Invite Students</h2>
      <SectionCard editable={false}>
        <h4 className="font-semibold mb-2">Reward Options</h4>
        <p className="text-sm text-gray-700 mb-3">
          1. Invite a student and receive a discount for this specific student — Bready will only take 12% on the transaction.
        </p>
        <div className="max-w-md">
          <Label>Share this link to receive discounts</Label>
          <div className="flex gap-2 mt-1 mb-4">
            <Input value={inviteLink} readOnly />
            <Button variant="outline"><Copy className="w-4 h-4" /></Button>
          </div>
          <Label>Share Email</Label>
          <div className="flex gap-2 mt-1">
            <Input type="email" placeholder="Enter email to share link" />
            <Button className="bg-green-600 hover:bg-green-700">Share</Button>
          </div>
        </div>
        <h4 className="font-semibold mt-5 mb-3">Share Via Social</h4>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" className="text-blue-600 border-blue-300"><Facebook className="w-4 h-4 mr-2" />Facebook</Button>
          <Button variant="outline" className="text-sky-500 border-sky-300"><Twitter className="w-4 h-4 mr-2" />Twitter</Button>
          <Button variant="outline" className="text-green-600 border-green-300"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</Button>
        </div>

        <p className="text-sm text-gray-700 mt-6 mb-3">
          2. Invite a friend and receive 300 credits on the website if they make a booking after a trial lesson.
          This applies only if the friend registers with your link and adds your referral code.
          <br /><br />
          You will get two types of notifications:<br />
          a. When a person registers via your referral code<br />
          b. When they book their second session
        </p>

        <h4 className="font-semibold mt-5">Your Invite Number On The Website</h4>
        <p className="text-gray-700">{user?.full_name || 'Your Name'} — {user?.id || '—'}</p>
      </SectionCard>
    </div>
  );
}

/* ---------------- 11. Support ---------------- */
function Support() {
  const faqs = [
    { q: 'How much time before I can cancel for free?', a: 'You can cancel up to 24 hours before a booking without any fees. After that, the cancellation policy kicks in based on your profile settings.' },
    { q: 'How do I withdraw my earnings?', a: 'Go to Payment settings, add a credit card or bank account, and click Withdraw Money. Processing takes 2–3 business days.' },
    { q: 'When will I be seen in the teacher listing?', a: 'After your profile is approved by admin and your availability is set up. Toggle off Vacation Mode to appear.' },
    { q: 'How do Bready commissions work?', a: '24% for the first 20 hrs taught, 22% for 21–50 hrs, 20% beyond 50 hrs. Trial lessons always have a 10% commission.' },
  ];
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Frequently Asked Questions</h2>
      <SectionCard editable={false}>
        <Tabs defaultValue="tchr">
          <TabsList>
            <TabsTrigger value="tchr">Teacher Support</TabsTrigger>
            <TabsTrigger value="stdnt">Student Support</TabsTrigger>
          </TabsList>
          <TabsContent value="tchr" className="pt-4">
            <Tabs defaultValue="start">
              <TabsList>
                <TabsTrigger value="start">Getting Started</TabsTrigger>
                <TabsTrigger value="interview">Interview</TabsTrigger>
                <TabsTrigger value="become">Become A Teacher</TabsTrigger>
              </TabsList>
              <TabsContent value="start" className="pt-4">
                <Accordion type="single" collapsible>
                  {faqs.map((f, i) => (
                    <AccordionItem key={i} value={`q-${i}`}>
                      <AccordionTrigger>{f.q}</AccordionTrigger>
                      <AccordionContent>{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
              <TabsContent value="interview" className="pt-4">
                <p className="text-sm text-gray-500">No interview FAQs yet.</p>
              </TabsContent>
              <TabsContent value="become" className="pt-4">
                <p className="text-sm text-gray-500">See the Become A Teacher page.</p>
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="stdnt" className="pt-4">
            <p className="text-sm text-gray-500">Student-focused FAQs coming soon.</p>
          </TabsContent>
        </Tabs>
        <h4 className="font-semibold mt-5">Support Number</h4>
        <p className="text-gray-700">Bready Support — +1 (555) 010-0000</p>
      </SectionCard>
    </div>
  );
}

/* ---------------- Page shell ---------------- */
export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [country, setCountry] = useState(null);
  const [active, setActive] = useState('personal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await User.me();
        if (cancelled) return;
        setUser(me);
        const [profs, countries] = await Promise.all([
          TeacherProfile.filter({ user_id: me.id }),
          Country.list(),
        ]);
        if (cancelled) return;
        setProfile(profs?.[0] || null);
        setCountry(countries.find((c) => c.country_code === me.country_code) || null);
      } catch (e) {
        console.error('MyProfile load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const hash = window.location.hash.replace('#', '');
    if (hash && SECTIONS.some((s) => s.id === hash)) setActive(hash);

    return () => { cancelled = true; };
  }, []);

  const selectSection = (id) => {
    setActive(id);
    window.history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const renderActive = () => {
    switch (active) {
      case 'personal': return <PersonalInformation user={user} country={country} profile={profile} />;
      case 'notifications': return <Notifications />;
      case 'payment': return <Payment />;
      case 'availability': return <AvailabilityPricing />;
      case 'cancellation': return <CancellationPolicy />;
      case 'password': return <Password />;
      case 'portfolio': return <Portfolio />;
      case 'search': return <SearchDefinitions />;
      case 'posts': return <Posts />;
      case 'invite': return <InviteStudents user={user} />;
      case 'support': return <Support />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <nav className="text-sm opacity-80">
            <Link to={createPageUrl('Home')} className="hover:text-blue-200 underline-offset-2 hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span>My Profile</span>
          </nav>
        </div>
      </div>

      <TeacherPageTabs activeTabValue="profile" />

      <div className="container mx-auto px-6 py-8">
        <div className="md:hidden mb-4">
          <Select value={active} onValueChange={selectSection}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SECTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-3">
            <nav className="bg-white border rounded shadow-sm sticky top-4">
              <ul>
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => selectSection(s.id)}
                      className={`w-full text-left px-4 py-3 text-sm border-l-4 transition ${
                        active === s.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-transparent hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className="md:col-span-9">{renderActive()}</main>
        </div>
      </div>
    </div>
  );
}
