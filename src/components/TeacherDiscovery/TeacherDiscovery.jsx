import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isHorizontalSwipe, decideSwipe } from './discoveryGesture';
import {
  mapTeacherToDiscovery,
  BOOKING_DAYS,
  BOOKING_TIMES,
  isSlotAvailable,
} from './discoveryData';

// =============================================================================
// Teacher Discovery — Bumble-style swipe-to-book PHONE screen.
// React port of the Claude Design project "Teacher Discovery.dc.html".
//
// Mounted PHONE-ONLY by FindTutors (`md:hidden`); the desktop/tablet grid is
// untouched. Self-contained `fixed inset-0` shell with its own sticky header +
// footer; the card region between them is the only intentional scroller.
//
//   • swipe LEFT  = Pass  (discard, next teacher; fires at any scroll position)
//   • swipe RIGHT = Book  (opens the availability bottom sheet — a soft intent;
//                          committed only on Confirm)
//   • vertical drag always scrolls the card details, never moves the card
//
// Gesture math lives in ./discoveryGesture.js (pure + unit-tested). Drag is
// driven imperatively via refs (no per-frame React re-render), exactly like the
// source design. Honors prefers-reduced-motion.
// =============================================================================

const ACCENT = '#37B34A';
const ACCENT_DARK = '#2E9E3F';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- tiny presentational helpers -------------------------------------------

function Stars({ rating, size = 13 }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span style={{ display: 'flex', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < filled ? '#F5A623' : '#E2E6EA'}>
          <polygon points="12 2 14.7 8.6 21.5 9.1 16.3 13.6 18 20.3 12 16.5 6 20.3 7.7 13.6 2.5 9.1 9.3 8.6" />
        </svg>
      ))}
    </span>
  );
}

const Divider = ({ m = '15px 0' }) => (
  <div style={{ height: 1, background: '#EFF1F4', margin: m }} />
);

const SectionHead = ({ children }) => (
  <div style={{ fontSize: 19, fontWeight: 800, color: '#16233A' }}>{children}</div>
);

const Avatar = ({ t, size, font }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: t.grad,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: font,
      flex: '0 0 auto',
    }}
  >
    {t.initials}
  </div>
);

// ---- the swipe card (two layers) -------------------------------------------

