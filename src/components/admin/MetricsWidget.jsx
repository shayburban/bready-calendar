import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const MetricsWidget = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue',
  description 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50'
  };

  const trendColorClasses = {
    '+': 'bg-green-100 text-green-800',
    '-': 'bg-red-100 text-red-800',
    'Live': 'bg-orange-100 text-orange-800'
  };

  const getTrendColor = (trend) => {
    if (trend === 'Live') return trendColorClasses['Live'];
    if (trend.startsWith('+')) return trendColorClasses['+'];
    if (trend.startsWith('-')) return trendColorClasses['-'];
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {value}
            </div>
            {description && (
              <p className="text-xs text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>
          {trend && (
            <Badge className={getTrendColor(trend)} variant="secondary">
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricsWidget;