import React, { useState, useEffect, useMemo, Fragment } from 'react';
import { PendingData } from '@/api/entities';
import { PendingCity } from '@/api/entities';
import { TeacherProfile } from '@/api/entities';
import { Country } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
    Check, 
    X, 
    Brain, 
    Activity, 
    Clock, 
    Filter, 
    Search,
    GripVertical,
    Save,
    RotateCcw,
    Trash2,
    RotateCw,
    Download,
    AlertCircle,
    Calendar,
    User,
    FileX,
    Archive
} from 'lucide-react';
import TabSelector from '../components/common/TabSelector';

const DEFAULT_DATA_COLUMNS = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'type', label: 'Type' },
  { id: 'value', label: 'Value' },
  { id: 'context', label: 'Context' },
  { id: 'ai_recommendation', label: 'AI Recommendation' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_CITY_COLUMNS = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'country', label: 'Country' },
  { id: 'city', label: 'City Name' },
  { id: 'timezone', label: 'Timezone' },
  { id: 'ai_recommendation', label: 'AI Recommendation' },
  { id: 'actions', label: 'Actions' },
];

const RECYCLE_BIN_DATA_COLUMNS = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'type', label: 'Type' },
  { id: 'value', label: 'Value' },
  { id: 'rejection_reason', label: 'Rejection Reason' },
  { id: 'rejected_by', label: 'Rejected By' },
  { id: 'rejected_date', label: 'Rejection Date' },
  { id: 'expires_in', label: 'Expires In' },
  { id: 'actions', label: 'Actions' },
];

const RECYCLE_BIN_CITY_COLUMNS = [
  { id: 'teacher', label: 'Teacher' },
  { id: 'country', label: 'Country' },
  { id: 'city', label: 'City Name' },
  { id: 'rejection_reason', label: 'Rejection Reason' },
  { id: 'rejected_by', label: 'Rejected By' },
  { id: 'rejected_date', label: 'Rejection Date' },
  { id: 'expires_in', label: 'Expires In' },
  { id: 'actions', label: 'Actions' },
];

