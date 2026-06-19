import { describe, it, expect } from 'vitest';
import { parseSearchQuery, trigramSimilarity } from '../queryParser';

// All cases use the built-in DEFAULT_CATALOG (no catalog passed).

describe('parseSearchQuery — acceptance cases', () => {
  it('"organic chem under 50" → Organic Chemistry + Chemistry; hard maxPrice 50', () => {
    const p = parseSearchQuery('organic chem under 50');
    expect(p.specializations).toContain('Organic Chemistry');
    expect(p.subjects).toContain('Chemistry');
    expect(p.price.cap).toBe(50);
    expect(p.price.soft).toBe(false);
  });

  it('"AP calc tutor online" → Calculus; level AP; modality online', () => {
    const p = parseSearchQuery('AP calc tutor online');
    expect(p.specializations).toContain('Calculus');
    expect(p.courseLevels).toContain('AP');
    expect(p.modality).toContain('online');
  });

  it('"cs teacher english" → Computer Science; language English (not subject)', () => {
    const p = parseSearchQuery('cs teacher english');
    expect(p.subjects).toContain('Computer Science');
    expect(p.languages).toContain('English');
    expect(p.subjects).not.toContain('English');
  });

  it('"cheap biology tutor near me" → Biology; soft/relaxable budget; in-person/local', () => {
    const p = parseSearchQuery('cheap biology tutor near me');
    expect(p.subjects).toContain('Biology');
    expect(p.price.soft).toBe(true);
    expect(p.price.cheap).toBe(true);
    expect(p.modality).toContain('in-person');
    expect(p.local).toBe(true);
  });

  it('"ielts prep evenings" → exam IELTS; availability evenings; term kept for FTS', () => {
    const p = parseSearchQuery('ielts prep evenings');
    expect(p.exams).toContain('IELTS');
    expect(p.availabilityTimes).toContain('evening');
    expect(p.residualText).toContain('ielts');
  });

  it('"chemsitry tutor" (typo) → Chemistry via trigram, lower confidence', () => {
    const p = parseSearchQuery('chemsitry tutor');
    expect(p.subjects).toContain('Chemistry');
    expect(p.confidence).toBeLessThan(1);
  });
});

describe('residual hygiene — no pollution reaches FTS', () => {
  it('price/filler words are stripped from residualText', () => {
    const p = parseSearchQuery('organic chem under 50');
    expect(p.residualText).not.toMatch(/under/);
    expect(p.residualText).not.toMatch(/50/);
    expect(p.residualText).not.toMatch(/tutor/);
  });

  it('range and "around" pricing parse correctly', () => {
    expect(parseSearchQuery('math between 20 and 40').price).toMatchObject({ min: 20, cap: 40 });
    expect(parseSearchQuery('physics around 30').price).toMatchObject({ cap: 30, soft: true });
    expect(parseSearchQuery('chemistry $45').price.cap).toBe(45);
  });
});

describe('disambiguation', () => {
  it('keeps multiple candidates for an ambiguous alias ("geo")', () => {
    const p = parseSearchQuery('geo tutor');
    expect(p.ambiguous.length).toBeGreaterThan(0);
    expect(p.suggestions).toEqual(expect.arrayContaining(['Geometry', 'Geography']));
  });

  it('exact catalog match beats fuzzy (Chemistry stays Chemistry)', () => {
    const p = parseSearchQuery('chemistry');
    expect(p.subjects).toContain('Chemistry');
    expect(p.confidence).toBe(1);
  });
});

describe('trigramSimilarity', () => {
  it('typo is close to the correct term', () => {
    expect(trigramSimilarity('chemsitry', 'chemistry')).toBeGreaterThan(0.45);
  });
  it('unrelated terms are far apart', () => {
    expect(trigramSimilarity('chemistry', 'biology')).toBeLessThan(0.3);
  });
});