function SwipeCard({
  t, cardRef, scrollRef, miniRef, cueRef, washRef, bookRef, passRef,
  onPointerDown, onPointerMove, onPointerUp, onScroll,
  saved, onToggleSave, onBook,
  specsOpen, onToggleSpecs, aboutOpen, onToggleAbout,
}) {
  const specsShown = specsOpen ? t.specializations : t.specializations.slice(0, 4);
  const hasMoreSpecs = t.specializations.length > 4;
  const bio = t.bio || '';
  const aboutClamped = !aboutOpen && bio.length > 160;
  const aboutText = aboutClamped ? `${bio.slice(0, 160).trim()}…` : bio;

  return (
    <div
      ref={cardRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'absolute', inset: 14, zIndex: 3, background: '#fff',
        border: '1px solid #E4E8EC', borderRadius: 20,
        boxShadow: '0 12px 34px rgba(20,30,45,.13)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', touchAction: 'pan-y',
        willChange: 'transform', cursor: 'grab',
      }}
    >
      {/* Layer 1: scroll container */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="dc-noscrollbar"
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch', touchAction: 'pan-y',
        }}
      >
        {/* sticky mini summary — fades in once scrolled past the summary */}
        <div
          ref={miniRef}
          style={{
            position: 'sticky', top: 0, zIndex: 5, opacity: 0, marginBottom: -49,
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
            background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', borderBottom: '1px solid #EEF0F3',
            pointerEvents: 'none',
          }}
        >
          <Avatar t={t} size={30} font={11} />
          <span style={{ fontWeight: 700, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.name}
          </span>
          <span style={{ fontSize: 13, color: '#5B6675' }}>
            from <b style={{ color: '#1E7FE0' }}>{t.prices[0]?.amount}$</b>/hr
          </span>
        </div>

        {/* SUMMARY */}
        <div style={{ padding: '24px 16px 8px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 82 }}>
              <div style={{ position: 'relative' }}>
                <Avatar t={t} size={74} font={24} />
                {t.online && (
                  <span style={{ position: 'absolute', right: 4, bottom: 4, width: 14, height: 14, borderRadius: '50%', background: '#22C55E', border: '2.5px solid #fff' }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Stars rating={t.rating} />
                <span style={{ fontSize: 11, color: '#8A93A0' }}>({t.reviewCount})</span>
              </div>
              {t.topRated && <span style={{ fontSize: 12, fontWeight: 700, color: '#16233A' }}>Top Rated</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 800, lineHeight: 1.1, color: '#16233A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.flag ? `${t.flag} ` : ''}{t.name}
                </div>
                <button onClick={onToggleSave} aria-label={saved ? 'Remove from saved' : 'Save teacher'}
                  style={{ flex: '0 0 auto', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? ACCENT : 'none'} stroke={saved ? ACCENT : '#9AA3AE'} strokeWidth="1.6">
                    <path d="M6 3h12v18l-6-4-6 4z" />
                  </svg>
                </button>
              </div>
              <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {t.prices.slice(0, 3).map((pr, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#1B2733', lineHeight: 1.1 }}>
                    <span style={{ fontWeight: 700 }}>{pr.label}:</span>{' '}
                    <span style={{ color: '#1E7FE0', fontWeight: 800, fontSize: 15 }}>{pr.amount} $</span>{' '}
                    <span style={{ fontWeight: 700, color: '#3C4651' }}>/Hr.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Divider />

          {/* "Why this teacher" trust signal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F3FBF6', border: '1px solid #CDEED7', borderRadius: 11, padding: '10px 12px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="2" style={{ flex: '0 0 auto' }}>
              <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
            </svg>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1B5E2A', lineHeight: 1.35 }}>{t.whyThisTeacher}</span>
          </div>

          <Divider />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 13.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, color: '#2E3A46' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16233A" strokeWidth="1.7" strokeLinejoin="round">
                <path d="M9 3h6M10 3v5.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.5V3" />
              </svg>
              {t.subject}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#48515D', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A93A0" strokeWidth="1.7">
                <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" />
              </svg>
              {t.location}
            </span>
          </div>

          <Divider />

          {/* languages */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16233A" strokeWidth="1.5" style={{ flex: '0 0 auto' }}>
              <circle cx="12" cy="12" r="9" /><line x1="3" y1="12" x2="21" y2="12" />
              <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
            </svg>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', gap: 6 }}>
              {t.speaks.slice(0, 3).map((lg, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2E3A46' }}>{lg.language}</div>
                  <div style={{ fontSize: 11, color: '#8A93A0' }}>{lg.level}</div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          <div style={{ fontSize: 15, fontWeight: 800, color: '#16233A', marginBottom: 11 }}>Specializations</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {specsShown.map((sp, i) => (
              <span key={i} style={{ fontSize: 12, color: '#48515D', background: '#F2F4F6', padding: '7px 12px', borderRadius: 20 }}>{sp}</span>
            ))}
            {hasMoreSpecs && (
              <button onClick={onToggleSpecs}
                style={{ fontSize: 12, fontWeight: 600, color: '#3C4651', background: '#F2F4F6', border: 'none', padding: '7px 12px', borderRadius: 20, cursor: 'pointer' }}>
                {specsOpen ? 'Show less' : `+${t.specializations.length - 4} more`}
              </button>
            )}
          </div>

          <Divider />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: '0 0 auto', fontSize: 14, fontWeight: 800, color: '#16233A', width: 82 }}>Experience</span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              {[['Online', t.experience.online], ['Offline', t.experience.offline], ['Industry', t.experience.industry]].map(([k, v], i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#2E3A46' }}>{k}</div>
                  <div style={{ fontSize: 12, color: '#6B7480', marginTop: 1 }}>{v} Year</div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ flex: '0 0 auto', fontSize: 14, fontWeight: 800, color: '#16233A', width: 82 }}>Cancellation</span>
            <span style={{ flex: 1, fontSize: 13, color: '#48515D', lineHeight: 1.4 }}>{t.cancellation}</span>
          </div>
        </div>

        {/* scroll cue */}
        <div ref={cueRef} style={{ background: '#F4F6F8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: '#A6AEB8', fontSize: 11, padding: '12px 0 14px' }}>
          <span style={{ fontWeight: 600 }}>Scroll for full profile</span>
          <svg className="dc-bob" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* DETAILS (below the fold) */}
        <div style={{ background: '#F4F6F8', padding: '22px 16px 0', display: 'flex', flexDirection: 'column', gap: 30 }}>
          {/* ABOUT */}
          <div>
            <SectionHead>About</SectionHead>
            <div style={{ height: 1, background: '#E4E8EC', margin: '12px 0 14px' }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#3C4651' }}>{aboutText}</p>
            {bio.length > 160 && (
              <button onClick={onToggleAbout} style={{ background: 'none', border: 'none', color: '#2C6FE0', fontWeight: 600, fontSize: 14, padding: '7px 0 0', cursor: 'pointer' }}>
                {aboutOpen ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>

          {/* WHY STUDENTS PICK ME */}
          <div>
            <SectionHead>Why students pick me</SectionHead>
            <div style={{ height: 1, background: '#E4E8EC', margin: '12px 0 14px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {t.whyStudentsPick.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: '#3C4651', lineHeight: 1.45 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT_DARK} strokeWidth="2.2" style={{ flex: '0 0 auto', marginTop: 1 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {w}
                </div>
              ))}
            </div>
          </div>

          {/* LESSON TYPES & PRICING */}
          <div>
            <SectionHead>Lesson types</SectionHead>
            <div style={{ height: 1, background: '#E4E8EC', margin: '12px 0 14px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {t.prices.map((pr, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', border: '1px solid #E7EAEE', borderRadius: 12, padding: '12px 14px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#16233A' }}>{pr.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#1E7FE0' }}>{pr.amount} $ <span style={{ color: '#8A93A0', fontWeight: 600 }}>/hr</span></span>
                </div>
              ))}
            </div>
          </div>

          {/* REVIEWS */}
          <div style={{ paddingBottom: 8 }}>
            <SectionHead>Reviews</SectionHead>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 0' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#16233A' }}>{Number(t.rating).toFixed(1)}</span>
              <Stars rating={t.rating} size={16} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#3C4651' }}>({t.reviewCount} Students)</span>
            </div>
            <div style={{ height: 1, background: '#E4E8EC', margin: '14px 0 16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {t.reviews.map((rv, i) => (
                <div key={i} style={{ display: 'flex', gap: 13 }}>
                  <div style={{ flex: '0 0 auto', width: 42, height: 42, borderRadius: '50%', background: '#DDE1E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A6AEB8' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="9" r="4" /><path d="M4 21a8 8 0 0 1 16 0z" /></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#16233A' }}>{rv.author}</div>
                    <div style={{ margin: '3px 0 6px' }}><Stars rating={rv.rating} size={13} /></div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#5B6675' }}>{rv.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECOND BOOK CTA */}
          <div style={{ paddingBottom: 24 }}>
            <button onClick={onBook}
              style={{ width: '100%', height: 50, border: 'none', borderRadius: 14, background: ACCENT, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 20px rgba(55,179,74,.28)' }}>
              Book {t.first}
            </button>
          </div>
        </div>
      </div>

      {/* Layer 2: feedback overlay (does not scroll) */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden', borderRadius: 20 }}>
        <div ref={washRef} style={{ position: 'absolute', inset: 0, opacity: 0, background: ACCENT }} />
        <div ref={bookRef} style={{ position: 'absolute', top: 26, left: 22, opacity: 0, border: `3.5px solid ${ACCENT_DARK}`, color: ACCENT_DARK, fontWeight: 800, fontSize: 27, letterSpacing: 3, padding: '3px 13px', borderRadius: 10, transform: 'rotate(-15deg)', background: 'rgba(255,255,255,.55)' }}>BOOK</div>
        <div ref={passRef} style={{ position: 'absolute', top: 26, right: 22, opacity: 0, border: '3.5px solid #E5484D', color: '#E5484D', fontWeight: 800, fontSize: 27, letterSpacing: 3, padding: '3px 13px', borderRadius: 10, transform: 'rotate(15deg)', background: 'rgba(255,255,255,.55)' }}>PASS</div>
      </div>
    </div>
  );
}

// ---- booking sheet ----------------------------------------------------------

function BookingSheet({ teacher, bk, setBk, onClose, onConfirm }) {
  const valid = bk.day != null && bk.time != null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,32,.45)' }} className="dc-fade" />
      <div className="dc-slideup" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '90%', background: '#fff', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -12px 44px rgba(0,0,0,.18)' }}>
        <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', paddingTop: 9 }}>
          <div style={{ width: 38, height: 4, borderRadius: 3, background: '#DDE1E6' }} />
        </div>
        <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 18px 12px' }}>
          <Avatar t={teacher} size={38} font={13} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Book {teacher.first}</div>
            <div style={{ fontSize: 12, color: '#8A93A0' }}>{teacher.subject} · ★ {Number(teacher.rating).toFixed(1)}</div>
          </div>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 32, height: 32, border: 'none', background: '#F2F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48515D', cursor: 'pointer' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>

        <div style={{ flex: '0 0 auto', padding: '0 18px 10px', fontSize: 12, color: '#5B6675' }}>
          Your Time Zone <b style={{ color: '#16202C' }}>15:00 (GMT+2)</b> · pick a slot below
        </div>

        {/* day chips */}
        <div style={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, padding: '0 16px 8px', borderBottom: '1px solid #F1F3F5' }}>
          {BOOKING_DAYS.map((d, di) => {
            const active = bk.day === d.dow;
            return (
              <div key={di} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#97A0AB' }}>{d.dow}</span>
                <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, background: active ? ACCENT : 'transparent', color: active ? '#fff' : '#3C4651' }}>{d.date}</span>
              </div>
            );
          })}
        </div>

        {/* slot grid */}
        <div className="dc-noscrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {BOOKING_DAYS.map((d, di) =>
              BOOKING_TIMES.map((time, ti) => {
                const avail = isSlotAvailable(teacher.seed, di, ti);
                const selected = bk.day === d.dow && bk.time === time;
                return (
                  <button
                    key={`${di}-${ti}`}
                    disabled={!avail}
                    onClick={() => setBk((b) => ({ ...b, day: d.dow, time }))}
                    style={{
                      border: `1px solid ${selected ? ACCENT : '#EEF0F3'}`,
                      borderRadius: 8, padding: '8px 0', fontSize: 11.5,
                      background: selected ? ACCENT : avail ? '#fff' : '#F4F6F8',
                      color: selected ? '#fff' : avail ? '#27313C' : '#C2C8D0',
                      fontWeight: selected ? 700 : 500,
                      cursor: avail ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {time}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* confirm */}
        <div style={{ flex: '0 0 auto', padding: '12px 16px calc(14px + env(safe-area-inset-bottom))', borderTop: '1px solid #ECEEF1' }}>
          <button onClick={onConfirm} disabled={!valid}
            style={{ width: '100%', height: 48, border: 'none', borderRadius: 13, background: valid ? ACCENT : '#C7E7CE', color: '#fff', fontWeight: 800, fontSize: 14.5, cursor: valid ? 'pointer' : 'not-allowed' }}>
            {valid ? `Confirm ${bk.day} ${bk.time}` : 'Pick a slot to confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- message sheet ----------------------------------------------------------

function MessageSheet({ teacher, onClose, onSend }) {
  const [text, setText] = useState('');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,32,.45)' }} className="dc-fade" />
      <div className="dc-slideup" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', boxShadow: '0 -12px 44px rgba(0,0,0,.18)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 9 }}>
          <div style={{ width: 38, height: 4, borderRadius: 3, background: '#DDE1E6' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px 10px' }}>
          <Avatar t={teacher} size={38} font={13} />
          <div style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>Message {teacher.first}</div>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 32, height: 32, border: 'none', background: '#F2F4F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#48515D', cursor: 'pointer' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
          </button>
        </div>
        <div style={{ padding: '0 16px' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Ask ${teacher.first} a question…`}
            rows={3}
            style={{ width: '100%', resize: 'none', border: '1px solid #E7EAEE', borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'inherit', color: '#16233A', outline: 'none' }}
          />
          <button onClick={() => onSend(text)} disabled={!text.trim()}
            style={{ width: '100%', marginTop: 10, height: 46, border: 'none', borderRadius: 12, background: text.trim() ? ACCENT : '#C7E7CE', color: '#fff', fontWeight: 800, fontSize: 14, cursor: text.trim() ? 'pointer' : 'not-allowed' }}>
            Send message
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- empty state ------------------------------------------------------------

function EmptyState({ onReset }) {
  return (
    <div style={{ position: 'absolute', inset: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 14, padding: 30, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E7F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>That&apos;s everyone for now</div>
      <div style={{ fontSize: 13.5, color: '#6B7480', maxWidth: 240, lineHeight: 1.5 }}>Widen your filters or revisit the teachers you saved.</div>
      <button onClick={onReset}
        style={{ height: 44, padding: '0 18px', border: `1px solid ${ACCENT}`, background: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 14, color: ACCENT, cursor: 'pointer' }}>
        Start over
      </button>
    </div>
  );
}

// ---- footer button ----------------------------------------------------------

function RoundBtn({ onClick, label, dim, children }) {
  return (
    <button onClick={onClick} aria-label={label}
      style={{ flex: '0 0 auto', width: 50, height: 50, borderRadius: '50%', border: '1px solid #E4E8EC', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B6675', opacity: dim, cursor: 'pointer' }}>
      {children}
    </button>
  );
}

// =============================================================================
// Main component
// =============================================================================

export default function TeacherDiscovery({ teachers = [] }) {
  const all = useMemo(() => teachers.map(mapTeacherToDiscovery), [teachers]);

  const [deck, setDeck] = useState(all);
  const [history, setHistory] = useState([]); // {type:'pass'|'book'|'save', teacher}
  const [booked, setBooked] = useState(0);
  const [savedIds, setSavedIds] = useState([]);
  const [sheet, setSheet] = useState(null); // 'booking' | 'message' | null
  const [bookingTeacher, setBookingTeacher] = useState(null);
  const [bk, setBk] = useState({ lessonType: 'Trial Lesson', day: null, time: null });
  const [toast, setToast] = useState(null);
  const [toastUndo, setToastUndo] = useState(false);
  const [coach, setCoach] = useState(true);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  // keep the deck in sync if the upstream teacher list arrives/changes
  useEffect(() => { setDeck(all); setHistory([]); setBooked(0); }, [all]);

  const cardRef = useRef(null);
  const scrollRef = useRef(null);
  const miniRef = useRef(null);
  const cueRef = useRef(null);
  const washRef = useRef(null);
  const bookRef = useRef(null);
  const passRef = useRef(null);
  const dragRef = useRef(null);
  const animatingRef = useRef(false);
  const toastTimer = useRef(null);

  const top = deck[0] || null;
  const total = all.length;
  const seen = total - deck.length;
  const saved = top ? savedIds.includes(top.id) : false;

  // reset per-card UI + scroll when the top teacher changes
  useEffect(() => {
    setSpecsOpen(false);
    setAboutOpen(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (miniRef.current) miniRef.current.style.opacity = 0;
    if (cueRef.current) cueRef.current.style.opacity = 1;
  }, [top?.id]);

  // ---- imperative drag (refs only, no re-render) ----
  const cardWidth = () => (cardRef.current ? cardRef.current.offsetWidth : 340);

  const clearStamps = useCallback(() => {
    if (bookRef.current) bookRef.current.style.opacity = 0;
    if (passRef.current) passRef.current.style.opacity = 0;
    if (washRef.current) washRef.current.style.opacity = 0;
  }, []);

  const applyDrag = useCallback((dx) => {
    const w = cardWidth();
    const reduce = prefersReducedMotion();
    const rot = reduce ? 0 : Math.max(-15, Math.min(15, (dx / w) * 15));
    const el = cardRef.current;
    if (el) { el.style.transition = 'none'; el.style.transform = `translateX(${dx}px) rotate(${rot}deg)`; }
    const p = Math.max(-1, Math.min(1, dx / (w * 0.5)));
    if (bookRef.current) bookRef.current.style.opacity = Math.max(0, p);
    if (passRef.current) passRef.current.style.opacity = Math.max(0, -p);
    if (washRef.current) {
      washRef.current.style.background = p > 0 ? ACCENT : '#E5484D';
      washRef.current.style.opacity = Math.min(0.16, Math.abs(p) * 0.16);
    }
  }, []);

  const springBack = useCallback((cb) => {
    const el = cardRef.current;
    const reduce = prefersReducedMotion();
    if (el) {
      el.style.transition = reduce ? 'none' : 'transform .26s cubic-bezier(.2,.8,.25,1)';
      el.style.transform = 'translateX(0) rotate(0deg)';
    }
    clearStamps();
    setTimeout(() => { if (cardRef.current) cardRef.current.style.transition = ''; if (cb) cb(); }, reduce ? 0 : 210);
  }, [clearStamps]);

  const flyOff = useCallback((dir, after) => {
    const el = cardRef.current; const w = cardWidth();
    const reduce = prefersReducedMotion();
    animatingRef.current = true;
    if (navigator.vibrate) navigator.vibrate(12);
    if (el) {
      const sign = dir === 'pass' ? -1 : 1;
      if (reduce) {
        el.style.transition = 'opacity .2s ease';
        el.style.opacity = '0';
      } else {
        el.style.transition = 'transform .34s ease, opacity .34s ease';
        el.style.transform = `translateX(${sign * (w * 1.3 + 130)}px) rotate(${sign * 18}deg)`;
        el.style.opacity = '0';
      }
    }
    clearStamps();
    setTimeout(() => { animatingRef.current = false; if (after) after(); }, reduce ? 200 : 345);
  }, [clearStamps]);

  // ---- actions ----
  const showToast = useCallback((msg, withUndo) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg); setToastUndo(!!withUndo);
    toastTimer.current = setTimeout(() => { setToast(null); setToastUndo(false); }, 3200);
  }, []);

  const dismissCoach = useCallback(() => setCoach((c) => (c ? false : c)), []);

  const commitPass = useCallback(() => {
    if (animatingRef.current || !top) return;
    dismissCoach();
    const t = top;
    flyOff('pass', () => {
      setDeck((d) => d.slice(1));
      setHistory((h) => [...h, { type: 'pass', teacher: t }]);
      showToast(`Passed ${t.name}`, true);
    });
  }, [top, flyOff, showToast, dismissCoach]);

  const openBooking = useCallback(() => {
    if (!top) return;
    setBookingTeacher(top);
    setBk({ lessonType: 'Trial Lesson', day: null, time: null });
    setSheet('booking');
  }, [top]);

  const doBook = useCallback(() => {
    if (animatingRef.current) return;
    dismissCoach();
    if (sheet === 'booking') { setSheet(null); return; }
    if (sheet) setSheet(null);
    if (top) openBooking();
  }, [sheet, top, openBooking, dismissCoach]);

  const confirmBooking = useCallback(() => {
    if (bk.day == null || bk.time == null) return;
    const t = bookingTeacher || top;
    setSheet(null);
    flyOff('book', () => {
      setDeck((d) => d.slice(1));
      setBooked((b) => b + 1);
      setHistory((h) => [...h, { type: 'book', teacher: t }]);
      showToast(`Booked ${t.name} · ${bk.day} ${bk.time}`, false);
    });
  }, [bk, bookingTeacher, top, flyOff, showToast]);

  const toggleSave = useCallback(() => {
    if (!top) return;
    const t = top;
    const has = savedIds.includes(t.id);
    setSavedIds((s) => (has ? s.filter((x) => x !== t.id) : [...s, t.id]));
    setHistory((h) => [...h, { type: 'save', teacher: t }]);
    showToast(has ? 'Removed from saved' : `Saved ${t.name}`, false);
  }, [top, savedIds, showToast]);

  const undo = useCallback(() => {
    if (animatingRef.current || history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    if (last.type === 'pass') setDeck((d) => [last.teacher, ...d]);
    else if (last.type === 'book') { setDeck((d) => [last.teacher, ...d]); setBooked((b) => Math.max(0, b - 1)); }
    else if (last.type === 'save') {
      setSavedIds((s) => (s.includes(last.teacher.id) ? s.filter((x) => x !== last.teacher.id) : [...s, last.teacher.id]));
    }
    setToast(null); setToastUndo(false);
  }, [history]);

  const resetDeck = useCallback(() => {
    setDeck(all); setHistory([]); setBooked(0); setSavedIds([]); setSheet(null);
  }, [all]);

  const sendMessage = useCallback(() => {
    setSheet(null);
    showToast(`Message sent to ${top ? top.first : ''}`, false);
  }, [top, showToast]);

  // ---- pointer handlers ----
  const onPointerDown = useCallback((e) => {
    if (animatingRef.current || sheet || coach) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastT: performance.now(), lock: null, dx: 0, dy: 0, vx: 0 };
  }, [sheet, coach]);

  const onPointerMove = useCallback((e) => {
    const d = dragRef.current; if (!d) return;
    d.dx = e.clientX - d.startX; d.dy = e.clientY - d.startY;
    const now = performance.now(); const dt = now - d.lastT;
    if (dt > 0) d.vx = (e.clientX - d.lastX) / dt;
    d.lastX = e.clientX; d.lastT = now;
    if (!d.lock) {
      if (isHorizontalSwipe(d.dx, d.dy)) {
        d.lock = 'swipe';
        try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      } else if (Math.abs(d.dy) > 10 && Math.abs(d.dy) > Math.abs(d.dx)) {
        d.lock = 'scroll';
      }
    }
    if (d.lock === 'swipe') { if (e.cancelable) e.preventDefault(); applyDrag(d.dx); }
  }, [applyDrag]);

  const onPointerUp = useCallback(() => {
    const d = dragRef.current; dragRef.current = null;
    if (!d || d.lock !== 'swipe') return;
    const decision = decideSwipe(d.dx, d.vx, cardWidth());
    if (decision === 'pass') commitPass();
    else if (decision === 'book') springBack(() => openBooking());
    else springBack();
  }, [commitPass, springBack, openBooking]);

  const onScroll = useCallback((e) => {
    const st = e.target.scrollTop;
    if (miniRef.current) miniRef.current.style.opacity = Math.max(0, Math.min(1, (st - 40) / 90));
    if (cueRef.current) cueRef.current.style.opacity = Math.max(0, 1 - st / 55);
  }, []);

  const scrollByPx = (px) => { if (scrollRef.current) scrollRef.current.scrollBy({ top: px, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }); };

  // ---- keyboard parity ----
  useEffect(() => {
    const onKey = (e) => {
      if (sheet) { if (e.key === 'Escape') setSheet(null); return; }
      if (coach && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Enter')) dismissCoach();
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); commitPass(); break;
        case 'ArrowRight': case 'Enter': e.preventDefault(); doBook(); break;
        case 'ArrowDown': case 'PageDown': e.preventDefault(); scrollByPx(220); break;
        case 'ArrowUp': case 'PageUp': e.preventDefault(); scrollByPx(-220); break;
        case 's': case 'S': toggleSave(); break;
        case 'Backspace': e.preventDefault(); undo(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet, coach, commitPass, doBook, toggleSave, undo, dismissCoach]);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const progress = total > 0 ? `${Math.min(seen + 1, total)} of ${total}` : '0 of 0';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60, height: '100dvh', width: '100%',
        display: 'flex', flexDirection: 'column', background: '#fff', color: '#16202C',
        overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        overscrollBehavior: 'none',
      }}
    >
      <style>{`
        .dc-noscrollbar::-webkit-scrollbar{display:none;}
        .dc-noscrollbar{scrollbar-width:none;-ms-overflow-style:none;}
        @keyframes dcBob{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
        @keyframes dcSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes dcFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes dcToastIn{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
        .dc-bob{animation:dcBob 1.5s ease-in-out infinite;}
        .dc-slideup{animation:dcSlideUp .3s cubic-bezier(.2,.8,.25,1);}
        .dc-fade{animation:dcFadeIn .2s ease;}
        @media (prefers-reduced-motion: reduce){
          .dc-bob,.dc-slideup,.dc-fade{animation:none!important;}
        }
      `}</style>

      {/* a11y live region */}
      <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {top ? `Now viewing ${top.name}, ${top.subject}` : 'No more teachers'}
      </div>

      {/* HEADER */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', borderBottom: '1px solid #ECEEF1', background: '#fff', zIndex: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke={ACCENT} strokeWidth="1.6" /><polygon points="12 4 13.7 10.3 20 12 13.7 13.7 12 20 10.3 13.7 4 12 10.3 10.3" fill={ACCENT} /></svg>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.4px', color: '#1B2733' }}>BREADY</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: '#F2F4F6', borderRadius: 22, padding: '8px 12px', color: '#9AA3AE', minWidth: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA3AE" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Search teachers</span>
        </div>
        <button aria-label="Menu" style={{ flex: '0 0 auto', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', borderRadius: 10, color: '#48515D', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
        </button>
      </div>

      {/* PROGRESS STRIP */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 16px', background: '#FAFBFC', borderBottom: '1px solid #F1F3F5', fontSize: 11.5, color: '#6B7480' }}>
        <span style={{ fontWeight: 600 }}>{progress}</span>
        <div style={{ display: 'flex', gap: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={ACCENT}><path d="M6 3h12v18l-6-4-6 4z" /></svg>{savedIds.length} saved
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6B7480" strokeWidth="2"><rect x="3" y="4.5" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>{booked} booked
          </span>
        </div>
      </div>

      {/* ARENA */}
      <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 0, overflow: 'hidden', background: '#EEF0F3' }}>
        {/* peek cards */}
        {deck.length > 2 && <div style={{ position: 'absolute', inset: 14, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, boxShadow: '0 4px 14px rgba(20,30,45,.05)', transform: 'scale(.9)', zIndex: 1 }} />}
        {deck.length > 1 && <div style={{ position: 'absolute', inset: 14, background: '#fff', border: '1px solid #E7EAEE', borderRadius: 20, boxShadow: '0 6px 18px rgba(20,30,45,.06)', transform: 'scale(.95)', zIndex: 2 }} />}

        {top ? (
          <SwipeCard
            key={top.id}
            t={top}
            cardRef={cardRef} scrollRef={scrollRef} miniRef={miniRef} cueRef={cueRef}
            washRef={washRef} bookRef={bookRef} passRef={passRef}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onScroll={onScroll}
            saved={saved} onToggleSave={toggleSave} onBook={doBook}
            specsOpen={specsOpen} onToggleSpecs={() => setSpecsOpen((v) => !v)}
            aboutOpen={aboutOpen} onToggleAbout={() => setAboutOpen((v) => !v)}
          />
        ) : (
          <EmptyState onReset={resetDeck} />
        )}

        {/* COACHMARK */}
        {coach && top && (
          <button
            onClick={dismissCoach}
            className="dc-fade"
            style={{ position: 'absolute', inset: 0, zIndex: 20, border: 'none', background: 'rgba(15,23,32,.55)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, cursor: 'pointer', padding: 30 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E5484D" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Swipe left to pass</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Swipe right to book</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <svg className="dc-bob" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Scroll down to read more</span>
            </div>
            <span style={{ fontSize: 12, opacity: 0.8, marginTop: 10 }}>Tap anywhere to start</span>
          </button>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '11px 20px calc(11px + env(safe-area-inset-bottom))', borderTop: '1px solid #ECEEF1', background: '#fff', zIndex: 6 }}>
        <RoundBtn onClick={undo} label="Undo" dim={history.length ? 1 : 0.4}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" /></svg>
        </RoundBtn>
        <button onClick={doBook} disabled={!top}
          style={{ flex: '0 0 auto', height: 50, padding: '0 22px', borderRadius: 26, border: `1.6px solid ${ACCENT}`, background: '#fff', color: ACCENT, fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: top ? 1 : 0.4, cursor: top ? 'pointer' : 'default' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="17" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="8" y1="2.5" x2="8" y2="6.5" /><line x1="16" y1="2.5" x2="16" y2="6.5" /></svg>
          Book
        </button>
        <RoundBtn onClick={() => { if (!sheet) commitPass(); }} label="Pass" dim={top ? 1 : 0.4}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#48515D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>
        </RoundBtn>
        <RoundBtn onClick={() => { if (top) setSheet(sheet === 'message' ? null : 'message'); }} label="Message" dim={top ? 1 : 0.4}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><polyline points="3 6 12 13 21 6" /></svg>
        </RoundBtn>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'absolute', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: 48, display: 'flex', alignItems: 'center', gap: 14, background: '#1B2530', color: '#fff', padding: '11px 16px', borderRadius: 13, fontSize: 13, boxShadow: '0 10px 28px rgba(0,0,0,.28)', animation: 'dcToastIn .25s ease both', whiteSpace: 'nowrap', maxWidth: '92%' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{toast}</span>
          {toastUndo && <button onClick={undo} style={{ color: '#5FD487', fontWeight: 700, background: 'none', border: 'none', padding: 0, fontSize: 13, cursor: 'pointer' }}>Undo</button>}
        </div>
      )}

      {/* SHEETS */}
      {sheet === 'booking' && bookingTeacher && (
        <BookingSheet teacher={bookingTeacher} bk={bk} setBk={setBk} onClose={() => setSheet(null)} onConfirm={confirmBooking} />
      )}
      {sheet === 'message' && top && (
        <MessageSheet teacher={top} onClose={() => setSheet(null)} onSend={sendMessage} />
      )}
    </div>
  );
}
