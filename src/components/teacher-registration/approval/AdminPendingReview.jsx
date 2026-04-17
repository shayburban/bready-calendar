import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    CheckCircle, 
    XCircle, 
    Clock, 
    User as UserIcon, 
    Mail, 
    BookOpen, 
    Star, 
    GraduationCap,
    FileText,
    AlertCircle,
    Globe
} from 'lucide-react';
import { PendingData } from '@/api/entities';
import { AdminAction } from '@/api/entities';
import { User } from '@/api/entities';
import ApprovalStatusIndicator from './ApprovalStatusIndicator';

const AdminPendingReview = () => {
    const [pendingData, setPendingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState(new Set());
    const [adminNotes, setAdminNotes] = useState({});
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        loadPendingData();
    }, []);

    const loadPendingData = async () => {
        setLoading(true);
        try {
            const data = await PendingData.filter({ status: 'pending' }, '-created_date');
            setPendingData(data);
        } catch (error) {
            console.error('Error loading pending data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (item) => {
        await processItem(item, 'approved');
    };

    const handleReject = async (item) => {
        await processItem(item, 'rejected');
    };

    const processItem = async (item, status) => {
        setProcessingIds(prev => new Set(prev).add(item.id));
        
        try {
            const user = await User.me();
            const notes = adminNotes[item.id] || '';
            
            // Update the pending data
            await PendingData.update(item.id, {
                status,
                admin_notes: notes,
                approved_by: user.id,
                approved_date: new Date().toISOString()
            });

            // Log the admin action
            await AdminAction.create({
                admin_id: user.id,
                action_type: status === 'approved' ? 'approve_data' : 'reject_data',
                target_type: 'pending_data',
                target_id: item.id,
                details: {
                    data_type: item.data_type,
                    data_value: item.data_value,
                    teacher_id: item.teacher_id,
                    reason: notes
                },
                notes
            });

            // If approved, you might want to add the data to your main database
            if (status === 'approved') {
                await addToMainDatabase(item);
            }

            // Remove from pending list
            setPendingData(prev => prev.filter(d => d.id !== item.id));
            
            // Clear notes
            setAdminNotes(prev => {
                const newNotes = { ...prev };
                delete newNotes[item.id];
                return newNotes;
            });

        } catch (error) {
            console.error('Error processing item:', error);
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    };

    const addToMainDatabase = async (item) => {
        // This would add the approved data to your main database
        // Implementation depends on your database structure
        console.log('Adding to main database:', item);
    };

    const getTypeIcon = (type) => {
        const icons = {
            subject: <BookOpen className="w-4 h-4" />,
            specialization: <Star className="w-4 h-4" />,
            board: <GraduationCap className="w-4 h-4" />,
            exam: <FileText className="w-4 h-4" />,
            language: <Globe className="w-4 h-4" />
        };
        return icons[type] || <AlertCircle className="w-4 h-4" />;
    };

    const filteredData = filterType === 'all' 
        ? pendingData 
        : pendingData.filter(item => item.data_type === filterType);

    const getTypeCounts = () => {
        const counts = {};
        pendingData.forEach(item => {
            counts[item.data_type] = (counts[item.data_type] || 0) + 1;
        });
        return counts;
    };

    const typeCounts = getTypeCounts();

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Pending Data Review
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={filterType} onValueChange={setFilterType}>
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="all">
                                All ({pendingData.length})
                            </TabsTrigger>
                            <TabsTrigger value="subject">
                                Subjects ({typeCounts.subject || 0})
                            </TabsTrigger>
                            <TabsTrigger value="specialization">
                                Specializations ({typeCounts.specialization || 0})
                            </TabsTrigger>
                            <TabsTrigger value="board">
                                Boards ({typeCounts.board || 0})
                            </TabsTrigger>
                            <TabsTrigger value="exam">
                                Exams ({typeCounts.exam || 0})
                            </TabsTrigger>
                            <TabsTrigger value="language">
                                Languages ({typeCounts.language || 0})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={filterType} className="space-y-4 mt-6">
                            {filteredData.length === 0 ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        No pending {filterType === 'all' ? 'data' : filterType} items to review.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                filteredData.map((item) => (
                                    <Card key={item.id} className="border-l-4 border-l-yellow-400">
                                        <CardContent className="pt-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {getTypeIcon(item.data_type)}
                                                        <Badge variant="outline" className="capitalize">
                                                            {item.data_type}
                                                        </Badge>
                                                        <h3 className="font-semibold text-lg">
                                                            {item.data_value}
                                                        </h3>
                                                    </div>

                                                    {item.related_subject && (
                                                        <p className="text-sm text-gray-600 mb-2">
                                                            Related to: <span className="font-medium">{item.related_subject}</span>
                                                        </p>
                                                    )}

                                                    {item.additional_info?.description && (
                                                        <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                                                            {item.additional_info.description}
                                                        </p>
                                                    )}

                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <UserIcon className="w-4 h-4" />
                                                            {item.context?.teacher_name || 'Unknown Teacher'}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="w-4 h-4" />
                                                            {item.context?.teacher_email || 'Unknown Email'}
                                                        </div>
                                                        <span>
                                                            {new Date(item.created_date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="ml-6 min-w-0 flex-shrink-0">
                                                    <ApprovalStatusIndicator
                                                        status={item.status}
                                                        dataType={item.data_type}
                                                        dataValue={item.data_value}
                                                        compact={true}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                <div>
                                                    <label className="text-sm font-medium">Admin Notes</label>
                                                    <Textarea
                                                        placeholder="Add notes about this decision..."
                                                        value={adminNotes[item.id] || ''}
                                                        onChange={(e) => setAdminNotes(prev => ({
                                                            ...prev,
                                                            [item.id]: e.target.value
                                                        }))}
                                                        rows={2}
                                                    />
                                                </div>

                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleReject(item)}
                                                        disabled={processingIds.has(item.id)}
                                                        className="border-red-200 text-red-700 hover:bg-red-50"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Reject
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleApprove(item)}
                                                        disabled={processingIds.has(item.id)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPendingReview;