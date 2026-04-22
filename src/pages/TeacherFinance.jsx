import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Info,
  Search,
  X,
  ChevronDown,
  CalendarDays,
  Wallet,
  Package,
  CreditCard,
  CheckCircle2,
  XCircle,
  Banknote,
  Receipt,
  Users,
  Printer,
  MessageSquare,
  Mail,
  Send,
  Bell,
  MoreVertical,
} from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FILTER_OPTIONS = ['UPI', 'PayPal', 'Razorpay'];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const LEGENDS = [
  { label: 'Legend 1', color: 'bg-blue-500' },
  { label: 'Legend 2', color: 'bg-green-500' },
  { label: 'Legend 3', color: 'bg-orange-400' },
  { label: 'Legend 4', color: 'bg-pink-400' },
  { label: 'Legend 5', color: 'bg-red-500' },
];

const WALLET_CARDS = {
  month: [
    {
      kind: 'split',
      icon: 'wallet',
      title: 'Balance (400$)',
      left: { h: 'Amount To Withdraw', v: '200 $' },
      right: { h: 'Credit', v: '200 $' },
    },
    {
      kind: 'split',
      icon: 'package',
      title: 'Packages',
      left: { h: 'As A Student', v: 'Left 200 $', link: 'MyProfile' },
      right: { h: 'As A Teacher', v: 'Credit 200 $', link: 'MyProfile' },
    },
    {
      kind: 'split',
      icon: 'credit',
      title: 'Pending',
      left: { h: 'As A Student (S)', v: '200 $' },
      right: { h: 'As A Teacher (T)', v: '200 $' },
    },
    {
      kind: 'split',
      icon: 'red-dot',
      title: 'Not Reviewed',
      left: { h: 'Not Received (T)', v: '200 $', link: 'TeacherTasks' },
      right: { h: 'Not Released (S)', v: '200 $', link: 'TeacherTasks' },
    },
    { kind: 'single', icon: 'check', title: 'Completed (T)', value: '200 $' },
    { kind: 'single', icon: 'xmark', title: 'Cancelled (T)', value: '200 $' },
    { kind: 'single', icon: 'refund', title: 'Refund (S)', value: '200 $' },
    { kind: 'single', icon: 'tax', title: 'Taxes (T)', value: '200 $' },
    {
      kind: 'split',
      icon: 'referral',
      title: 'Referrals',
      left: { h: 'Commission (T)', v: '200 $', link: 'TeacherTasks' },
      right: { h: 'Extra', v: '200 $', link: 'TeacherTasks' },
    },
  ],
};
WALLET_CARDS.week = WALLET_CARDS.month;
WALLET_CARDS.entire = WALLET_CARDS.month;

const TRANSACTIONS = [
  {
    id: 'txn-1',
    name: 'Josh C.',
    date: '8 Nov. 21',
    status: 'Payment Withdraw',
    amount: '200 $',
    txnNo: '123456789',
  },
  {
    id: 'txn-2',
    name: 'Mary K.',
    date: '15 Oct. 21',
    status: 'Payment Withdraw',
    amount: '180 $',
    txnNo: '123456790',
  },
  {
    id: 'txn-3',
    name: 'Daniel R.',
    date: '3 Oct. 21',
    status: 'Payment Withdraw',
    amount: '240 $',
    txnNo: '123456791',
  },
];

function CardIcon({ kind }) {
  const cls = 'w-6 h-6';
  switch (kind) {
    case 'wallet':
      return <Wallet className={`${cls} text-blue-600`} />;
    case 'package':
      return <Package className={`${cls} text-amber-600`} />;
    case 'credit':
      return <CreditCard className={`${cls} text-blue-600`} />;
    case 'red-dot':
      return <span className="inline-block w-5 h-5 rounded-full bg-red-500" />;
    case 'check':
      return <CheckCircle2 className={`${cls} text-emerald-600`} />;
    case 'xmark':
      return <XCircle className={`${cls} text-gray-500`} />;
    case 'refund':
      return <Banknote className={`${cls} text-green-600`} />;
    case 'tax':
      return <Receipt className={`${cls} text-orange-600`} />;
    case 'referral':
      return <Users className={`${cls} text-purple-600`} />;
    default:
      return null;
  }
}

