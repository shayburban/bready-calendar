import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function HeroSection() {
    return (
        <section className="relative min-h-[700px] flex items-center justify-center pt-20 px-8">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    className="w-full h-full object-cover opacity-10"
                    src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2090&auto=format&fit=crop"
                    alt="Modern library interior"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-stitch-surface via-transparent to-stitch-surface" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl w-full text-center">
                <h1 className="text-5xl md:text-7xl font-bold text-stitch-on-surface tracking-tight mb-8 leading-[1.1] font-headline">
                    Find The Perfect <br />
                    <span className="text-stitch-primary-light italic">Online Teacher</span>
                </h1>
                <p className="text-stitch-on-surface-variant text-lg mb-10">
                    To Receive The Best Solution for your academic journey. Curated experts ready to guide you.
                </p>

                {/* Search Bar */}
                <div className="bg-white p-2 md:p-3 rounded-full shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto items-center">
                    <div className="flex items-center gap-3 px-6 py-3 w-full md:border-r border-stitch-outline-variant/20">
                        <Search className="h-5 w-5 text-stitch-outline" />
                        <Input
                            type="text"
                            placeholder="Subject (e.g. Quantum Physics)"
                            className="w-full bg-transparent border-none focus-visible:ring-0 text-stitch-on-surface placeholder:text-stitch-outline/60 text-sm shadow-none"
                        />
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 w-full">
                        <MapPin className="h-5 w-5 text-stitch-outline" />
                        <Input
                            type="text"
                            placeholder="Level or Location"
                            className="w-full bg-transparent border-none focus-visible:ring-0 text-stitch-on-surface placeholder:text-stitch-outline/60 text-sm shadow-none"
                        />
                    </div>
                    <Link to={createPageUrl('FindTutors')}>
                        <Button className="w-full md:w-auto bg-gradient-to-br from-stitch-primary to-stitch-primary-light text-white px-10 py-6 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
                            Search
                        </Button>
                    </Link>
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-60">
                    <span className="text-xs font-bold tracking-widest uppercase text-stitch-on-surface-variant">
                        Trusted by institutions worldwide
                    </span>
                </div>
            </div>
        </section>
    );
}
