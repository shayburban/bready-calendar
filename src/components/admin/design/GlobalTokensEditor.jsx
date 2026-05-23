import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Check, AlertTriangle, Palette, RefreshCw } from 'lucide-react';
import { TOKEN_REGISTRY, TOKEN_KINDS } from '@/lib/ve/tokenRegistry';
import { hexToHslTriplet, hslTripletToHex } from '@/lib/ve/colorUtils';
import { applyGlobalTokens, writeWarmCache, readWarmCache } from '@/lib/ve/tokenStyleManager';
import { loadActiveConfig, saveConfig } from '@/lib/ve/config';

// Live Visual Editor — Phase 1 admin surface.
//
// Edits the GLOBAL design tokens that drive the live site. Changes apply live as
// you edit (instant preview across the whole running app); they only persist on
// Save. "Reset to Last Saved" reverts to the persisted config.

const stable = (obj) => JSON.stringify(obj || {});

export default function GlobalTokensEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadedConfig, setLoadedConfig] = useState(null);
  const [loadedRevision, setLoadedRevision] = useState(0);
  const [tokens, setTokens] = useState({});       // editable --ve-* map
  const [savedTokens, setSavedTokens] = useState({}); // last persisted snapshot
  const [diagnostics, setDiagnostics] = useState([]);
  const [status, setStatus] = useState(null);      // { type:'success'|'error'|'info', msg }
  const didInit = useRef(false);

  // Load the authoritative config once.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { row, config } = await loadActiveConfig();
      if (!alive) return;
      // Mirror the bootstrap rule: when the backend holds no persisted config
      // (mock era), fall back to the warm cache so the form matches the live site.
      const backendHasConfig = !!(row && row.config && typeof row.config === 'object');
      const warm = readWarmCache();
      const effective = backendHasConfig
        ? config.globalTokens
        : (warm && Object.keys(warm).length ? warm : config.globalTokens);
      setLoadedConfig(config);
      setLoadedRevision(config.revision);
      setTokens({ ...effective });
      setSavedTokens({ ...effective });
      setLoading(false);
      didInit.current = true;
    })();
    return () => { alive = false; };
  }, []);

  // Live-apply on every edit (compiler drops invalid values; we surface why).
  useEffect(() => {
    if (!didInit.current) return;
    const diags = applyGlobalTokens(tokens);
    setDiagnostics(diags);
  }, [tokens]);

  const dirty = useMemo(() => stable(tokens) !== stable(savedTokens), [tokens, savedTokens]);

  const setTokenValue = (ve, value) => {
    setTokens((prev) => {
      const next = { ...prev };
      if (value == null || String(value).trim() === '') delete next[ve];
      else next[ve] = String(value).trim();
      return next;
    });
    setStatus(null);
  };

  const clearToken = (ve) => setTokenValue(ve, '');

  const diagFor = (ve) => diagnostics.find((d) => d.token === ve && !d.ok);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const next = { ...(loadedConfig || {}), globalTokens: tokens };
    const res = await saveConfig(next, loadedRevision);
    if (res.ok) {
      writeWarmCache(res.config.globalTokens);
      applyGlobalTokens(res.config.globalTokens);
      setLoadedConfig(res.config);
      setLoadedRevision(res.config.revision);
      setSavedTokens({ ...res.config.globalTokens });
      setTokens({ ...res.config.globalTokens });
      setStatus({ type: 'success', msg: `Saved (revision ${res.config.revision}). The live site now uses these tokens.` });
    } else if (res.conflict) {
      setStatus({
        type: 'error',
        msg: `Another admin saved a newer version (revision ${res.currentRevision}). Reload to get the latest before editing — your changes were NOT applied.`,
      });
    } else {
      setStatus({ type: 'error', msg: 'Save failed. Your edits are kept — please try again.' });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setTokens({ ...savedTokens });
    applyGlobalTokens(savedTokens);
    setStatus({ type: 'info', msg: 'Reverted to the last saved configuration.' });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 py-12 justify-center">
        <RefreshCw className="w-4 h-4 animate-spin" /> Loading design tokens…
      </div>
    );
  }

  const groups = [...new Set(TOKEN_REGISTRY.map((r) => r.group))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" /> Live Global Tokens
                {dirty && <Badge variant="secondary">Unsaved changes</Badge>}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                These drive the real site. Edits preview instantly; click Save to persist.
                Unset tokens fall back to the current theme default.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReset} disabled={!dirty || saving}>
                <RotateCcw className="w-4 h-4 mr-2" /> Reset to Last Saved
              </Button>
              <Button onClick={handleSave} disabled={!dirty || saving}>
                {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Configuration
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {status && (
            <div
              className={`flex items-center gap-2 text-sm rounded-md px-3 py-2 ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : status.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {status.msg}
            </div>
          )}

          {groups.map((group) => (
            <div key={group}>
              <h4 className="font-medium mb-3">{group}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOKEN_REGISTRY.filter((r) => r.group === group).map((reg) => {
                  const current = tokens[reg.ve]; // undefined => using default
                  const usingDefault = current == null;
                  const effective = current ?? reg.default;
                  const diag = diagFor(reg.ve);
                  return (
                    <div key={reg.ve} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">{reg.label}</label>
                        {usingDefault ? (
                          <Badge variant="outline" className="text-xs">default</Badge>
                        ) : (
                          <button
                            type="button"
                            onClick={() => clearToken(reg.ve)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            use default
                          </button>
                        )}
                      </div>

                      {reg.kind === TOKEN_KINDS.HSL_TRIPLET ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            aria-label={`${reg.label} color`}
                            value={hslTripletToHex(effective) || '#000000'}
                            onChange={(e) => setTokenValue(reg.ve, hexToHslTriplet(e.target.value))}
                            className="w-9 h-9 rounded border shrink-0"
                          />
                          <Input
                            aria-label={`${reg.label} HSL triplet`}
                            value={effective}
                            onChange={(e) => setTokenValue(reg.ve, e.target.value)}
                            className="text-xs font-mono"
                            placeholder={reg.default}
                          />
                        </div>
                      ) : (
                        <Input
                          aria-label={reg.label}
                          value={effective}
                          onChange={(e) => setTokenValue(reg.ve, e.target.value)}
                          className="text-xs font-mono"
                          placeholder={reg.default}
                        />
                      )}

                      <div className="mt-1 text-xs font-mono text-gray-400">
                        {reg.maps} ← {reg.ve}
                      </div>
                      {diag && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" /> Rejected: {diag.reason} (using default)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
