import React from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

export default function RegisterModal({ isOpen, onOpenChange, onLoginOpen }) {

    const handleRegister = async () => {
        try {
            // The User.login() method handles both login and registration for new users via SSO
            await User.login(); 
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };
    
    const handleSwitchToLogin = () => {
        onOpenChange(false);
        onLoginOpen();
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-8">
                <DialogHeader className="text-center mb-4">
                    <DialogTitle className="text-3xl font-bold">Create an Account</DialogTitle>
                    <DialogDescription>
                        Join our community of learners and teachers.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Sign up with one of our trusted providers for a secure and easy registration.</p>
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <Button variant="outline" size="lg" className="w-full" onClick={handleRegister}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="h-5 w-5 mr-2" />
                            Sign up with Google
                        </Button>
                    </div>
                </div>

                <p className="text-center text-sm">
                    Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); handleSwitchToLogin(); }} className="text-brand-blue font-semibold hover:underline">Login</a>
                </p>
            </DialogContent>
        </Dialog>
    );
}