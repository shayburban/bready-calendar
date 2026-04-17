import React from 'react';

export default function RequirementSection() {
    return (
        <footer className="bg-stitch-surface-low w-full py-12 mt-auto">
            <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto w-full gap-4">
                <div className="flex flex-col gap-2">
                    <span className="text-xl font-bold text-stitch-on-surface font-headline">Bready Academic</span>
                    <p className="text-sm text-stitch-on-surface-variant">
                        The curated academic destination for premium online education and expert guidance.
                    </p>
                    <p className="text-sm text-stitch-on-surface-variant mt-2">
                        &copy; {new Date().getFullYear()} Bready Academic. All rights reserved.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-8 text-sm">
                    <a className="text-stitch-on-surface-variant hover:text-stitch-primary-light transition-colors" href="#">Privacy Policy</a>
                    <a className="text-stitch-on-surface-variant hover:text-stitch-primary-light transition-colors" href="#">Terms of Service</a>
                    <a className="text-stitch-on-surface-variant hover:text-stitch-primary-light transition-colors" href="#">Cookie Policy</a>
                    <a className="text-stitch-on-surface-variant hover:text-stitch-primary-light transition-colors" href="#">Contact Support</a>
                </div>
            </div>
        </footer>
    );
}
