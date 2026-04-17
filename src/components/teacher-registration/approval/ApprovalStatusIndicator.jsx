import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const ApprovalStatusIndicator = ({ status, dataType, dataValue, compact = false }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle className="w-4 h-4" />,
                    color: 'bg-green-100 text-green-800 border-green-200',
                    label: 'Approved'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="w-4 h-4" />,
                    color: 'bg-red-100 text-red-800 border-red-200',
                    label: 'Rejected'
                };
            case 'pending':
                return {
                    icon: <Clock className="w-4 h-4" />,
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    label: 'Pending Review'
                };
            default:
                return {
                    icon: <AlertCircle className="w-4 h-4" />,
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    label: 'Unknown'
                };
        }
    };

    const config = getStatusConfig();

    if (compact) {
        return (
            <Badge className={`${config.color} flex items-center gap-1 text-xs`}>
                {config.icon}
                {config.label}
            </Badge>
        );
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.color}`}>
            {config.icon}
            <div>
                <p className="font-medium text-sm">{config.label}</p>
                <p className="text-xs opacity-75">
                    {dataType}: {dataValue}
                </p>
            </div>
        </div>
    );
};

export default ApprovalStatusIndicator;