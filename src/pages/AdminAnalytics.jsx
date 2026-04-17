import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Booking } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Calendar,
  Download,
  Brain,
  Calculator,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import DateRangePicker from '../components/common/DateRangePicker';

// Statistical calculation helper functions
const calculateCancellationRate = (cancelledSessions, totalSessions) => {
  if (totalSessions === 0) return 0;
  return (cancelledSessions / totalSessions) * 100;
};

const calculateWeightedCancellationScore = (factors) => {
  const {
    userPastCancellationRate = 0,
    leadTimeFactor = 0,
    timeOfDayScore = 0,
    tutorReliabilityScore = 0,
    userEngagementScore = 0,
    seasonalityFactor = 0,
    priceSensitivityScore = 0
  } = factors;

  return (
    (userPastCancellationRate * 0.35) +
    (leadTimeFactor * 0.15) +
    (timeOfDayScore * 0.10) +
    (tutorReliabilityScore * 0.10) +
    (userEngagementScore * 0.10) +
    (seasonalityFactor * 0.10) +
    (priceSensitivityScore * 0.10)
  );
};

const calculatePeakHourScore = (factors) => {
  const {
    historicalPeakFactor = 0,
    dayOfWeekFactor = 0,
    seasonalityFactor = 0,
    eventFactor = 0,
    userCategoryFactor = 0,
    externalFactor = 0
  } = factors;

  return (
    (historicalPeakFactor * 0.40) +
    (dayOfWeekFactor * 0.20) +
    (seasonalityFactor * 0.15) +
    (eventFactor * 0.10) +
    (userCategoryFactor * 0.10) +
    (externalFactor * 0.05)
  );
};

