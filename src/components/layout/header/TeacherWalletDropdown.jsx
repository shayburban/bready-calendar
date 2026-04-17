import React, { useState, useRef } from 'react';
import useOnClickOutside from '../../hooks/useOnClickOutside';
import { Wallet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TeacherWalletDropdown = ({ balance = 5.40 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useOnClickOutside(dropdownRef, () => setIsOpen(false));

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <Wallet size={20} />
                <span className="font-medium">{balance.toFixed(2)} USD</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">You have earned</label>
                            <input 
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-right" 
                                type="text" 
                                placeholder="0.00 USD" 
                                value={`${balance.toFixed(2)} USD`}
                                readOnly
                            />
                        </div>
                        <div className="d-grid gap-2 space-y-2">
                           <Button className="w-full btn-pill-green">Withdraw Money</Button>
                           <Button variant="outline" className="w-full btn-pill-outline-green">Go To Finance</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherWalletDropdown;