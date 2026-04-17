import React from 'react';
import { Button } from '@/components/ui/button';

export default function HeaderAuthButtons({ onLogin, showRegister = true, className = "" }) {
    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            <Button variant="ghost" className="text-gray-600 hover:text-brand-blue text-sm lg:text-base px-3 lg:px-4" onClick={onLogin}>
                Login
            </Button>
            {showRegister && (
                <Button className="btn-pill-grey text-sm lg:text-base px-4 lg:px-6" onClick={onLogin}>
                    Register
                </Button>
            )}
        </div>
    );
}