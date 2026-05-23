import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { bootstrapTokens, reconcileTokensFromBackend } from '@/lib/ve/bootstrap'

// Live Visual Editor (Phase 1) — inject warm-cached global design tokens BEFORE
// first paint to minimize FOUC, then reconcile with the backend after mount.
// Both calls are internally guarded, so a failure here can never block render (I5).
bootstrapTokens()

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
)

reconcileTokensFromBackend()
