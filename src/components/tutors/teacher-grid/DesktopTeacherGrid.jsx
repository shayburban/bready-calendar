import React from 'react';
import TeacherListCard from '../TeacherListCard';
import { Loader2 } from 'lucide-react';
import Pagination from '@/components/common/Pagination';

export default function DesktopTeacherGrid({ teachers, loading }) {
    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {teachers.map(teacher => (
                <TeacherListCard key={teacher.id} teacher={teacher} />
            ))}
            <Pagination currentPage={1} totalPages={Math.ceil(teachers.length / 10)} />
        </div>
    );
}