function FilterChip({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded text-sm text-gray-700">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-700 leading-none"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function WalletCardsGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {cards.map((c, i) => (
        <Card key={i} className="p-4 shadow-sm flex flex-col text-center">
          <div className="flex items-center justify-center gap-2 border-b pb-3">
            <CardIcon kind={c.icon} />
            <h4 className="text-base font-semibold text-gray-900">{c.title}</h4>
          </div>
          {c.kind === 'split' ? (
            <div className="flex mt-1">
              <div className="flex-1 p-3 border-r">
                <h5 className="text-sm font-semibold text-gray-700 mb-1">
                  {c.left.h}
                </h5>
                <p className="text-sm text-gray-800">{c.left.v}</p>
                {c.left.link && (
                  <Link
                    to={createPageUrl(c.left.link)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All
                  </Link>
                )}
              </div>
              <div className="flex-1 p-3">
                <h5 className="text-sm font-semibold text-gray-700 mb-1">
                  {c.right.h}
                </h5>
                <p className="text-sm text-gray-800">{c.right.v}</p>
                {c.right.link && (
                  <Link
                    to={createPageUrl(c.right.link)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View All
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3">
              <p className="text-gray-800">{c.value}</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function RoleDropdown() {
  const [value, setValue] = useState('All');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-white">
          {value}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setValue('All')}>All</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setValue('As A Teacher (T)')}>
          As A Teacher (T)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setValue('As A Student (S)')}>
          As A Student (S)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterPanel({ showAmountWithdrawn }) {
  const [filterSelections, setFilterSelections] = useState({
    UPI: true,
    PayPal: false,
    Razorpay: false,
  });
  const [filterSearch, setFilterSearch] = useState('');
  const [chips, setChips] = useState(['UPI', 'PayPal']);
  const [fromDate, setFromDate] = useState('');
  const [untilDate, setUntilDate] = useState('');

  const filteredOptions = useMemo(
    () =>
      FILTER_OPTIONS.filter((o) =>
        o.toLowerCase().includes(filterSearch.toLowerCase())
      ),
    [filterSearch]
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Label className="text-sm font-medium text-gray-700 mb-0">
          Filter by
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="w-5 h-5 rounded-full border border-gray-400 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-100"
              >
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              Filter finance data by payment method and date range.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>Select Filter</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="px-4 py-3 border-b">
            <h4 className="font-semibold">Select Filter</h4>
          </div>
          <div className="p-3 space-y-3 max-h-72 overflow-auto">
            <Input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search"
              className="h-9"
            />
            {filteredOptions.map((opt) => (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
              >
                <Checkbox
                  checked={!!filterSelections[opt]}
                  onCheckedChange={(val) =>
                    setFilterSelections({
                      ...filterSelections,
                      [opt]: !!val,
                    })
                  }
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((label, i) => (
            <FilterChip
              key={`${label}-${i}`}
              label={label}
              onRemove={() => setChips(chips.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div>
          <Label className="text-sm mb-1 block">From</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm mb-1 block">Until</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={untilDate}
              onChange={(e) => setUntilDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="secondary">Set Period</Button>
        <Button variant="outline">Entire Time</Button>
      </div>

      {showAmountWithdrawn && (
        <div className="mt-8">
          <h4 className="text-base font-semibold text-gray-900">
            Amount Withdrawn
          </h4>
          <p className="text-lg font-bold text-blue-600 mt-1">200 $</p>
        </div>
      )}
    </div>
  );
}

function GraphPanel({ prefix }) {
  const [graphTab, setGraphTab] = useState('month');
  const [activeMonth, setActiveMonth] = useState(0);
  const [activeDay, setActiveDay] = useState(3);

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div>
      <Tabs value={graphTab} onValueChange={setGraphTab}>
        <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
          <TabsTrigger
            value="month"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Month
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Week
          </TabsTrigger>
          <TabsTrigger
            value="entire"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Entire Time
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          {MONTHS.map((m, i) => (
            <span
              key={`${prefix}-m-${m}`}
              className={i === activeMonth ? 'text-blue-600' : ''}
            >
              {m}
            </span>
          ))}
        </div>
        <div className="flex justify-between mt-2 gap-1">
          {MONTHS.map((_, i) => (
            <button
              key={`${prefix}-bar-${i}`}
              onClick={() => setActiveMonth(i)}
              className={`flex-1 h-2 rounded ${
                i === activeMonth
                  ? 'bg-blue-600'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`Select ${MONTHS[i]}`}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-10 gap-2">
          {days.map((d) => (
            <button
              key={`${prefix}-d-${d}`}
              onClick={() => setActiveDay(d)}
              className={`aspect-square rounded flex items-center justify-center text-sm border transition-colors ${
                d === activeDay
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatisticsChart() {
  return (
    <Card className="p-4 shadow-sm mt-6">
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600"
            >
              <ChevronDown className="w-4 h-4" />
              Legend
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <ul className="space-y-2">
              {LEGENDS.map((l) => (
                <li key={l.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${l.color}`}
                  />
                  <span>{l.label}</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 h-64 bg-gradient-to-b from-blue-50 to-white border rounded relative overflow-hidden">
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <polyline
            points="0,150 40,120 80,130 120,90 160,110 200,70 240,85 280,50 320,65 360,40 400,55"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          />
          <polyline
            points="0,170 40,160 80,140 120,155 160,130 200,140 240,115 280,125 320,100 360,110 400,90"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          />
          <polyline
            points="0,180 40,175 80,165 120,170 160,160 200,165 240,155 280,160 320,145 360,150 400,140"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
          />
        </svg>
      </div>
    </Card>
  );
}

function TransactionDetails() {
  return (
    <div className="border-t pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <h4 className="text-base font-semibold text-gray-900">Seller Info</h4>
          <p className="text-sm text-gray-600 mb-4">
            Lorem Ipsum is simply dummy text
          </p>
          <h4 className="text-base font-semibold text-gray-900">Status</h4>
          <p className="text-sm text-gray-600 mb-4">Payment Withdraw (All)</p>
          <h4 className="text-base font-semibold text-gray-900">
            Purchase Details
          </h4>
          <table className="w-full text-sm mt-2">
            <tbody>
              <tr>
                <td className="py-1 font-semibold">Subtotal:</td>
                <td className="py-1 text-right">9Hrs. 3 Meetings 3 Days</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Calculation:</td>
                <td className="py-1 text-right">9Hrs. * 90$ = 300$</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold flex items-center gap-2">
                  Added Taxes:
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="w-4 h-4 rounded-full border border-gray-400 text-gray-500 text-xs flex items-center justify-center"
                        >
                          <Info className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        Tax is calculated based on your region.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </td>
                <td className="py-1 text-right">20$</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">Discount:</td>
                <td className="py-1 text-right text-red-600">-20$</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold">
                  Cancellation Fees (30%):
                </td>
                <td className="py-1 text-right">20$</td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="pt-1 pb-2 text-xs text-gray-500"
                >
                  (Free Cancellation before 23:59 on 10 Dec. 2021)
                </td>
              </tr>
              <tr className="border-t">
                <td className="pt-2 font-semibold">Total Cost:</td>
                <td className="pt-2 text-right">
                  <span className="text-blue-600 font-semibold">300$</span> USD
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <h4 className="text-base font-semibold text-gray-900">Paid With</h4>
          <p className="text-sm text-gray-600 mb-4">
            VISA Credit Card: 1234
            <br />
            You'll see PAYPAL SERVICES on your card statement
          </p>
          <h4 className="text-base font-semibold text-gray-900">
            Exchange Rate
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            2000 ₹ = 30 $<br />1 ₹ = .0312 $
          </p>
          <h4 className="text-base font-semibold text-gray-900">
            Transaction ID
          </h4>
          <p className="text-sm text-gray-600 mb-4">12345678</p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
          >
            <Printer className="w-4 h-4" />
            Print Details
          </a>
          <h4 className="mt-4 text-base font-semibold text-gray-900">
            Need Help?
          </h4>
          <p className="text-sm text-gray-600">
            If there's a problem, make sure to contact the teacher through
            Bready by 7 May 2022.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full bg-white border text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-gray-600">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Time</th>
              <th className="p-3 font-semibold">Service</th>
              <th className="p-3 font-semibold whitespace-nowrap">
                Referred Student
              </th>
              <th className="p-3 font-semibold">Duration</th>
              <th className="p-3 font-semibold whitespace-nowrap">
                Price per Hour
              </th>
              <th className="p-3 font-semibold">Total Cost</th>
              <th className="p-3 font-semibold whitespace-nowrap">
                Money Deposited
              </th>
              <th className="p-3 font-semibold">Contact</th>
              <th className="p-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3 whitespace-nowrap">John Doe</td>
              <td className="p-3">
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
                  Booked(T)
                </span>
              </td>
              <td className="p-3 whitespace-nowrap">16.08.2021</td>
              <td className="p-3 whitespace-nowrap">09:00 – 14:00</td>
              <td className="p-3 whitespace-nowrap">Online Classes</td>
              <td className="p-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </td>
              <td className="p-3 whitespace-nowrap">5 Hours</td>
              <td className="p-3 whitespace-nowrap">10 $</td>
              <td className="p-3 whitespace-nowrap">5 * 10 $ = 50 $</td>
              <td className="p-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Bell className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8">
                    Cancel
                  </Button>
                  <Button variant="outline" size="sm" className="h-8">
                    Reschedule
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsAccordion() {
  return (
    <Accordion type="single" collapsible className="mt-4">
      {TRANSACTIONS.map((t) => (
        <AccordionItem
          key={t.id}
          value={t.id}
          className="bg-white border rounded mb-2"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex justify-between items-center w-full pr-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                  {t.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">{t.name}</h4>
                  <p className="text-xs text-gray-500">{t.date}</p>
                  <p className="text-xs text-gray-500">Status: {t.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold mb-1">{t.amount}</p>
                <p className="text-xs text-gray-500">
                  Transaction No: {t.txnNo}
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <TransactionDetails />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export default function TeacherFinance() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('month');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Teacher Finance</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Teacher Finance</span>
          </nav>
        </div>
      </div>

      <TeacherPageTabs activeTabValue="finance" />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Wallet &amp; Payments (T)
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
              <TabsTrigger
                value="month"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
              >
                Month
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="entire"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
              >
                Entire Time
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <RoleDropdown />
        </div>

        <Tabs value={activeTab}>
          <TabsContent value="month" className="mt-0">
            <WalletCardsGrid cards={WALLET_CARDS.month} />
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            <WalletCardsGrid cards={WALLET_CARDS.week} />
          </TabsContent>
          <TabsContent value="entire" className="mt-0">
            <WalletCardsGrid cards={WALLET_CARDS.entire} />
          </TabsContent>
        </Tabs>

        <Card className="p-4 shadow-sm mt-10">
          <div className="flex justify-end mb-3">
            <RoleDropdown />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <FilterPanel showAmountWithdrawn />
            </div>
            <div className="lg:col-span-8">
              <GraphPanel prefix="wallet" />
            </div>
          </div>
          <StatisticsChart />
        </Card>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Transactions
        </h2>

        <Card className="p-4 shadow-sm">
          <div className="flex justify-end mb-3">
            <RoleDropdown />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <FilterPanel showAmountWithdrawn={false} />
            </div>
            <div className="lg:col-span-8">
              <GraphPanel prefix="txn" />
            </div>
          </div>

          <TransactionsAccordion />
        </Card>
      </div>
    </div>
  );
}
