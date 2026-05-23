// Live Visual Editor — element capabilities (Part 2.2 / Part C).
//
// `data-edit-capabilities` declares which families of controls apply to an
// element. Each family maps to the concrete CSS properties the editor may set,
// which is ALSO the property allow-list the override sanitizer enforces.
//
// Layout-affecting / dangerous properties (position, z-index, transform, …) are
// intentionally absent and are additionally hard-excluded in the sanitizer.

export const CAPABILITY_PROPERTIES = {
  text: ['color', 'font-size', 'font-weight', 'text-align', 'line-height', 'letter-spacing'],
  box: [
    'background-color', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-radius', 'border-width', 'border-color', 'border-style',
  ],
  image: ['border-radius', 'opacity', 'border-width', 'border-color', 'border-style'],
};

export function parseCapabilities(attr) {
  return String(attr || '')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Set of CSS properties allowed for a list of capability names. */
export function propertiesForCapabilities(caps) {
  const set = new Set();
  for (const cap of caps || []) {
    for (const prop of CAPABILITY_PROPERTIES[cap] || []) set.add(prop);
  }
  return set;
}
