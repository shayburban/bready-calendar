import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, QrCode, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const SocialButton = ({ icon, onClick }) => (
    <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={onClick}>
        {icon}
    </Button>
);

// Mirrors the floating-label input pattern used in LoginModal.
const FloatingField = ({ id, label, type = 'text', className = '', trailing }) => (
    <div className="relative">
        <Input id={id} type={type} placeholder=" " className={`pt-6 ${className}`} />
        <label
            htmlFor={id}
            className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4"
        >
            {label}
        </label>
        {trailing}
    </div>
);

// "Book for others" toggle + the four contact fields it reveals.
// Shown in both the Email and QR tabs, so it lives in one place.
const BookForOthers = ({ idPrefix }) => {
    const [enabled, setEnabled] = useState(true);
    return (
        <div className="pt-2 text-left">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={enabled} onCheckedChange={setEnabled} />
                Book for others
            </label>
            {enabled && (
                <div className="space-y-4 mt-4">
                    <FloatingField id={`${idPrefix}-nm`} label="Name" />
                    <FloatingField id={`${idPrefix}-rs`} label="Relation With Student" />
                    <FloatingField id={`${idPrefix}-ph`} label="Phone No." type="tel" />
                    <FloatingField id={`${idPrefix}-em`} label="Email Address" type="email" />
                </div>
            )}
        </div>
    );
};

const RegisterFooter = ({ onLoginClick }) => (
    <>
        <p className="text-center text-sm mt-4">
            Already have an account?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }} className="text-brand-blue font-semibold hover:underline">Log In.</a>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-2">
            By proceeding, you agree to our{' '}
            <a href="#" className="text-brand-blue hover:underline">Terms Of Service</a> and{' '}
            <a href="#" className="text-brand-blue hover:underline">Privacy Policy</a>
        </p>
    </>
);

const EmailRegisterTab = ({ onLoginClick }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <FloatingField id="reg-name" label="Name" />
            <FloatingField id="reg-email" label="Email Address" type="email" />

            <div>
                <p className="text-sm text-gray-500 mb-2">Phone No. (Optional)</p>
                <div className="flex gap-2">
                    <div className="w-24 relative">
                        <Input defaultValue="+91" disabled className="pl-10" />
                        <img src="https://flagcdn.com/in.svg" alt="India" className="absolute top-1/2 left-2 -translate-y-1/2 w-6 h-auto" />
                    </div>
                    <div className="flex-1">
                        <FloatingField
                            id="reg-phone"
                            label="Phone No."
                            type="tel"
                            className="pr-16"
                            trailing={<Button type="button" size="sm" className="absolute top-1/2 right-1 -translate-y-1/2 btn-pill-green">Send</Button>}
                        />
                    </div>
                </div>
            </div>

            <FloatingField
                id="reg-code"
                label="Verification Code"
                className="pr-16"
                trailing={<Button type="button" size="sm" className="absolute top-1/2 right-1 -translate-y-1/2 btn-pill-green">Send</Button>}
            />
            <p className="text-xs text-gray-500">
                Not received your code?{' '}
                <a href="#" onClick={(e) => e.preventDefault()} className="text-brand-blue hover:underline">Resend code</a>
            </p>

            <div className="relative">
                <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder=" " className="pt-6" />
                <label htmlFor="reg-password" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                    Password
                </label>
                <Button size="icon" variant="ghost" type="button" className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                <li>More than 8 characters</li>
                <li>Include special characters</li>
            </ul>

            <Button type="submit" className="w-full btn-pill-green">Sign Up</Button>

            <RegisterFooter onLoginClick={onLoginClick} />
            <BookForOthers idPrefix="reg" />
        </form>
    );
};

const QRRegisterTab = ({ onLoginClick }) => (
    <div className="space-y-4 text-center">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BreadyRegister" alt="QR Code" className="mx-auto" />
        <p className="text-sm">Log in with Wechat</p>
        <RegisterFooter onLoginClick={onLoginClick} />
        <BookForOthers idPrefix="reg-qr" />
    </div>
);

export default function RegisterModal({ isOpen, onOpenChange, onLoginOpen }) {
    const handleGoogleRegister = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin },
        });
        if (error) {
            console.error('Google sign-up failed:', error);
            alert(`Sign-up failed: ${error.message}`);
        }
    };

    const handleSwitchToLogin = () => {
        onOpenChange(false);
        onLoginOpen();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center mb-4">
                    <DialogTitle className="text-3xl font-bold">Register Now</DialogTitle>
                </DialogHeader>

                <div className="text-center">
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <SocialButton
                            icon={<img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="h-6 w-6" />}
                            onClick={() => alert('Facebook sign-up coming soon!')}
                        />
                        <SocialButton
                            icon={<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="h-6 w-6" />}
                            onClick={handleGoogleRegister}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="w-12 h-12 rounded-full">
                                    <MoreHorizontal className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Apple</DropdownMenuItem>
                                <DropdownMenuItem>Twitter</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email Id</TabsTrigger>
                        <TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-2" />QR Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="email" className="pt-6">
                        <EmailRegisterTab onLoginClick={handleSwitchToLogin} />
                    </TabsContent>
                    <TabsContent value="qr" className="pt-6">
                        <QRRegisterTab onLoginClick={handleSwitchToLogin} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
