import { PendingData } from '@/api/entities';
import { User } from '@/api/entities';
import { supabase } from '@/api/supabaseClient';
import { submitCustomData as submitCustomDataToSupabase } from '@/api/teacherRegistrationApi';

export class CustomDataSubmissionService {
    static async submitCustomData(dataType, dataValue, additionalInfo = {}, relatedSubject = null) {
        try {
            const user = await User.me();

            const context = {
                step: 'personal_info',
                form_section: dataType,
                teacher_name: user.full_name,
                teacher_email: user.email
            };

            // Live backend first (pending_data); the approve_pending_data RPC
            // spreads additional_info onto the teacher profile on approval.
            const remote = await submitCustomDataToSupabase(
                dataType, dataValue, additionalInfo, relatedSubject, context
            );
            if (remote.ok) {
                console.log(`Custom ${dataType} submitted for approval (supabase):`, dataValue);
                return {
                    success: true,
                    pendingId: remote.data?.id,
                    message: `Your custom ${dataType} has been submitted for admin approval.`
                };
            }

            // Fallback to the in-memory mock when there's no session / table.
            const result = await PendingData.create({
                teacher_id: user.id,
                data_type: dataType,
                data_value: dataValue,
                related_subject: relatedSubject,
                additional_info: { ...additionalInfo, context },
                status: 'pending'
            });

            console.log(`Custom ${dataType} submitted for approval (mock):`, dataValue);

            return {
                success: true,
                pendingId: result.id,
                message: `Your custom ${dataType} has been submitted for admin approval.`
            };
        } catch (error) {
            console.error('Error submitting custom data:', error);
            return {
                success: false,
                error: error.message || 'Failed to submit custom data'
            };
        }
    }

    static async getTeacherPendingData() {
        try {
            const user = await User.me();

            // Live backend first (owner-scoped RLS); fall back to the mock.
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data, error } = await supabase
                        .from('pending_data')
                        .select('*')
                        .eq('teacher_id', session.user.id)
                        .order('created_date', { ascending: false });
                    if (!error) {
                        return { success: true, data: data || [] };
                    }
                }
            } catch {
                // fall through to the mock
            }

            const pendingData = await PendingData.filter(
                { teacher_id: user.id },
                '-created_date'
            );

            return {
                success: true,
                data: pendingData
            };
        } catch (error) {
            console.error('Error fetching pending data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async checkDataExists(dataType, dataValue, relatedSubject = null) {
        // This would typically check against your main database
        // For now, we'll simulate with the service context
        const mockExistingData = {
            subject: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'],
            specialization: ['Algebra', 'Calculus', 'Organic Chemistry', 'Quantum Physics'],
            board: ['CBSE', 'ICSE', 'IB', 'Cambridge'],
            exam: ['JEE Main', 'JEE Advanced', 'NEET', 'SAT'],
            language: ['English', 'Spanish', 'French', 'German', 'Hindi']
        };

        const existingItems = mockExistingData[dataType] || [];
        return existingItems.includes(dataValue);
    }
}

export default CustomDataSubmissionService;