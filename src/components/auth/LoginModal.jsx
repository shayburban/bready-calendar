import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Phone, QrCode, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SocialButton = ({ icon, onClick }) => (
    <Button variant="outline" size="icon" className="w-12 h-12 rounded-full" onClick={onClick}>
        {icon}
    </Button>
);

const SocialLogins = ({ onLogin, onRegisterOpen }) => (
    <div className="text-center">
        <div className="flex justify-center items-center gap-4 mb-6">
            <SocialButton icon={<img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" className="h-6 w-6" />} onClick={() => alert('Facebook login coming soon!')} />
            <SocialButton icon={<img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="h-6 w-6" />} onClick={onLogin} />
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
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
            </div>
        </div>
    </div>
);

const EmailTab = ({ onRegisterOpen }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
        <form className="space-y-4">
            <div className="relative">
                <Input id="email" type="email" placeholder=" " className="pt-6" />
                <label htmlFor="email" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                    Email Address
                </label>
            </div>
            <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder=" " className="pt-6" />
                <label htmlFor="password" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                    Password
                </label>
                <Button size="icon" variant="ghost" type="button" className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
            <div className="d-grid">
                <Button type="submit" className="w-full btn-pill-green">Login</Button>
            </div>
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Checkbox id="save-password" />
                    <label htmlFor="save-password">Save Password</label>
                </div>
                <Link to="#" className="text-brand-blue hover:underline">Forgot Password?</Link>
            </div>
            <p className="text-center text-sm">
                Don’t have an account? <a href="#" onClick={(e) => { e.preventDefault(); onRegisterOpen(); }} className="text-brand-blue font-semibold hover:underline">Register</a>
            </p>
        </form>
    );
};

const PhoneTab = ({ onRegisterOpen }) => {
     const [showPassword, setShowPassword] = useState(false);
    return (
        <form className="space-y-4">
            <div className="flex gap-2">
                <div className="w-24 relative">
                    <Input id="country-code" type="text" value="+91" disabled className="pl-10" />
                     <img src="https://flagcdn.com/in.svg" alt="India Flag" className="absolute top-1/2 left-2 -translate-y-1/2 w-6 h-auto" />
                </div>
                <div className="relative flex-1">
                    <Input id="phone" type="tel" placeholder=" " className="pt-6" />
                    <label htmlFor="phone" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                        Phone No.
                    </label>
                </div>
            </div>
             <div className="relative">
                <Input id="password-phone" type={showPassword ? "text" : "password"} placeholder=" " className="pt-6" />
                <label htmlFor="password-phone" className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] left-2.5 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                    Password
                </label>
                <Button size="icon" variant="ghost" type="button" className="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
            </div>
            <div className="d-grid">
                <Button type="submit" className="w-full btn-pill-green">Login</Button>
            </div>
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <Checkbox id="save-password-phone" />
                    <label htmlFor="save-password-phone">Save Password</label>
                </div>
                <Link to="#" className="text-brand-blue hover:underline">Forgot Password?</Link>
            </div>
            <p className="text-center text-sm">
                Don’t have an account? <a href="#" onClick={(e) => { e.preventDefault(); onRegisterOpen(); }} className="text-brand-blue font-semibold hover:underline">Register</a>
            </p>
        </form>
    );
}

const QRTab = ({ onRegisterOpen }) => (
    <div className="text-center space-y-4">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example" alt="QR Code" className="mx-auto" />
        <p>Log in with Wechat</p>
        <p className="text-center text-sm">
            Don’t have an account? <a href="#" onClick={(e) => { e.preventDefault(); onRegisterOpen(); }} className="text-brand-blue font-semibold hover:underline">Register</a>
        </p>
    </div>
);


export default function LoginModal({ isOpen, onOpenChange, onRegisterOpen }) {

    const handleLogin = async () => {
        try {
            await User.login();
        } catch (error) {
            console.error("Login failed:", error);
            // Optionally, show an error message to the user
        }
    };
    
    const handleSwitchToRegister = () => {
        onOpenChange(false); // Close login modal
        onRegisterOpen(); // Open register modal
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-8">
                <DialogHeader className="text-center mb-4">
                    <DialogTitle className="text-3xl font-bold">Login</DialogTitle>
                </DialogHeader>
                
                <SocialLogins onLogin={handleLogin} onRegisterOpen={handleSwitchToRegister} />

                <Tabs defaultValue="email" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" />Email ID</TabsTrigger>
                        <TabsTrigger value="phone"><Phone className="h-4 w-4 mr-2" />Phone No.</TabsTrigger>
                        <TabsTrigger value="qr"><QrCode className="h-4 w-4 mr-2" />QR Code</TabsTrigger>
                    </TabsList>
                    <TabsContent value="email" className="pt-6">
                        <EmailTab onRegisterOpen={handleSwitchToRegister} />
                    </TabsContent>
                    <TabsContent value="phone" className="pt-6">
                        <PhoneTab onRegisterOpen={handleSwitchToRegister} />
                    </TabsContent>
                    <TabsContent value="qr" className="pt-6">
                        <QRTab onRegisterOpen={handleSwitchToRegister} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}