import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Pencil, Info } from 'lucide-react';

const SERVICE_OPTIONS = [
  { id: 'online', label: 'Online Classes' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'job-prep', label: 'Job Preparation' },
];

const CURRENCY_OPTIONS = [
  { value: '$', label: '$' },
  { value: '₹', label: '₹' },
  { value: '€', label: '€' },
];

const TOOLTIP_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever";

function InfoTip({ text = TOOLTIP_TEXT }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-400 text-[10px] font-semibold text-gray-500 hover:border-gray-600 hover:text-gray-700"
            aria-label="Info">
            i
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ServiceRadios({ value, onChange }) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
      {SERVICE_OPTIONS.map((s) => (
        <div key={s.id} className="flex items-center space-x-2">
          <RadioGroupItem id={`svc-${s.id}`} value={s.id} />
          <Label htmlFor={`svc-${s.id}`} className="text-sm text-gray-700">
            {s.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function CurrentPriceLine({ label, value, editable }) {
  return (
    <div className="flex items-center flex-wrap gap-2 text-sm">
      <span className="font-semibold text-gray-600">{label}:</span>
      <span className="text-gray-800">{value}</span>
      {editable && (
        <>
          <InfoTip />
          <Button variant="outline" size="icon" className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

function CurrentPriceBlock({ showLastUpdate = true }) {
  return (
    <div className="space-y-2">
      <p className="font-semibold text-sm text-gray-800 flex items-center">
        Current Price
      </p>
      <Tabs defaultValue="hr" className="w-full">
        <TabsList className="bg-transparent p-0 h-auto gap-2">
          <TabsTrigger
            value="hr"
            className="border border-gray-300 rounded-full px-3 py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600">
            Hours
          </TabsTrigger>
          <TabsTrigger
            value="pkg"
            className="border border-gray-300 rounded-full px-3 py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600">
            Packages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="hr" className="mt-3 space-y-2">
          <CurrentPriceLine label="Online Classes" value="10 $ for 1 Hr." />
          <CurrentPriceLine label="Consulting" value="10 $ for 1 Hr." />
          <CurrentPriceLine label="Technical Interview" value="10 $ for 1 Hr." />
          <CurrentPriceLine label="Trial Lesson" value="5 $ for 1 Hr." editable />
          <CurrentPriceLine label="Cancelation Fees" value="50% from 12 Hr." editable />
          {showLastUpdate && (
            <p className="text-sm">
              <span className="font-semibold text-gray-600">Last Update:</span>{' '}
              <span className="text-gray-800">02.08.2021</span>
            </p>
          )}
        </TabsContent>
        <TabsContent value="pkg" className="mt-3 space-y-2">
          <CurrentPriceLine label="Online Classes" value="10 $ for 1 Hr." />
          <CurrentPriceLine label="Consulting" value="10 $ for 1 Hr." />
          <CurrentPriceLine label="Technical Interview" value="10 $ for 1 Hr." />
          <CurrentPriceLine label="Trial Lesson" value="5 $ for 1 Hr." editable />
          <CurrentPriceLine label="Cancelation Fees" value="50% from 12 Hr." editable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HoursPane() {
  const [service, setService] = useState('online');
  const [price, setPrice] = useState('20');
  const [currency, setCurrency] = useState('$');

  return (
    <div className="space-y-4 pt-2">
      <ServiceRadios value={service} onChange={setService} />
      <div className="flex w-full max-w-xs">
        <Input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-r-none"
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-20 rounded-l-none border-l-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-green-600 hover:bg-green-700">Save Price</Button>
      </div>
      <CurrentPriceBlock showLastUpdate />
    </div>
  );
}

function PackagesPane() {
  const [service, setService] = useState('online');
  const [hours, setHours] = useState('15');
  const [price, setPrice] = useState('1000');
  const [currency, setCurrency] = useState('$');

  return (
    <div className="space-y-4 pt-2">
      <ServiceRadios value={service} onChange={setService} />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={hours} onValueChange={setHours}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="25">25</SelectItem>
          </SelectContent>
        </Select>
        <span className="inline-flex h-10 items-center rounded-md bg-gray-100 px-3 text-sm text-gray-700 border border-gray-200">
          Hrs.
        </span>
        <div className="flex flex-1 min-w-[8rem]">
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-r-none"
          />
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-20 rounded-l-none border-l-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-green-600 hover:bg-green-700">Save Price</Button>
      </div>
      <CurrentPriceBlock showLastUpdate={false} />
    </div>
  );
}

export default function CalendarSetPricePanel() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <h4 className="text-lg font-bold text-gray-800">Set Price</h4>
      <p className="font-semibold text-sm text-gray-800 flex items-center">
        Select Price
        <InfoTip />
      </p>
      <Tabs defaultValue="hours" className="w-full">
        <TabsList className="bg-transparent p-0 h-auto gap-2">
          <TabsTrigger
            value="hours"
            className="border border-gray-300 rounded-full px-3 py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600">
            Hours
          </TabsTrigger>
          <TabsTrigger
            value="packages"
            className="border border-gray-300 rounded-full px-3 py-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600">
            Packages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="hours">
          <HoursPane />
        </TabsContent>
        <TabsContent value="packages">
          <PackagesPane />
        </TabsContent>
      </Tabs>
    </div>
  );
}
