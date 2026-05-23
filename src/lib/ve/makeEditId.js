// Live Visual Editor — Phase 2 stable element identity.
//
// data-edit-id is a strict 3-part `page:component-type:item-id`. Empty segments
// are rejected; a literal ":" inside any segment is encoded so it can't split
// the id. Use stable ids (never array indices) for list items.

function encodeSegment(seg) {
  return String(seg == null ? '' : seg).trim().replace(/:/g, '%3A');
}

export function makeEditId(page, type, id) {
  const p = encodeSegment(page);
  const t = encodeSegment(type);
  const i = encodeSegment(id);
  if (!p || !t || !i) {
    throw new Error(`makeEditId requires non-empty page/type/id (got "${page}" / "${type}" / "${id}")`);
  }
  return `${p}:${t}:${i}`;
}

export function parseEditId(editId) {
  const [page, type, id] = String(editId || '').split(':');
  return { page, type, id };
}
