import React, { useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// =============================================================================
// Teacher Card — Compact v9 ("full-height price rail"). Imported from the Claude
// Design project "Teacher Card Compact v9.dc.html" and re-authored as a
// data-driven, responsive React component.
//
// DATA SOURCE — every teacher detail maps to the teacher registration form
// (pages 1–5c → the `profileData` object built in TeacherForm.handleSubmit):
//   name ............ personalInfo.fullName            (Page 1)
//   subject ......... subjects[].subject (+ .level)    (Page 1)
//   location ........ personalInfo.location/country    (Page 1)
//   languages ....... personalInfo.languages           (Page 1)  [{language, proficiency}]
//   experience ...... personalInfo.experience          (Page 1)  {online_years, offline_years, industry_years}
//   bio ............. personalInfo.bio                 (Page 3)
//   profilePicture .. personalInfo.profilePicture      (Page 2)
//   video ........... personalInfo.videoIntro          (Page 4)
//   specializations . specializations[].specialization (Page 1)
//   services/prices . services[] + hourly_rate         (Page 5a) [{title, price, enabled, isTrial}]
//   trial price ..... hourly_rate.trial                (Page 5a)
//   cancellation .... Step5bCancellation               (Page 5b) {percentage(=fee), freeCancellationDays, freeCancellationHours, noRefund}
// Fields NOT captured at registration (rating, reviews count, "Top Rated" tag,
// GST/tax %) come from elsewhere (reviews aggregation / admin / GSTInfo) and are
// marked TODO. Until the search RPC (search_teachers → listTeacherCards) is
// extended to surface the full profile, the thin RPC shape (strings only) is
// normalized below and missing fields fall back to the design's mock values.
// =============================================================================

const FALLBACK = {
    reviews: 10,
    tag: 'Top Rated',
    location: 'New York, USA',
    speaks: [
        { name: 'English', level: 'Native' },
        { name: 'Italian', level: 'Fluent' },
        { name: 'German', level: 'Interm.' },
    ],
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor.',
    specializations: [
        'Organic Chemistry', 'Bio Chemistry', 'Analytical Chemistry',
        'Physical Chemistry', 'Inorganic Chemistry',
    ],
    experience: { online: '1 Yr', offline: '3 Yr', industry: '3 Yr' },
    services: [
        { name: 'Online Class', price: 1, tone: 'blue' },
        { name: 'Consulting', price: 5, tone: 'blue' },
        { name: 'Worksheet Review', price: 7, tone: 'green' },
        { name: 'Exam Prep', price: 8, tone: 'blue' },
    ],
    trialPrice: 1,
    taxPct: 18,
    cancellation: { refundPct: 70, freeBeforeDays: 10, freeBeforeHours: 3, noRefund: false },
    subject: 'Chemistry',
};

const SERVICE_TONES = {
    blue: { color: '#1d4ed8', background: '#eef3fe', border: '1px solid #d3e0fb' },
    green: { color: '#15803d', background: '#eefaf1', border: '1px solid #cdeed7' },
};

// --- "+X more" display-only popover -----------------------------------------
// Same hover-to-open dropdown the homepage "Select Subject" +X More uses
// (shared TabSelector → shadcn Popover, `p-2 w-auto`, `flex flex-col space-y-1`).
// The difference, per spec: here the listed items are display-only — they just
// SHOW the overflow, they are NOT clickable selections.
function MoreItemsPopover({ items, triggerLabel, triggerStyle, align = 'end' }) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef(null);
    if (!items || items.length === 0) return null;

    const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
    const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 120); };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button type="button" style={triggerStyle} onMouseEnter={openNow} onMouseLeave={closeSoon}>
                    {triggerLabel}
                </button>
            </PopoverTrigger>
            <PopoverContent className="p-2 w-auto" align={align} onMouseEnter={openNow} onMouseLeave={closeSoon}>
                <div className="flex flex-col space-y-1">
                    {items.map((item, i) => (
                        // display-only row — not a Button, not selectable
                        <div key={i} className="px-3 py-1.5 text-sm text-gray-700 whitespace-nowrap select-none">
                            {item}
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// --- data normalizers (accept registration shape OR thin RPC strings) -------

function subjectName(value, fallback) {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    return value.subject || value.name || fallback;
}

function buildSpeaks(teacher) {
    const langs = Array.isArray(teacher.languageLevels) && teacher.languageLevels.length
        ? teacher.languageLevels
        : (Array.isArray(teacher.languages) ? teacher.languages : []);
    if (langs.length === 0) {
        return { list: FALLBACK.speaks, extra: 0, rest: [] };
    }
    const norm = langs.map((l) =>
        typeof l === 'string'
            ? { name: l, level: '' }
            : { name: l.language || l.name || '', level: l.proficiency || l.level || '' }
    ).filter((l) => l.name);
    const rest = norm.slice(3).map((l) => (l.level ? `${l.name} (${l.level})` : l.name));
    return { list: norm.slice(0, 3), extra: Math.max(0, norm.length - 3), rest };
}

function buildSpecializations(teacher) {
    const raw = Array.isArray(teacher.specializations) && teacher.specializations.length
        ? teacher.specializations
        : FALLBACK.specializations;
    const names = raw.map((s) => (typeof s === 'string' ? s : (s.specialization || s.name))).filter(Boolean);
    return { list: names.slice(0, 5), extra: Math.max(0, names.length - 5), rest: names.slice(5) };
}

function buildServices(teacher) {
    let list;
    if (Array.isArray(teacher.services) && teacher.services.length) {
        list = teacher.services
            .filter((s) => s && s.enabled !== false && !s.isTrial)
            .map((s) => ({ name: s.title || s.name || s.id, price: s.price, tone: s.tone || 'blue' }));
    } else {
        const hr = teacher.hourlyRate || {};
        const out = [];
        if (hr.online != null) out.push({ name: 'Online Class', price: hr.online, tone: 'blue' });
        else if (hr.regular != null) out.push({ name: 'Online Class', price: hr.regular, tone: 'blue' });
        if (hr.consulting != null) out.push({ name: 'Consulting', price: hr.consulting, tone: 'blue' });
        if (hr.interview != null) out.push({ name: 'Technical Interview', price: hr.interview, tone: 'green' });
        list = out.length ? out : FALLBACK.services;
    }
    const all = list;
    return {
        list: all.slice(0, 3),
        extra: Math.max(0, all.length - 3),
        rest: all.slice(3).map((s) => `${s.name} $${s.price}`),
        all,
    };
}

function fmtYears(v) {
    if (v == null || v === '') return null;
    return typeof v === 'number' ? `${v} Yr` : String(v);
}

function buildExperience(teacher) {
    const e = teacher.experience || {};
    return {
        online: fmtYears(e.online_years ?? e.online) ?? FALLBACK.experience.online,
        offline: fmtYears(e.offline_years ?? e.offline) ?? FALLBACK.experience.offline,
        industry: fmtYears(e.industry_years ?? e.industry) ?? FALLBACK.experience.industry,
    };
}

function buildCancellation(teacher) {
    const c = teacher.cancellation || {};
    // Registration (Page 5b) stores `percentage` as the FEE charged on cancel →
    // refund% = 100 − fee%. `refundPct` is also accepted if pre-computed.
    const refundPct = c.refundPct != null
        ? c.refundPct
        : (c.percentage != null ? 100 - c.percentage : FALLBACK.cancellation.refundPct);
    return {
        refundPct,
        freeBeforeDays: c.freeCancellationDays ?? c.freeBeforeDays ?? FALLBACK.cancellation.freeBeforeDays,
        freeBeforeHours: c.freeCancellationHours ?? c.freeBeforeHours ?? FALLBACK.cancellation.freeBeforeHours,
        noRefund: c.noRefund != null ? c.noRefund : refundPct <= 0,
    };
}

// Price-rail headline. Normally leads with the Trial Lesson. But once the student
// has already had a trial lesson with THIS teacher, the next time they see this
// teacher in the listing the rail leads with the SERVICE they selected (its real
// price + a "Book <service>" CTA) instead of the trial — a second trial isn't on
// offer. If they're actively searching a specific offered service, that wins.
// TODO(real-data): `trialedServiceNames` / `selectedServiceName` come from the
// student's booking history with this teacher.
function resolveBookingHeadline({ services, trialPrice, searchQuery, trialedServiceNames, selectedServiceName }) {
    const trialed = Array.isArray(trialedServiceNames) ? trialedServiceNames : [];
    const hadTrial = trialed.length > 0 || !!selectedServiceName;

    const findService = (q) => {
        if (!q) return null;
        const n = String(q).trim().toLowerCase();
        return n ? services.find((s) => String(s.name).toLowerCase().includes(n)) : null;
    };

    if (hadTrial) {
        // Prefer what they're searching for; else the service selected at trial time.
        const picked = findService(searchQuery)
            || findService(selectedServiceName)
            || findService(trialed[0])
            || services[0];
        if (picked) {
            return { mode: 'service', label: picked.name, price: picked.price, cta: `Book ${picked.name}` };
        }
    }
    return { mode: 'trial', label: 'Trial Lesson', price: trialPrice, cta: 'Book A Trial' };
}

function Stars({ rating }) {
    const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return (
        <span style={{ color: '#f5a623', fontSize: '13px', letterSpacing: '1px' }}>
            {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
        </span>
    );
}

const SectionLabel = ({ children }) => (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '.07em' }}>
        {children}
    </div>
);

// --- component --------------------------------------------------------------

const TeacherCard = ({ teacher, searchQuery = '' }) => {
    if (!teacher) return null;

    const name = teacher.name || teacher.fullName || 'Teacher';
    const subject = subjectName((teacher.subjects || [])[0], FALLBACK.subject);
    const reviews = teacher.reviews != null ? teacher.reviews : FALLBACK.reviews;
    const tag = teacher.tag || FALLBACK.tag;
    const location = teacher.location || FALLBACK.location;
    const bio = teacher.bio || FALLBACK.bio;
    const avatar = teacher.profilePicture || teacher.profileImage || '';
    const taxPct = teacher.taxPct != null ? teacher.taxPct : FALLBACK.taxPct;

    const speaks = useMemo(() => buildSpeaks(teacher), [teacher]);
    const specs = useMemo(() => buildSpecializations(teacher), [teacher]);
    const services = useMemo(() => buildServices(teacher), [teacher]);
    const experience = useMemo(() => buildExperience(teacher), [teacher]);
    const cancellation = useMemo(() => buildCancellation(teacher), [teacher]);
    const trialPrice = teacher.hourlyRate?.trial != null ? teacher.hourlyRate.trial : FALLBACK.trialPrice;

    const headline = useMemo(
        () => resolveBookingHeadline({
            services: services.all,
            trialPrice,
            searchQuery,
            trialedServiceNames: teacher.trialedServiceNames,
            selectedServiceName: teacher.selectedServiceName,
        }),
        [services.all, trialPrice, searchQuery, teacher.trialedServiceNames, teacher.selectedServiceName]
    );

    return (
        // overflow-x wrapper keeps wide column content from breaking the page on
        // intermediate widths; the card itself stacks vertically below md.
        <div className="w-full overflow-x-auto">
            <div
                className="mx-auto w-full md:max-w-[832px] xl:max-w-[1060px] flex flex-col md:flex-row h-auto md:h-[360px] rounded-2xl border border-[#ececec] overflow-hidden"
                style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.07)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            >
                {/* LEFT SECTION: body + services bar */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-col md:flex-row md:flex-1 min-h-0">
                        {/* identity column */}
                        <div className="w-full md:w-[248px] md:flex-none flex flex-col border-b md:border-b-0 md:border-r border-[#f0f0f0]" style={{ padding: '18px 20px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{ position: 'relative', flex: 'none' }}>
                                    {avatar ? (
                                        <img src={avatar} alt={name} style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 0 0 1px #e4e4e4' }} />
                                    ) : (
                                        <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg,#cdd5df,#9aa6b2)', border: '2px solid #fff', boxShadow: '0 0 0 1px #e4e4e4' }} />
                                    )}
                                    <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '13px', height: '13px', borderRadius: '50%', background: '#22c55e', border: '2.5px solid #fff' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '19px', fontWeight: 800, color: '#1a1a1a' }}>{name}</div>
                                    <div style={{ fontSize: '13px', color: '#5a5a5a', fontWeight: 600, marginTop: '2px' }}>⚗ {subject} ▾</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                                        <Stars rating={teacher.rating} />
                                        <span style={{ fontSize: '12px', color: '#8a8a8a', fontWeight: 600 }}>({reviews})</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '9px' }}>
                                {tag && <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#16a34a', background: '#e8f6ed', padding: '3px 8px', borderRadius: '5px' }}>{tag}</span>}
                                <span style={{ fontSize: '12.5px', color: '#5a5a5a', fontWeight: 600 }}>📍 {location}</span>
                            </div>
                            <div style={{ marginTop: '24px' }}>
                                <SectionLabel>Speaks</SectionLabel>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 6px', marginTop: '8px' }}>
                                    {speaks.list.map((lang, i) => (
                                        <div key={i}>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#2a2a2a' }}>{lang.name}</div>
                                            {lang.level && <div style={{ fontSize: '11px', color: '#9a9a9a' }}>{lang.level}</div>}
                                        </div>
                                    ))}
                                </div>
                                <MoreItemsPopover
                                    items={speaks.rest}
                                    triggerLabel={`+${speaks.extra} more languages ›`}
                                    align="start"
                                    triggerStyle={{ marginTop: '9px', fontSize: '11.5px', fontWeight: 700, color: '#16a34a', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0, textAlign: 'left' }}
                                />
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                <p style={{ flex: 1, fontSize: '12.5px', lineHeight: 1.5, color: '#8a8a8a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{bio}</p>
                                <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #d6d6d6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 700, flex: 'none', cursor: 'pointer' }}>＋</span>
                            </div>
                        </div>

                        {/* middle: specializations + experience */}
                        <div className="w-full md:flex-1 flex flex-col min-w-0" style={{ padding: '18px 22px' }}>
                            <SectionLabel>Specializations</SectionLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                                {specs.list.map((spec, i) => (
                                    <span key={i} style={{ fontSize: '13px', fontWeight: 700, color: '#2a2a2a', background: '#fff', border: '1px solid #e1e1de', padding: '8px 14px', borderRadius: '9px' }}>{spec}</span>
                                ))}
                                <MoreItemsPopover
                                    items={specs.rest}
                                    triggerLabel={`+${specs.extra} More ▾`}
                                    triggerStyle={{ fontSize: '12.5px', fontWeight: 700, color: '#16a34a', background: '#e8f6ed', border: '1px solid #cdeed7', padding: '8px 13px', borderRadius: '9px', cursor: 'pointer' }}
                                />
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '18px' }}>
                                <SectionLabel>Experience</SectionLabel>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '11px', maxWidth: '320px' }}>
                                    <div><div style={{ fontSize: '12px', color: '#8a8a8a' }}>Online</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#2a2a2a' }}>{experience.online}</div></div>
                                    <div><div style={{ fontSize: '12px', color: '#8a8a8a' }}>Offline</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#2a2a2a' }}>{experience.offline}</div></div>
                                    <div><div style={{ fontSize: '12px', color: '#8a8a8a' }}>Industry</div><div style={{ fontSize: '15px', fontWeight: 700, color: '#2a2a2a' }}>{experience.industry}</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* services bar (stops before the full-height price rail) */}
                    <div className="flex-none border-t border-[#eee] flex items-center gap-[9px] flex-wrap md:flex-nowrap overflow-hidden" style={{ padding: '13px 20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '.07em', flex: 'none' }}>Services</span>
                        {services.list.map((svc, i) => {
                            const tone = SERVICE_TONES[svc.tone] || SERVICE_TONES.blue;
                            return (
                                <span key={i} style={{ fontSize: '12.5px', fontWeight: 700, padding: '6px 11px', borderRadius: '8px', flex: 'none', whiteSpace: 'nowrap', ...tone }}>
                                    {svc.name} ${svc.price}
                                </span>
                            );
                        })}
                        <MoreItemsPopover
                            items={services.rest}
                            triggerLabel={`+${services.extra} more ▾`}
                            triggerStyle={{ fontSize: '12.5px', fontWeight: 700, color: '#16a34a', background: '#fff', border: '1px solid #cdeed7', padding: '6px 11px', borderRadius: '8px', flex: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        />
                    </div>
                </div>

                {/* PRICE RAIL — full height (stacks below on phone) */}
                <div className="w-full md:w-[208px] md:flex-none flex flex-col border-t md:border-t-0 md:border-l border-[#f0f0f0]" style={{ padding: '18px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#7a7a7a', background: '#f4f4f2', padding: '4px 8px', borderRadius: '6px' }}>+{taxPct}% Tax</span>
                        <svg width="15" height="17" viewBox="0 0 16 18"><path d="M2 0h12v18l-6-4-6 4z" fill="#ec4899" /></svg>
                    </div>
                    {/* leads with Trial Lesson, or the searched/selected service once it has
                        already been trialed with this teacher (see resolveBookingHeadline). */}
                    <div style={{ marginTop: '12px', background: '#f3fbf6', border: '1px solid #cdeed7', borderRadius: '11px', padding: '12px 13px' }}>
                        <div style={{ fontSize: '11px', color: '#6aa882', fontWeight: 700 }}>{headline.label}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                            <span style={{ fontSize: '30px', fontWeight: 800, color: '#16a34a', letterSpacing: '-.02em' }}>${headline.price}</span>
                            <span style={{ fontSize: '12px', color: '#9a9a9a', fontWeight: 600 }}>/hr</span>
                        </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                        <SectionLabel>Cancellation</SectionLabel>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#2a2a2a', marginTop: '4px' }}>
                            {cancellation.noRefund ? 'No refund' : `${cancellation.refundPct}% refund`}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#8a8a8a', lineHeight: 1.4 }}>Free before {cancellation.freeBeforeDays} days &amp; {cancellation.freeBeforeHours} hr</div>
                        {/* One policy applies to every service, the trial lesson included. */}
                        <div style={{ fontSize: '10.5px', color: '#a8a8a8', marginTop: '2px' }}>For all services, incl. trial lesson</div>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button style={{ border: 'none', background: '#16a34a', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 800, padding: '11px', borderRadius: '9px', cursor: 'pointer', boxShadow: '0 5px 14px rgba(22,163,74,.26)' }}>{headline.cta}</button>
                        <button style={{ border: '1.5px solid #16a34a', background: '#fff', color: '#16a34a', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, padding: '9px', borderRadius: '9px', cursor: 'pointer' }}>📅 View Schedule</button>
                        <div style={{ display: 'flex', gap: '7px' }}>
                            <button style={{ flex: 1, border: '1.5px solid #d6d6d6', background: '#fff', color: '#3a3a3a', fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 700, padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>Message</button>
                            <button style={{ flex: 1, border: '1.5px solid #d6d6d6', background: '#fff', color: '#3a3a3a', fontFamily: 'inherit', fontSize: '11.5px', fontWeight: 700, padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>Profile</button>
                        </div>
                    </div>
                </div>

                {/* VIDEO — full height. Hidden on smaller screens (only shows at xl,
                    where there's room for the full 4-section layout). */}
                <div className="hidden xl:flex w-[230px] flex-none relative items-center justify-center border-l border-[#f0f0f0]" style={{ background: 'repeating-linear-gradient(45deg,#e7edf1,#e7edf1 11px,#f1f5f8 11px,#f1f5f8 22px)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 0, height: 0, borderLeft: '16px solid #16a34a', borderTop: '10px solid transparent', borderBottom: '10px solid transparent', marginLeft: '4px' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '11px', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.55)', padding: '4px 9px', borderRadius: '6px' }}>▶ 0:48 Intro</div>
                </div>
            </div>
        </div>
    );
};

export default TeacherCard;
