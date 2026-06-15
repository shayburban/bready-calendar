// T1 — architecture lint rule (spec §10.3 / R24 / §1.2).
//
// Within the scheduling module, ALL time arithmetic must route through TimeKit.
// This rule fails the build on:
//   - `Date.now()`            → use TimeKit.now()
//   - `new Date(...)`         → use TimeKit (instants are epoch-millis numbers)
//   - `addCalendar(...)` with fewer than 4 args → missing the REQUIRED anchorTz
//
// Scope (wired in eslint.config.js): src/lib/scheduling/** EXCEPT timekit.js
// (the sanctioned substrate) and __tests__/** (fixtures legitimately build raw
// instants). Legacy code outside the scheduling module is intentionally NOT
// touched (Constraint 2).

const plugin = {
  meta: { name: 'scheduling-timekit', version: '1.0.0' },
  rules: {
    'no-raw-time': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Forbid raw time math in the scheduling module; route through TimeKit (§1.2/R24).',
        },
        schema: [],
        messages: {
          dateNow: 'Use TimeKit.now() instead of Date.now() (§1.2/R24).',
          newDate:
            'Do not use `new Date(...)` in scheduling code — use TimeKit (instants are epoch-millis) (§1.2/R24).',
          missingAnchorTz:
            'addCalendar(instant, n, unit, anchorTz) requires an explicit anchorTz — omitting it is a build error (§1.2).',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            const c = node.callee;
            // Date.now()
            if (
              c.type === 'MemberExpression' &&
              c.object.type === 'Identifier' &&
              c.object.name === 'Date' &&
              c.property.type === 'Identifier' &&
              c.property.name === 'now'
            ) {
              context.report({ node, messageId: 'dateNow' });
            }
            // addCalendar(...) missing the 4th arg (anchorTz)
            const isAddCalendar =
              (c.type === 'Identifier' && c.name === 'addCalendar') ||
              (c.type === 'MemberExpression' &&
                c.property.type === 'Identifier' &&
                c.property.name === 'addCalendar');
            if (isAddCalendar && node.arguments.length < 4) {
              context.report({ node, messageId: 'missingAnchorTz' });
            }
          },
          NewExpression(node) {
            if (node.callee.type === 'Identifier' && node.callee.name === 'Date') {
              context.report({ node, messageId: 'newDate' });
            }
          },
        };
      },
    },
  },
};

export default plugin;
