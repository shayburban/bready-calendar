
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail, Phone, Facebook, Twitter, Linkedin } from 'lucide-react';

const FooterLinkColumn = ({ title, links }) => (
    <div>
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <ul className="space-y-2">
            {links.map(link => (
                <li key={link.text}>
                    <Link to={createPageUrl(link.href)} className="text-gray-300 hover:text-white transition-colors">
                        {link.text}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

const SocialLinks = () => (
    <div className="flex space-x-4 mt-2">
        <a href="#" className="text-gray-300 hover:text-white"><Facebook className="h-5 w-5" /></a>
        <a href="#" className="text-gray-300 hover:text-white"><Twitter className="h-5 w-5" /></a>
        <a href="#" className="text-gray-300 hover:text-white"><Linkedin className="h-5 w-5" /></a>
    </div>
);

const quickLinks = [
    { href: 'Home', text: 'Home' },
    { href: '#', text: 'About Us' },
    { href: '#', text: 'Join Our Crew' },
    { href: '#', text: 'Invite Friends' },
    { href: '#', text: 'Contact' },
];

const servicesLinks = [
    { href: 'FindTutors', text: 'Online Classes' },
    { href: 'FindTutors', text: 'Consulting' },
    { href: 'FindTutors', text: 'Technical Interview' },
];

const subjectsLinks = [
    { href: '#', text: 'Language' },
    { href: '#', text: 'Computer Coding' },
    { href: '#', text: 'Programming' },
    { href: '#', text: 'Accounting' },
    { href: '#', text: 'Graphics Design' },
];

const supportLinks = [
    { href: '#', text: 'Help & Support' },
    { href: '#', text: 'Privacy Policy' },
    { href: '#', text: 'Terms & Conditions' },
];

export default function Footer({ isTeacherRegistrationPage }) {
  return (
    <div className={`bg-gray-800 text-white py-8 ${isTeacherRegistrationPage ? 'hidden' : ''}`}>
        <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                <div className="col-span-2 md:col-span-4 lg:col-span-1">
                     {/* You can replace this with your own logo image after uploading it. */}
                    <span className="text-3xl font-bold">Bready</span>
                </div>
                <FooterLinkColumn title="Quick Links" links={quickLinks} />
                <FooterLinkColumn title="Services" links={servicesLinks} />
                <FooterLinkColumn title="Subjects" links={subjectsLinks} />
                <FooterLinkColumn title="Support" links={supportLinks} />
                <div>
                     <h3 className="text-lg font-semibold text-white mb-4">Reach Us At</h3>
                     <ul className="space-y-2 text-gray-300">
                        <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> support@bready.com</li>
                        <li className="flex items-center gap-2"><Phone className="h-4 w-4"/> +1 (123) 456-789</li>
                        <li><SocialLinks /></li>
                     </ul>
                </div>
            </div>
        </div>
        <div className="bg-gray-900 py-4">
            <p className="text-center text-gray-400 text-sm">© Bready 2024. All Rights Reserved.</p>
        </div>
    </div>
  );
}