export default function AdminPendingApprovals() {
  const [pendingData, setPendingData] = useState([]);
  const [pendingCities, setPendingCities] = useState([]);
  const [rejectedData, setRejectedData] = useState([]);
  const [rejectedCities, setRejectedCities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Main tab selector state
  const [activeMainTab, setActiveMainTab] = useState('main');
  
  // Table enhancement states
  const [dataColumns, setDataColumns] = useState(DEFAULT_DATA_COLUMNS);
  const [cityColumns, setCityColumns] = useState(DEFAULT_CITY_COLUMNS);
  const [recycleBinDataColumns, setRecycleBinDataColumns] = useState(RECYCLE_BIN_DATA_COLUMNS);
  const [recycleBinCityColumns, setRecycleBinCityColumns] = useState(RECYCLE_BIN_CITY_COLUMNS);
  const [dataFilter, setDataFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [recycleBinDataFilter, setRecycleBinDataFilter] = useState('');
  const [recycleBinCityFilter, setRecycleBinCityFilter] = useState('');

  // AI analysis states
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState(null);
  const [scheduleDays, setScheduleDays] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  // Recycle bin states
  const [recycleBinStats, setRecycleBinStats] = useState({ totalItems: 0, expiringToday: 0 });

  const mainTabs = [
    { label: 'Main', value: 'main' },
    { label: 'Recycle Bin', value: 'recycle-bin' }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
        const [data, cities, rejData, rejCities] = await Promise.all([
            PendingData.filter({ status: 'pending' }),
            PendingCity.filter({ status: 'pending' }),
            PendingData.filter({ status: 'rejected' }),
            PendingCity.filter({ status: 'rejected' })
        ]);
        
        setPendingData(data);
        setPendingCities(cities);
        
        // Filter rejected items to only include those within 10 days
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        const activeRejectedData = rejData.filter(item => 
            item.rejected_date && new Date(item.rejected_date) > tenDaysAgo
        );
        const activeRejectedCities = rejCities.filter(item => 
            item.rejected_date && new Date(item.rejected_date) > tenDaysAgo
        );
        
        setRejectedData(activeRejectedData);
        setRejectedCities(activeRejectedCities);
        
        // Calculate recycle bin stats
        const today = new Date();
        const expiringToday = [...activeRejectedData, ...activeRejectedCities].filter(item => {
            if (!item.rejected_date) return false;
            const rejectedDate = new Date(item.rejected_date);
            const expiryDate = new Date(rejectedDate);
            expiryDate.setDate(expiryDate.getDate() + 10);
            return expiryDate.toDateString() === today.toDateString();
        }).length;
        
        setRecycleBinStats({
            totalItems: activeRejectedData.length + activeRejectedCities.length,
            expiringToday
        });
        
    } catch (error) {
        console.error("Failed to fetch pending items:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    const savedSchedule = localStorage.getItem('aiAnalysisSchedule');
    if (savedSchedule) {
      setScheduleDays(Number(savedSchedule));
    }
    const savedLastRun = localStorage.getItem('aiLastAnalysis');
    if (savedLastRun) {
        setLastAnalysis(new Date(savedLastRun));
    }
    fetchData();
  }, []);
  
  const runAiAnalysis = async () => {
      setIsAiRunning(true);
      setAiAnalysisResults(null);
      try {
          const combinedData = [
              ...pendingData.map(d => ({...d, item_type: 'data'})),
              ...pendingCities.map(c => ({...c, item_type: 'city'}))
          ];

          if (combinedData.length === 0) {
              alert("No pending items to analyze.");
              setIsAiRunning(false);
              return;
          }

          const prompt = `
            As an expert data quality analyst for an online tutoring platform, review the following pending submissions from teachers. For each item, provide a "recommendation" ('approve' or 'reject') and a concise "reason".
            
            Approval criteria:
            - Data: Values should be standard, well-known, and correctly spelled (e.g., 'Mathematics', not 'Maths 101'). New but plausible entries can be approved. Reject nonsensical or spam entries.
            - Cities: Must be real cities within the specified country. Check for typos.
            
            Here is the data to analyze:
            ${JSON.stringify(combinedData)}
          `;

          const response = await InvokeLLM({
              prompt,
              response_json_schema: {
                  type: 'object',
                  properties: {
                      analysis: {
                          type: 'array',
                          items: {
                              type: 'object',
                              properties: {
                                  id: { type: 'string' },
                                  recommendation: { type: 'string', enum: ['approve', 'reject'] },
                                  reason: { type: 'string' }
                              },
                              required: ['id', 'recommendation', 'reason']
                          }
                      }
                  }
              }
          });
          
          setAiAnalysisResults(response.analysis || []);

      } catch (error) {
          console.error("AI Analysis failed:", error);
          alert("AI Analysis failed. Please try again.");
      } finally {
          setIsAiRunning(false);
          const now = new Date();
          setLastAnalysis(now);
          localStorage.setItem('aiLastAnalysis', now.toISOString());
      }
  };
  
  const handleScheduleUpdate = () => {
    if (scheduleDays > 0) {
        localStorage.setItem('aiAnalysisSchedule', scheduleDays);
        alert(`Schedule saved! AI analysis will run automatically every ${scheduleDays} days. (This is a simulation and requires a backend service).`);
    } else {
        localStorage.removeItem('aiAnalysisSchedule');
        setScheduleDays(null);
        alert(`Schedule cleared. Automatic analysis is now disabled.`);
    }
  };

  const handleClearSchedule = () => {
      setScheduleDays(null);
      localStorage.removeItem('aiAnalysisSchedule');
      alert('Schedule cleared. Automatic analysis has been disabled.');
  };

  // Memoized and filtered data for tables
    const filteredData = useMemo(() => {
        let data = pendingData.map(item => {
            const analysis = aiAnalysisResults?.find(res => res.id === item.id);
            return analysis ? { ...item, ai_recommendation: analysis } : item;
        });

        if (dataFilter) {
            return data.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(dataFilter.toLowerCase())
                )
            );
        }
        return data;
    }, [pendingData, dataFilter, aiAnalysisResults]);

    const filteredCities = useMemo(() => {
        let data = pendingCities.map(item => {
            const analysis = aiAnalysisResults?.find(res => res.id === item.id);
            return analysis ? { ...item, ai_recommendation: analysis } : item;
        });

        if (cityFilter) {
            return data.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(cityFilter.toLowerCase())
                )
            );
        }
        return data;
    }, [pendingCities, cityFilter, aiAnalysisResults]);

    // Recycle bin filtered data
    const filteredRejectedData = useMemo(() => {
        if (recycleBinDataFilter) {
            return rejectedData.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(recycleBinDataFilter.toLowerCase())
                )
            );
        }
        return rejectedData;
    }, [rejectedData, recycleBinDataFilter]);

    const filteredRejectedCities = useMemo(() => {
        if (recycleBinCityFilter) {
            return rejectedCities.filter(item =>
                Object.values(item).some(val =>
                    String(val).toLowerCase().includes(recycleBinCityFilter.toLowerCase())
                )
            );
        }
        return rejectedCities;
    }, [rejectedCities, recycleBinCityFilter]);

  // Drag and drop handlers
    const handleDragEnd = (result, columns, setColumns) => {
        if (!result.destination) return;
        const items = Array.from(columns);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setColumns(items);
    };

  const handleApproveData = async (item) => {
    try {
        const profiles = await TeacherProfile.filter({ user_id: item.teacher_id });
        if (profiles.length === 0) throw new Error("Teacher profile not found");
        const profile = profiles[0];

        const keyMap = {
            subject: 'subjects',
            specialization: 'specializations',
            board: 'boards',
            exam: 'exams',
        };
        const targetArrayKey = keyMap[item.data_type];
        if (!targetArrayKey) throw new Error("Invalid data type");

        const newData = {
            [`${item.data_type}Name`]: item.data_value,
            ...item.additional_info,
            isCustom: false,
            id: `approved_${Date.now()}`
        };

        const updatedProfile = {
            ...profile,
            [targetArrayKey]: [...(profile[targetArrayKey] || []), newData]
        };

        await TeacherProfile.update(profile.id, updatedProfile);
        await PendingData.update(item.id, { status: 'approved' });
        fetchData();
    } catch (error) {
        console.error("Failed to approve data:", error);
        alert(`Error: ${error.message}`);
    }
  };

  const handleRejectData = async (item, reason = 'Quality standards not met') => {
    try {
        await PendingData.update(item.id, { 
            status: 'rejected',
            rejection_reason: reason,
            rejected_by: 'admin',
            rejected_date: new Date().toISOString()
        });
        fetchData();
    } catch (error) {
        console.error("Failed to reject data:", error);
        alert(`Error: ${error.message}`);
    }
  };
  
  const handleApproveCity = async (item) => {
     try {
        const countries = await Country.filter({ country_name: item.country_name });
        if (countries.length === 0) throw new Error("Country not found");
        const country = countries[0];
        
        const newCity = { city_name: item.city_name, timezone: item.timezone };
        const updatedCountry = {
            ...country,
            cities: [...(country.cities || []), newCity]
        };

        await Country.update(country.id, updatedCountry);
        await PendingCity.update(item.id, { status: 'approved' });
        fetchData();
    } catch (error) {
        console.error("Failed to approve city:", error);
        alert(`Error: ${error.message}`);
    }
  };

  const handleRejectCity = async (item, reason = 'Invalid city or location') => {
    try {
        await PendingCity.update(item.id, { 
            status: 'rejected',
            rejection_reason: reason,
            rejected_by: 'admin',
            rejected_date: new Date().toISOString()
        });
        fetchData();
    } catch (error) {
        console.error("Failed to reject city:", error);
        alert(`Error: ${error.message}`);
    }
  };

  // Recycle bin functions
  const handleRestoreData = async (item) => {
    try {
        await PendingData.update(item.id, { 
            status: 'pending',
            rejection_reason: null,
            rejected_by: null,
            rejected_date: null
        });
        fetchData();
    } catch (error) {
        console.error("Failed to restore data:", error);
        alert(`Error: ${error.message}`);
    }
  };

  const handleRestoreCity = async (item) => {
    try {
        await PendingCity.update(item.id, { 
            status: 'pending',
            rejection_reason: null,
            rejected_by: null,
            rejected_date: null
        });
        fetchData();
    } catch (error) {
        console.error("Failed to restore city:", error);
        alert(`Error: ${error.message}`);
    }
  };

  const handlePermanentDelete = async (item, isCity = false) => {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        if (isCity) {
            await PendingCity.delete(item.id);
        } else {
            await PendingData.delete(item.id);
        }
        fetchData();
    } catch (error) {
        console.error("Failed to delete item:", error);
        alert(`Error: ${error.message}`);
    }
  };

  const handleBulkRestore = async (type) => {
    const items = type === 'data' ? filteredRejectedData : filteredRejectedCities;
    if (items.length === 0) {
        alert('No items to restore.');
        return;
    }
    
    if (!confirm(`Are you sure you want to restore all ${items.length} ${type} items?`)) {
        return;
    }

    try {
        const promises = items.map(item => 
            type === 'data' 
                ? PendingData.update(item.id, { status: 'pending', rejection_reason: null, rejected_by: null, rejected_date: null })
                : PendingCity.update(item.id, { status: 'pending', rejection_reason: null, rejected_by: null, rejected_date: null })
        );
        await Promise.all(promises);
        fetchData();
    } catch (error) {
        console.error("Failed to bulk restore:", error);
        alert(`Error during bulk restore: ${error.message}`);
    }
  };

  const handleBulkDelete = async (type) => {
    const items = type === 'data' ? filteredRejectedData : filteredRejectedCities;
    if (items.length === 0) {
        alert('No items to delete.');
        return;
    }
    
    if (!confirm(`Are you sure you want to permanently delete all ${items.length} ${type} items? This action cannot be undone.`)) {
        return;
    }

    try {
        const promises = items.map(item => 
            type === 'data' ? PendingData.delete(item.id) : PendingCity.delete(item.id)
        );
        await Promise.all(promises);
        fetchData();
    } catch (error) {
        console.error("Failed to bulk delete:", error);
        alert(`Error during bulk delete: ${error.message}`);
    }
  };

  const exportRejectedItems = () => {
    const allRejected = [...filteredRejectedData, ...filteredRejectedCities];
    const csvContent = "data:text/csv;charset=utf-8," + 
        "Type,Teacher,Value,Country,Rejection Reason,Rejected By,Rejection Date\n" +
        allRejected.map(item => 
            `${item.data_type || 'city'},${item.context?.teacher_name || item.teacher_name || ''},${item.data_value || item.city_name},${item.country_name || ''},${item.rejection_reason || ''},${item.rejected_by || ''},${item.rejected_date || ''}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rejected_submissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDaysUntilExpiry = (rejectedDate) => {
    if (!rejectedDate) return 'Unknown';
    const rejected = new Date(rejectedDate);
    const expiry = new Date(rejected);
    expiry.setDate(expiry.getDate() + 10);
    const today = new Date();
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? `${daysLeft} days` : 'Expired';
  };
  
  const renderCell = (item, columnId, isRecycleBin = false) => {
      switch (columnId) {
          case 'teacher': return item.context?.teacher_name || item.teacher_name || item.teacher_id;
          case 'type': return <Badge>{item.data_type}</Badge>;
          case 'value': return <span className="font-medium">{item.data_value}</span>;
          case 'context': return JSON.stringify(item.additional_info);
          case 'country': return item.country_name;
          case 'city': return <span className="font-medium">{item.city_name}</span>;
          case 'timezone': return item.timezone;
          case 'rejection_reason': return <span className="text-red-600">{item.rejection_reason || 'No reason provided'}</span>;
          case 'rejected_by': return <span className="text-gray-600">{item.rejected_by || 'Unknown'}</span>;
          case 'rejected_date': return item.rejected_date ? new Date(item.rejected_date).toLocaleDateString() : 'Unknown';
          case 'expires_in': 
              const daysLeft = getDaysUntilExpiry(item.rejected_date);
              const isExpiringSoon = daysLeft.includes('1') || daysLeft === 'Expired';
              return <Badge variant={isExpiringSoon ? 'destructive' : 'secondary'}>{daysLeft}</Badge>;
          case 'ai_recommendation':
              if (!item.ai_recommendation) return <span className="text-gray-400">N/A</span>;
              const isApprove = item.ai_recommendation.recommendation === 'approve';
              return (
                  <div className="flex flex-col">
                      <Badge variant={isApprove ? 'default' : 'destructive'} className="w-fit">
                          {isApprove ? 'Approve' : 'Reject'}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">{item.ai_recommendation.reason}</span>
                  </div>
              );
          case 'actions':
              if (isRecycleBin) {
                  const restoreHandler = item.city_name ? handleRestoreCity : handleRestoreData;
                  const deleteHandler = () => handlePermanentDelete(item, !!item.city_name);
                  return (
                      <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" onClick={() => restoreHandler(item)}>
                              <RotateCw className="w-4 h-4 mr-2"/>Restore
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={deleteHandler}>
                              <Trash2 className="w-4 h-4 mr-2"/>Delete
                          </Button>
                      </div>
                  );
              } else {
                  const approveHandler = item.city_name ? handleApproveCity : handleApproveData;
                  const rejectHandler = item.city_name ? handleRejectCity : handleRejectData;
                  return (
                      <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => approveHandler(item)}>
                              <Check className="w-4 h-4 mr-2"/>Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => rejectHandler(item)}>
                              <X className="w-4 h-4 mr-2"/>Reject
                          </Button>
                      </div>
                  );
              }
          default: return null;
      }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Pending Approvals</h1>
        
        {/* Main Tab Selector */}
        <div className="mb-6">
          <TabSelector
            tabs={mainTabs}
            activeTab={activeMainTab}
            onTabChange={setActiveMainTab}
            maxVisibleTabs={2}
          />
        </div>

        {activeMainTab === 'main' && (
          <>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600"/> AI Analysis & Automation
                    </CardTitle>
                    <CardDescription>Use AI to analyze pending submissions or set a schedule for automatic analysis.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex flex-col md:flex-row items-center gap-6 p-4 border rounded-lg bg-gray-100">
                        <Button onClick={runAiAnalysis} disabled={isAiRunning} className="w-full md:w-auto">
                            {isAiRunning ? <><Activity className="w-4 h-4 mr-2 animate-spin"/>Analyzing...</> : <><Brain className="w-4 h-4 mr-2"/>Run Manual Analysis Now</>}
                        </Button>
                        <div className="text-sm text-gray-600">
                            {lastAnalysis 
                                ? `Last run: ${lastAnalysis.toLocaleString()}`
                                : 'No analysis has been run yet.'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Automation Settings</Label>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500"/>
                                <label htmlFor="scheduleDays" className="text-sm font-medium">Run analysis every</label>
                                <Input 
                                    id="scheduleDays"
                                    type="number"
                                    placeholder="None"
                                    value={scheduleDays || ''}
                                    onChange={(e) => setScheduleDays(e.target.value ? Number(e.target.value) : null)}
                                    className="w-24"
                                    min="1"
                                />
                                <label htmlFor="scheduleDays" className="text-sm font-medium">days</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={handleScheduleUpdate}>
                                    <Save className="w-4 h-4 mr-2"/>Set Schedule
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleClearSchedule} title="Clear Schedule">
                                    <RotateCcw className="w-4 h-4"/>
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Current schedule: {scheduleDays > 0 ? `Every ${scheduleDays} days` : 'Not scheduled'}. Requires a backend service to run automatically.
                        </p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                         <Label className="text-base font-semibold">Advanced (Simulation)</Label>
                         <div className="flex items-center space-x-2">
                            <Switch
                                id="auto-processing"
                                checked={isAutoProcessing}
                                onCheckedChange={setIsAutoProcessing}
                            />
                            <Label htmlFor="auto-processing" className="text-sm">Auto-process submissions with AI confidence &gt; 95%</Label>
                        </div>
                         <p className="text-xs text-gray-500">
                            When enabled, the system would automatically approve or reject submissions based on the AI's recommendation if its confidence is very high.
                         </p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="custom-data">
              <TabsList>
                <TabsTrigger value="custom-data">Custom Data ({filteredData.length})</TabsTrigger>
                <TabsTrigger value="custom-cities">Custom Cities ({filteredCities.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="custom-data">
                <Card>
                    <CardHeader>
                        <CardTitle>Custom Data Submissions</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Filter data..." value={dataFilter} onChange={e => setDataFilter(e.target.value)} className="pl-9"/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DragDropContext onDragEnd={(result) => handleDragEnd(result, dataColumns, setDataColumns)}>
                            <Table>
                                <TableHeader>
                                    <Droppable droppableId="data-columns" direction="horizontal">
                                        {(provided) => (
                                            <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                                                {dataColumns.map((col, index) => (
                                                    <Draggable key={col.id} draggableId={col.id} index={index}>
                                                        {(provided) => (
                                                            <TableHead ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                <div className="flex items-center gap-2">
                                                                    <GripVertical className="w-4 h-4 text-gray-400"/>
                                                                    {col.label}
                                                                </div>
                                                            </TableHead>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </TableRow>
                                        )}
                                    </Droppable>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length > 0 ? filteredData.map(item => (
                                        <TableRow key={item.id}>
                                            {dataColumns.map(col => <TableCell key={col.id}>{renderCell(item, col.id)}</TableCell>)}
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={dataColumns.length} className="text-center py-4">No pending data submissions.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </DragDropContext>
                    </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="custom-cities">
                <Card>
                    <CardHeader>
                        <CardTitle>Custom City Submissions</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Filter cities..." value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="pl-9"/>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <DragDropContext onDragEnd={(result) => handleDragEnd(result, cityColumns, setCityColumns)}>
                            <Table>
                                <TableHeader>
                                    <Droppable droppableId="city-columns" direction="horizontal">
                                         {(provided) => (
                                            <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                                                {cityColumns.map((col, index) => (
                                                    <Draggable key={col.id} draggableId={col.id} index={index}>
                                                        {(provided) => (
                                                            <TableHead ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                <div className="flex items-center gap-2">
                                                                    <GripVertical className="w-4 h-4 text-gray-400"/>
                                                                    {col.label}
                                                                </div>
                                                            </TableHead>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </TableRow>
                                        )}
                                    </Droppable>
                                </TableHeader>
                                <TableBody>
                                    {filteredCities.length > 0 ? filteredCities.map(item => (
                                        <TableRow key={item.id}>
                                           {cityColumns.map(col => <TableCell key={col.id}>{renderCell(item, col.id)}</TableCell>)}
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={cityColumns.length} className="text-center py-4">No pending city submissions.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </DragDropContext>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {activeMainTab === 'recycle-bin' && (
          <div className="space-y-6">
            {/* Recycle Bin Stats Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="w-5 h-5 text-orange-600"/>
                        Recycle Bin Overview
                    </CardTitle>
                    <CardDescription>Rejected submissions are kept for 10 days before permanent deletion.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <FileX className="w-5 h-5 text-gray-500"/>
                            <div>
                                <div className="text-lg font-semibold">{recycleBinStats.totalItems}</div>
                                <div className="text-sm text-gray-600">Total Items</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500"/>
                            <div>
                                <div className="text-lg font-semibold">{recycleBinStats.expiringToday}</div>
                                <div className="text-sm text-gray-600">Expiring Today</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-500"/>
                            <div>
                                <div className="text-lg font-semibold">10 days</div>
                                <div className="text-sm text-gray-600">Retention Period</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recycle Bin Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Actions</CardTitle>
                    <CardDescription>Perform actions on multiple items in the recycle bin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <Button onClick={() => handleBulkRestore('data')} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                            <RotateCw className="w-4 h-4 mr-2"/>Restore All Data
                        </Button>
                        <Button onClick={() => handleBulkRestore('cities')} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                            <RotateCw className="w-4 h-4 mr-2"/>Restore All Cities
                        </Button>
                        <Button onClick={() => handleBulkDelete('data')} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2"/>Delete All Data
                        </Button>
                        <Button onClick={() => handleBulkDelete('cities')} variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2"/>Delete All Cities
                        </Button>
                        <Button onClick={exportRejectedItems} variant="outline">
                            <Download className="w-4 h-4 mr-2"/>Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="rejected-data">
              <TabsList>
                <TabsTrigger value="rejected-data">Rejected Data ({filteredRejectedData.length})</TabsTrigger>
                <TabsTrigger value="rejected-cities">Rejected Cities ({filteredRejectedCities.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rejected-data">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileX className="w-5 h-5 text-red-500"/>
                            Rejected Data Submissions
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Filter rejected data..." value={recycleBinDataFilter} onChange={e => setRecycleBinDataFilter(e.target.value)} className="pl-9"/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DragDropContext onDragEnd={(result) => handleDragEnd(result, recycleBinDataColumns, setRecycleBinDataColumns)}>
                            <Table>
                                <TableHeader>
                                    <Droppable droppableId="rejected-data-columns" direction="horizontal">
                                        {(provided) => (
                                            <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                                                {recycleBinDataColumns.map((col, index) => (
                                                    <Draggable key={col.id} draggableId={col.id} index={index}>
                                                        {(provided) => (
                                                            <TableHead ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                <div className="flex items-center gap-2">
                                                                    <GripVertical className="w-4 h-4 text-gray-400"/>
                                                                    {col.label}
                                                                </div>
                                                            </TableHead>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </TableRow>
                                        )}
                                    </Droppable>
                                </TableHeader>
                                <TableBody>
                                    {filteredRejectedData.length > 0 ? filteredRejectedData.map(item => (
                                        <TableRow key={item.id}>
                                            {recycleBinDataColumns.map(col => <TableCell key={col.id}>{renderCell(item, col.id, true)}</TableCell>)}
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={recycleBinDataColumns.length} className="text-center py-4">No rejected data in recycle bin.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </DragDropContext>
                    </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="rejected-cities">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileX className="w-5 h-5 text-red-500"/>
                            Rejected City Submissions
                        </CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Filter rejected cities..." value={recycleBinCityFilter} onChange={e => setRecycleBinCityFilter(e.target.value)} className="pl-9"/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DragDropContext onDragEnd={(result) => handleDragEnd(result, recycleBinCityColumns, setRecycleBinCityColumns)}>
                            <Table>
                                <TableHeader>
                                    <Droppable droppableId="rejected-city-columns" direction="horizontal">
                                        {(provided) => (
                                            <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                                                {recycleBinCityColumns.map((col, index) => (
                                                    <Draggable key={col.id} draggableId={col.id} index={index}>
                                                        {(provided) => (
                                                            <TableHead ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                <div className="flex items-center gap-2">
                                                                    <GripVertical className="w-4 h-4 text-gray-400"/>
                                                                    {col.label}
                                                                </div>
                                                            </TableHead>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </TableRow>
                                        )}
                                    </Droppable>
                                </TableHeader>
                                <TableBody>
                                    {filteredRejectedCities.length > 0 ? filteredRejectedCities.map(item => (
                                        <TableRow key={item.id}>
                                            {recycleBinCityColumns.map(col => <TableCell key={col.id}>{renderCell(item, col.id, true)}</TableCell>)}
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={recycleBinCityColumns.length} className="text-center py-4">No rejected cities in recycle bin.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </DragDropContext>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}