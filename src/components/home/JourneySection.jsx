import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JourneySection() {
    return (
        <section className="py-24 px-8 max-w-7xl mx-auto">
            <div className="bg-stitch-inverse-surface rounded-[2rem] p-12 md:p-20 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
                    <img
                        className="w-full h-full object-cover"
                        src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop"
                        alt="Books"
                    />
                </div>

                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-headline">
                        Elevate your learning journey today.
                    </h2>
                    <p className="text-gray-300 text-lg mb-10 leading-relaxed">
                        Join over 50,000 students achieving their academic goals with Bready. Our platform ensures rigorous vetting and premium support for every session.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link to={createPageUrl('FindTutors')}>
                            <Button className="bg-stitch-primary-light text-white px-8 py-6 rounded-xl font-bold hover:bg-stitch-primary transition-all text-base">
                                Start Learning
                            </Button>
                        </Link>
                        <Link to={createPageUrl('TeacherRegistration')}>
                            <Button
                                variant="outline"
                                className="border-2 border-gray-400 text-white px-8 py-6 rounded-xl font-bold hover:bg-white/10 transition-all text-base"
                            >
                                Become a Teacher
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
