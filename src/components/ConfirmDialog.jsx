import { useState, useCallback, useRef } from 'react';

// A drop-in, promise-based replacement for window.confirm() that matches the
// app's own look instead of the browser's native "yoursite.com says" dialog.
//
// Usage inside any component:
//   const [confirm, ConfirmDialog] = useConfirm();
//   ...
//   const ok = await confirm('Delete this chat? This cannot be undone.');
//   if (!ok) return;
//   ...
//   return ( <> ... {ConfirmDialog} </> );
export function useConfirm() {
  const [state, setState] = useState(null); // { message, danger }
  const resolver = useRef(null);

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({ message, danger: opts.danger !== false });
    });
  }, []);

  const handle = (result) => {
    setState(null);
    if (resolver.current) { resolver.current(result); resolver.current = null; }
  };

  const ConfirmDialog = state ? (
    <div onClick={() => handle(false)} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 14px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, background: 'var(--paper)', borderRadius: 20, padding: '22px 20px', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink)', marginBottom: 20 }}>{state.message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => handle(false)} className="btn ghost" style={{ flex: 1, marginTop: 0 }}>Cancel</button>
          <button onClick={() => handle(true)} className="btn" style={{ flex: 1, marginTop: 0, background: state.danger ? 'var(--rust)' : undefined }}>OK</button>
        </div>
      </div>
    </div>
  ) : null;

  return [confirm, ConfirmDialog];
}

