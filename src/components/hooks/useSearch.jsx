import { useContext } from 'react';
import { SearchContext } from '@/components/TeacherSearch/SearchContainer';

export const useSearch = () => {
    const context = useContext(SearchContext);
    
    if (!context) {
        throw new Error('useSearch must be used within a SearchContainer. Make sure the component is wrapped with SearchContainer.');
    }
    
    return context;
};