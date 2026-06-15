import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import plugin from '../../../../eslint-rules/no-raw-time.js';

const rule = plugin.rules['no-raw-time'];

// RuleTester throws on any failed case, so a single it() that runs it is enough.
describe('T1 — no-raw-time architecture rule (§10.3/R24)', () => {
  it('flags raw time math and accepts TimeKit usage', () => {
    const ruleTester = new RuleTester({
      languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    });

    ruleTester.run('no-raw-time', rule, {
      valid: [
        { code: 'const t = now();' },
        { code: 'const t2 = addExact(t, 120, "minute");' },
        { code: 'const w = addCalendar(t, 3, "month", teacherTz);' },
        { code: 'const d = DateTime.fromMillis(t, { zone });' },
        { code: 'const x = Date.UTC(2026, 0, 1);' }, // Date.UTC is allowed (pure epoch helper)
      ],
      invalid: [
        { code: 'const t = Date.now();', errors: [{ messageId: 'dateNow' }] },
        { code: 'const d = new Date("2026-06-15T10:00");', errors: [{ messageId: 'newDate' }] },
        { code: 'const d = new Date();', errors: [{ messageId: 'newDate' }] },
        {
          code: 'const w = addCalendar(t, 3, "month");',
          errors: [{ messageId: 'missingAnchorTz' }],
        },
      ],
    });
  });
});
