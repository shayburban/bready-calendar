import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ChevronLeft,
  Star,
  Trash2,
  Printer,
  Reply,
  MessageSquare,
  Mail,
  Send,
  Bell,
  MoreVertical,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeacherInboxDetail() {
  const navigate = useNavigate();
  const [starred, setStarred] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">New Booking</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link
              to={createPageUrl('TeacherInbox')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Inbox
            </Link>
            <span className="mx-2">/</span>
            <span>New Booking</span>
          </nav>
        </div>
      </div>

      <TeacherPageTabs activeTabValue="inbox" />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('TeacherInbox'))}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Inbox
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setStarred(!starred)}
            >
              <Star
                className={`w-4 h-4 ${
                  starred ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Reply className="w-4 h-4 mr-2" />
              Reply to this message
            </Button>
          </div>
        </div>

        <Card className="mt-6 p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-1">Message Title Goes Here</h3>
          <p className="text-sm text-gray-600">From: name@example.com</p>
          <p className="text-sm text-gray-600">15 Aug. 2021, 04:04 PM</p>

          <div className="mt-4 text-gray-700 space-y-4 leading-relaxed">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              in scelerisque diam. Maecenas tortor mauris, condimentum at
              libero sed, porta condimentum nibh. Vestibulum malesuada congue
              odio, nec pharetra quam.
            </p>
            <p>
              Pellentesque ornare, neque quis placerat finibus, odio mauris
              tristique magna, in sodales diam diam ac nunc. Sed commodo
              pulvinar vulputate. Ut maximus quis justo non vehicula.
            </p>
            <p>
              Cras rhoncus tempor risus, ut scelerisque elit porta vel. Quisque
              pharetra, elit vel facilisis bibendum, risus ipsum condimentum
              eros, scelerisque euismod augue ipsum vel nulla.
            </p>
          </div>

          <h3 className="mt-6 text-lg font-semibold">Booking Information:</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full bg-white border text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-left text-gray-600">
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Date</th>
                  <th className="p-3 font-semibold">Time</th>
                  <th className="p-3 font-semibold">Service</th>
                  <th className="p-3 font-semibold">Referred Student</th>
                  <th className="p-3 font-semibold">Duration</th>
                  <th className="p-3 font-semibold">Price per Hour</th>
                  <th className="p-3 font-semibold">Total Cost</th>
                  <th className="p-3 font-semibold">Deposited</th>
                  <th className="p-3 font-semibold">Contact</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Bell className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-600">Transaction No. - 123456</p>
        </Card>
      </div>
    </div>
  );
}
