import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// You can replace this with your own logo image after uploading it.
const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/846e0232b_image.png";

const HeaderLogo = () => {
    return (
        <Link to={createPageUrl('Home')} className="flex-shrink-0">
            <img 
                src={LOGO_URL} 
                alt="Bready Logo"
                style={{ width: '158px', height: 'auto', maxHeight: '68px' }}
                // Using width and auto height to maintain aspect ratio
            />
        </Link>
    );
};

export default HeaderLogo;