import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function HeaderActionButtons({ className = "" }) {
    return (
        <div className={`flex items-center ${className}`}>
            <Button asChild className="btn-pill-green text-sm lg:text-base px-4 lg:px-6">
                <Link to={createPageUrl('PostRequirement')}>
                    Post Requirement
                </Link>
            </Button>
        </div>
    );
}