
import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { SearchQuery } from '@/api/entities';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Download, Search, FileText, ArrowUpDown, Users, TrendingUp } from 'lucide-react';
import DateRangePicker from '../components/common/DateRangePicker';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';

export default function UserSearchInsights() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchData, setSearchData] = useState([]);
  const [users, setUsers] = useState({});

  // Filtering and Sorting State
  const [filters, setFilters] = useState({ keyword: '', role: 'all', dateRange: { startDate: null, endDate: null } });
  const [sortConfig, setSortConfig] = useState({ key: 'count', direction: 'desc' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);

        setLoading(true);
        const [queries, allUsers] = await Promise.all([SearchQuery.list(), User.list()]);
        
        const usersMap = allUsers.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
        setUsers(usersMap);

        const aggregatedData = queries.reduce((acc, query) => {
          const key = query.query_text.toLowerCase().trim();
          if (!key) return acc;

          if (!acc[key]) {
            acc[key] = {
              term: query.query_text,
              count: 0,
              dates: [],
              userIds: new Set()
            };
          }

          acc[key].count++;
          acc[key].dates.push(new Date(query.created_date));
          acc[key].userIds.add(query.user_id);
          return acc;
        }, {});

        const processedData = Object.values(aggregatedData).map(item => ({
          term: item.term,
          count: item.count,
          lastSearched: new Date(Math.max.apply(null, item.dates)),
          roles: [...new Set(Array.from(item.userIds).map(id => usersMap[id]?.role || 'guest'))]
        }));
        
        setSearchData(processedData);
      } catch (e) {
        window.location.href = createPageUrl('Home');
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetchData();
  }, []);

  const filteredAndSortedData = useMemo(() => {
    let data = [...searchData];
    
    // Apply filters
    if (filters.keyword) {
      data = data.filter(item => item.term.toLowerCase().includes(filters.keyword.toLowerCase()));
    }
    if (filters.role !== 'all') {
      data = data.filter(item => item.roles.includes(filters.role));
    }
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
        data = data.filter(item => 
            item.lastSearched >= filters.dateRange.startDate && item.lastSearched <= filters.dateRange.endDate
        );
    }
    
    // Apply sorting
    data.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [searchData, filters, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const handleExportCSV = () => {
    const headers = ["Search Term", "Search Count", "Last Searched", "Roles"];
    const rows = filteredAndSortedData.map(item => [
      `"${item.term}"`,
      item.count,
      format(item.lastSearched, 'yyyy-MM-dd HH:mm'),
      `"${item.roles.join(', ')}"`
    ].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "search_insights.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summaryStats = useMemo(() => {
    const top5 = [...searchData].sort((a,b) => b.count - a.count).slice(0, 5);
    const roleCounts = searchData.flatMap(d => d.roles).reduce((acc, role) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {});
    const mostActiveRole = Object.keys(roleCounts).sort((a,b) => roleCounts[b] - roleCounts[a])[0];

    return {
        totalSearches: searchData.reduce((sum, item) => sum + item.count, 0),
        uniqueTerms: searchData.length,
        top5,
        mostActiveRole: mostActiveRole || 'N/A'
    };
  }, [searchData]);

  if (loading) return <div className="p-8">Loading insights...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            User Search Insights
          </h1>
          <p className="text-gray-600 mt-1">Analyze search queries to understand user intent and platform demand.</p>
        </header>

        {/* Summary Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                    <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.totalSearches.toLocaleString()}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unique Terms</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{summaryStats.uniqueTerms.toLocaleString()}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Active Role</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{summaryStats.mostActiveRole}</div>
                </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Search Trend</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold truncate">{summaryStats.top5[0]?.term || 'N/A'}</div>
                </CardContent>
            </Card>
        </section>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Top 5 Searched Terms</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summaryStats.top5} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="term" angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} />
                        <Tooltip cursor={{fill: 'rgba(239, 246, 255, 0.5)'}} />
                        <Bar dataKey="count" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        {/* Filters and Table Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Log Details</CardTitle>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Filter by keyword..."
                  value={filters.keyword}
                  onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
              </Select>
              <DateRangePicker 
                onRangeChange={(range) => setFilters(prev => ({...prev, dateRange: range}))}
                onRemove={() => setFilters(prev => ({...prev, dateRange: {startDate: null, endDate: null}}))}
                showControls={false}
                isOnlyRow={true}
              />
              <Button onClick={handleExportCSV} variant="outline" className="ml-auto">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort('term')} className="cursor-pointer">
                        <div className="flex items-center gap-2">Search Term <ArrowUpDown className="h-4 w-4" /></div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('count')} className="cursor-pointer">
                         <div className="flex items-center gap-2">Count <ArrowUpDown className="h-4 w-4" /></div>
                      </TableHead>
                      <TableHead onClick={() => handleSort('lastSearched')} className="cursor-pointer">
                         <div className="flex items-center gap-2">Last Searched <ArrowUpDown className="h-4 w-4" /></div>
                      </TableHead>
                      <TableHead>Searched By Roles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.term}</TableCell>
                        <TableCell>{item.count}</TableCell>
                        <TableCell>{format(item.lastSearched, 'MMM d, yyyy HH:mm')}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {item.roles.map(role => (
                                    <Badge key={role} variant="secondary" className="capitalize">{role}</Badge>
                                ))}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {Math.min(paginatedData.length, rowsPerPage * (currentPage - 1) + paginatedData.length)} of {filteredAndSortedData.length} results
              </div>
              <div className="flex items-center gap-4">
                  <Select value={rowsPerPage.toString()} onValueChange={(value) => { setRowsPerPage(Number(value)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-28">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          {[10, 25, 50, 100].map(val => (
                              <SelectItem key={val} value={val.toString()}>{val} rows</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
