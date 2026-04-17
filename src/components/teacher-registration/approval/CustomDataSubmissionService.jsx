import { PendingData } from '@/api/entities';
import { User } from '@/api/entities';

export class CustomDataSubmissionService {
    static async submitCustomData(dataType, dataValue, additionalInfo = {}, relatedSubject = null) {
        try {
            const user = await User.me();
            
            const pendingData = {
                teacher_id: user.id,
                data_type: dataType,
                data_value: dataValue,
                related_subject: relatedSubject,
                additional_info: additionalInfo,
                status: 'pending',
                context: {
                    step: 'personal_info',
                    form_section: dataType,
                    teacher_name: user.full_name,
                    teacher_email: user.email
                }
            };

            const result = await PendingData.create(pendingData);
            
            // Log the submission
            console.log(`Custom ${dataType} submitted for approval:`, dataValue);
            
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