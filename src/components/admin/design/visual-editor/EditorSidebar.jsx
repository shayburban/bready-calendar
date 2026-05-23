import { useState } from 'react';
import { MousePointer2, Layers, Monitor, Tablet, Smartphone, LogOut, Check } from 'lucide-react';

// Thin icon-only sidebar on the preview's left edge. Editor chrome (.ve-chrome):
// the surface click logic ignores it, so clicking here never selects/deselects.

function IconBtn({ title, active, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function EditorSidebar({
  mode, onToggleEdit, pages, page, onSelectPage, viewport, onSetViewport, onExit,
}) {
  const [pagesOpen, setPagesOpen] = useState(false);

  return (
    <div className="ve-chrome absolute left-0 top-0 z-[70] flex h-full w-12 flex-col items-center gap-1 border-r border-gray-200 bg-white py-3">
      <IconBtn
        title={mode === 'edit' ? 'Editing — click to browse' : 'Edit: select elements'}
        active={mode === 'edit'}
        onClick={onToggleEdit}
      >
        <MousePointer2 className="h-5 w-5" />
      </IconBtn>

      <div className="relative">
        <IconBtn title="Pages" active={pagesOpen} onClick={() => setPagesOpen((o) => !o)}>
          <Layers className="h-5 w-5" />
        </IconBtn>
        {pagesOpen && (
          <div className="ve-chrome absolute left-11 top-0 z-[80] w-52 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            {pages.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => { onSelectPage(p.value); setPagesOpen(false); }}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                  p.value === page ? 'font-medium text-blue-600' : 'text-gray-700'
                }`}
              >
                {p.label}
                {p.value === page && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="my-1 h-px w-6 bg-gray-200" />

      <IconBtn title="Desktop" active={viewport === 'desktop'} onClick={() => onSetViewport('desktop')}>
        <Monitor className="h-5 w-5" />
      </IconBtn>
      <IconBtn title="Tablet" active={viewport === 'tablet'} onClick={() => onSetViewport('tablet')}>
        <Tablet className="h-5 w-5" />
      </IconBtn>
      <IconBtn title="Mobile" active={viewport === 'mobile'} onClick={() => onSetViewport('mobile')}>
        <Smartphone className="h-5 w-5" />
      </IconBtn>

      <div className="mt-auto" />
      <IconBtn title="Exit edit mode" onClick={onExit}>
        <LogOut className="h-5 w-5" />
      </IconBtn>
    </div>
  );
}
