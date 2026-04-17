import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import HeaderLanguageSelector from './HeaderLanguageSelector';

export default function HeaderMobileMenu({ isOpen, onClose, hiddenItems, onLogin, navLinks }) {
    const menuVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: "easeIn" } },
    };

    const handleItemClick = (action) => {
        if (action) action();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={menuVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute top-full left-0 w-full bg-white border-t shadow-lg z-40"
                >
                    <div className="px-4 sm:px-6 py-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto">
                        {/* Show hidden items in priority order */}
                        {hiddenItems.includes('register') && (
                            <Button 
                                className="w-full justify-center btn-pill-grey" 
                                onClick={() => handleItemClick(onLogin)}
                            >
                                Register
                            </Button>
                        )}
                        
                        {hiddenItems.includes('language') && (
                            <div className="border-t pt-3">
                                <HeaderLanguageSelector isMobile />
                            </div>
                        )}
                        
                        {hiddenItems.includes('becomeTeacher') && (
                            <Link 
                                to={createPageUrl('TeacherRegistration')} 
                                onClick={() => handleItemClick()}
                                className="block w-full text-center p-3 rounded-md hover:bg-gray-50 transition-colors text-gray-700 border border-gray-200"
                            >
                                Become A Teacher
                            </Link>
                        )}
                        
                        {hiddenItems.includes('findTeachers') && (
                            <Link 
                                to={createPageUrl('FindTutors')} 
                                onClick={() => handleItemClick()}
                                className="block w-full text-center p-3 rounded-md hover:bg-gray-50 transition-colors text-gray-700 border border-gray-200"
                            >
                                Find Teachers
                            </Link>
                        )}
                        
                        {hiddenItems.includes('postRequirement') && (
                            <Link 
                                to={createPageUrl('PostRequirement')} 
                                onClick={() => handleItemClick()}
                                className="block w-full text-center p-3 rounded-md bg-green-600 hover:bg-green-700 transition-colors text-white font-medium"
                            >
                                Post Requirement
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}