export default function AdminAnalytics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState('standard');
  const [granularity, setGranularity] = useState('month');
  
  // Filter states
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [userIdFilter, setUserIdFilter] = useState('');
  const [tutorIdFilter, setTutorIdFilter] = useState('');
  
  // Data states
  const [bookingData, setBookingData] = useState([]);
  const [analyticsResults, setAnalyticsResults] = useState(null);
  const [aiResults, setAiResults] = useState(null);
  const [isRunningAI, setIsRunningAI] = useState(false);
  
  // AI confirmation dialogs
  const [showFirstAlert, setShowFirstAlert] = useState(false);
  const [showSecondAlert, setShowSecondAlert] = useState(false);
  
  const AI_COST = 15; // Simulated cost in dollars

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
      }
    };
    fetchUser();
  }, []);

  const fetchBookingData = async () => {
    setLoading(true);
    try {
      let bookings = await Booking.list('-created_date', 1000);
      
      // Apply filters
      if (userIdFilter) {
        bookings = bookings.filter(b => b.student_id === userIdFilter);
      }
      if (tutorIdFilter) {
        bookings = bookings.filter(b => b.tutor_id === tutorIdFilter);
      }
      if (dateRange.from && dateRange.to) {
        bookings = bookings.filter(b => {
          const bookingDate = new Date(b.start_time);
          return bookingDate >= dateRange.from && bookingDate <= dateRange.to;
        });
      }
      
      setBookingData(bookings);
      calculateStandardAnalytics(bookings);
    } catch (error) {
      console.error('Failed to fetch booking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStandardAnalytics = (bookings) => {
    const totalSessions = bookings.length;
    const cancelledSessions = bookings.filter(b => b.status === 'cancelled').length;
    const completedSessions = bookings.filter(b => b.status === 'completed').length;
    const pendingSessions = bookings.filter(b => b.status === 'pending').length;
    
    const cancellationRate = calculateCancellationRate(cancelledSessions, totalSessions);
    
    // Calculate peak hours
    const hourlyBookings = {};
    bookings.forEach(booking => {
      const hour = new Date(booking.start_time).getHours();
      hourlyBookings[hour] = (hourlyBookings[hour] || 0) + 1;
    });
    
    const peakHour = Object.entries(hourlyBookings).reduce((peak, [hour, count]) => {
      return count > peak.count ? { hour: parseInt(hour), count } : peak;
    }, { hour: 0, count: 0 });

    // Generate time-series data based on granularity
    const timeSeriesData = generateTimeSeriesData(bookings, granularity);
    
    // Calculate weighted scores (with mock factors for demonstration)
    const mockFactors = {
      userPastCancellationRate: 0.15,
      leadTimeFactor: 0.25,
      timeOfDayScore: 0.60,
      tutorReliabilityScore: 0.80,
      userEngagementScore: 0.70,
      seasonalityFactor: 0.45,
      priceSensitivityScore: 0.30
    };
    
    const weightedCancellationScore = calculateWeightedCancellationScore(mockFactors);
    const peakHourScore = calculatePeakHourScore({
      historicalPeakFactor: 0.75,
      dayOfWeekFactor: 0.60,
      seasonalityFactor: 0.45,
      eventFactor: 0.20,
      userCategoryFactor: 0.65,
      externalFactor: 0.10
    });

    setAnalyticsResults({
      overview: {
        totalSessions,
        cancelledSessions,
        completedSessions,
        pendingSessions,
        cancellationRate,
        peakHour,
        weightedCancellationScore,
        peakHourScore
      },
      timeSeriesData,
      hourlyBookings: Object.entries(hourlyBookings).map(([hour, count]) => ({
        hour: parseInt(hour),
        bookings: count,
        label: `${hour}:00`
      }))
    });
  };

  const generateTimeSeriesData = (bookings, granularity) => {
    const data = {};
    
    bookings.forEach(booking => {
      const date = new Date(booking.start_time);
      let key;
      
      switch (granularity) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!data[key]) {
        data[key] = { total: 0, cancelled: 0, completed: 0 };
      }
      
      data[key].total++;
      if (booking.status === 'cancelled') data[key].cancelled++;
      if (booking.status === 'completed') data[key].completed++;
    });
    
    return Object.entries(data).map(([period, stats]) => ({
      period,
      ...stats,
      cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0
    })).sort((a, b) => a.period.localeCompare(b.period));
  };

  const handleRunAIPredictions = () => {
    setShowFirstAlert(true);
  };

  const confirmFirstAlert = () => {
    setShowFirstAlert(false);
    setShowSecondAlert(true);
  };

  const confirmSecondAlert = async () => {
    setShowSecondAlert(false);
    setIsRunningAI(true);
    
    try {
      // Prepare data for LLM
      const aggregatedData = {
        totalBookings: bookingData.length,
        cancellationRate: analyticsResults?.overview.cancellationRate || 0,
        bookingsByHour: analyticsResults?.hourlyBookings || [],
        timeSeriesData: analyticsResults?.timeSeriesData || [],
        dateRange: {
          from: dateRange.from?.toISOString() || 'not specified',
          to: dateRange.to?.toISOString() || 'not specified'
        }
      };

      // Cancellation prediction
      const cancellationPrompt = `Based on the following historical booking and cancellation data: ${JSON.stringify(aggregatedData)}, predict the cancellation rate trends for the next 30 days. Consider factors like booking lead time, time of day patterns, seasonal trends, and user behavior patterns. Provide specific predictions and confidence scores.`;
      
      const cancellationPrediction = await InvokeLLM({
        prompt: cancellationPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_cancellation_rate: { type: "number" },
            confidence_score: { type: "number", minimum: 0, maximum: 1 },
            trend_analysis: { type: "string" },
            suggested_admin_actions: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Peak hours forecasting
      const peakHoursPrompt = `Analyze the following booking time patterns: ${JSON.stringify(aggregatedData)} and predict the peak booking hours for the next 7 days. Consider day-of-week patterns, seasonal factors, and user behavior trends.`;
      
      const peakHoursPrediction = await InvokeLLM({
        prompt: peakHoursPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            forecasted_peak_hours_data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "string" },
                  peak_hour: { type: "number" },
                  predicted_bookings: { type: "number" },
                  confidence: { type: "number" }
                }
              }
            },
            confidence_score: { type: "number" },
            suggested_admin_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiResults({
        cancellation: cancellationPrediction,
        peakHours: peakHoursPrediction,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('AI prediction failed:', error);
      alert('AI prediction failed. Please try again.');
    } finally {
      setIsRunningAI(false);
    }
  };

  const exportToCSV = () => {
    const csvData = analyticsResults?.timeSeriesData || [];
    const headers = ['Period', 'Total Sessions', 'Cancelled', 'Completed', 'Cancellation Rate'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => [
        row.period,
        row.total,
        row.cancelled,
        row.completed,
        row.cancellationRate.toFixed(2)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    // Simplified PDF export - in a real app, you'd use a library like jsPDF
    alert('PDF export would be implemented with a library like jsPDF');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Advanced booking and user behavior analytics</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Mode Selection */}
        <Tabs value={activeMode} onValueChange={setActiveMode} className="mb-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="standard" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Standard Mode (Free)
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Prediction Mode
            </TabsTrigger>
          </TabsList>

          {/* Filters Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Filters & Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <DateRangePicker
                    onRangeChange={(range) => setDateRange(range)}
                    onAdd={() => {}}
                    onRemove={() => {}}
                    isOnlyRow={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">User ID</label>
                  <Input
                    placeholder="Filter by user ID"
                    value={userIdFilter}
                    onChange={(e) => setUserIdFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tutor ID</label>
                  <Input
                    placeholder="Filter by tutor ID"
                    value={tutorIdFilter}
                    onChange={(e) => setTutorIdFilter(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Granularity</label>
                  <Select value={granularity} onValueChange={setGranularity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Daily</SelectItem>
                      <SelectItem value="week">Weekly</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={fetchBookingData} className="mt-4" disabled={loading}>
                {loading ? 'Loading...' : 'Apply Filters & Calculate'}
              </Button>
            </CardContent>
          </Card>

          {/* Standard Mode Content */}
          <TabsContent value="standard" className="space-y-6">
            {analyticsResults && (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsResults.overview.totalSessions}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {analyticsResults.overview.cancellationRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Weighted Score: {analyticsResults.overview.weightedCancellationScore.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
                      <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analyticsResults.overview.peakHour.hour}:00</div>
                      <div className="text-xs text-muted-foreground">
                        {analyticsResults.overview.peakHour.count} bookings
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Peak Score: {analyticsResults.overview.peakHourScore.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {analyticsResults.overview.totalSessions > 0 
                          ? ((analyticsResults.overview.completedSessions / analyticsResults.overview.totalSessions) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancellation Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analyticsResults.timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="cancellationRate" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Peak Hours Heatmap</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsResults.hourlyBookings}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="bookings" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Analytics by {granularity}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Total Sessions</TableHead>
                          <TableHead>Cancelled</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Cancellation Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analyticsResults.timeSeriesData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.period}</TableCell>
                            <TableCell>{row.total}</TableCell>
                            <TableCell>{row.cancelled}</TableCell>
                            <TableCell>{row.completed}</TableCell>
                            <TableCell>
                              <Badge variant={row.cancellationRate > 20 ? "destructive" : "secondary"}>
                                {row.cancellationRate.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* AI Prediction Mode Content */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Prediction Mode
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Advanced AI-powered forecasting and predictions using machine learning models.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">Run AI Predictions</h3>
                      <p className="text-sm text-gray-600">
                        Generate AI-powered forecasts for cancellation rates and peak hours
                      </p>
                    </div>
                    <Button 
                      onClick={handleRunAIPredictions}
                      disabled={isRunningAI || !analyticsResults}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isRunningAI ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Running AI...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Run AI Prediction (${AI_COST})
                        </>
                      )}
                    </Button>
                  </div>

                  {aiResults && (
                    <div className="space-y-6">
                      {/* AI Prediction Results */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-green-600">Cancellation Predictions</CardTitle>
                            <Badge variant="outline">
                              Confidence: {(aiResults.cancellation.confidence_score * 100).toFixed(1)}%
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="text-2xl font-bold text-red-600">
                                  {aiResults.cancellation.predicted_cancellation_rate.toFixed(1)}%
                                </div>
                                <p className="text-sm text-gray-600">Predicted cancellation rate</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Trend Analysis:</h4>
                                <p className="text-sm">{aiResults.cancellation.trend_analysis}</p>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Risk Factors:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                  {aiResults.cancellation.risk_factors?.map((risk, index) => (
                                    <li key={index} className="text-sm text-red-600">{risk}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-blue-600">Peak Hours Forecast</CardTitle>
                            <Badge variant="outline">
                              Confidence: {(aiResults.peakHours.confidence_score * 100).toFixed(1)}%
                            </Badge>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Peak Hour</TableHead>
                                    <TableHead>Predicted Bookings</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {aiResults.peakHours.forecasted_peak_hours_data?.map((forecast, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{forecast.day}</TableCell>
                                      <TableCell>{forecast.peak_hour}:00</TableCell>
                                      <TableCell>{forecast.predicted_bookings}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Admin Action Suggestions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-purple-600">AI-Generated Admin Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-3">Cancellation Reduction Actions:</h4>
                              <ul className="space-y-2">
                                {aiResults.cancellation.suggested_admin_actions?.map((action, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-3">Peak Hours Optimization:</h4>
                              <ul className="space-y-2">
                                {aiResults.peakHours.suggested_admin_actions?.map((action, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Confirmation Dialogs */}
      <AlertDialog open={showFirstAlert} onOpenChange={setShowFirstAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              AI Predictions Cost
            </AlertDialogTitle>
            <AlertDialogDescription>
              Running AI predictions will cost ${AI_COST}. This includes advanced cancellation forecasting and peak hours analysis using machine learning models. Do you wish to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFirstAlert}>
              Proceed to Confirmation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSecondAlert} onOpenChange={setShowSecondAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Final Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription>
              <strong>Confirm payment of ${AI_COST} to run AI predictions?</strong>
              <br />
              This action will charge your account and generate comprehensive AI-powered analytics including trend forecasting, risk analysis, and optimization recommendations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSecondAlert} className="bg-red-600 hover:bg-red-700">
              Confirm & Run AI Predictions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}