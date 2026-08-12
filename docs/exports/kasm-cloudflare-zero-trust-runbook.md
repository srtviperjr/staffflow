# Kasm Workspaces behind Cloudflare Zero Trust — Runbook

Portable ops notes from the Cursor Cloud session that fixed session launch after hostname change to `kasm.subsector.ca`.

**Stack:** Kasm Workspaces **1.19.0** on TrueNAS 26 · Cloudflare Tunnel · Cloudflare Access (Google) · Kasm SAML IdP = Cloudflare Access SAML · public host `https://kasm.subsector.ca` · internal `https://10.0.0.10:30128`

This document is **not** part of the staffflow / Jansen Workflows product. Copy it into whatever infra/homelab repo you use.

---

## Architecture (what sits in front of what)

1. Browser → `kasm.subsector.ca`
2. Cloudflare Tunnel (HTTPS to origin, No TLS Verify, HTTP/2 as configured)
3. Cloudflare Access app (Google allowlist + country) on the hostname
4. Kasm web / API
5. Kasm SAML login against Cloudflare Access SAML SSO URL (`*.cloudflareaccess.com/cdn-cgi/access/sso/saml/...`)

Access and Kasm SAML are **both** in play. Clearing Access does not replace Kasm’s own session cookies/token.

---

## Symptom that started this

- Google / SAML login appeared to work
- Launching a workspace failed: **Add item. Invalid Request - Invalid Request**
- Network: `POST /api/request_kasm` → **400** `{"error_message":"Invalid Request"}`
- Payload often had `token: null`, `username: null`

API logs pattern:

1. `login_saml` / `authenticate` succeeds
2. Unexpected `/api/logout`
3. `request_kasm` fails with missing username/token

---

## Root cause (the fix that mattered)

Leftover **All Users** group setting still in the DB:

| Setting | Bad value |
|---------|-----------|
| `dashboard_redirect` | `/#/userdashboard` |

UI delete had not removed it. After SAML login, the UI redirected through a path that logged the session out, so launch ran without a valid token.

### Verify

```bash
docker exec kasm_db psql -U kasmapp -d kasm -c \
  "SELECT * FROM group_settings WHERE name = 'dashboard_redirect';"
```

### Fix

```bash
docker exec kasm_db psql -U kasmapp -d kasm -c \
  "DELETE FROM group_settings WHERE name = 'dashboard_redirect' AND value = '/#/userdashboard';"
```

Re-login and launch again. Admin ↔ Workspaces switch and session persistence should return once this is gone.

---

## Zone settings (Kasm) worth confirming

After hostname change, zone proxy fields should not hardcode a stale public name:

| Field | Value used |
|-------|------------|
| Upstream Auth Address | `proxy` |
| Allow Origin | `$request_host$` |
| Proxy Hostname | `$request_host$` |
| Proxy Port | `0` |

Tunnel hostname for Kasm should point at the TrueNAS/Kasm HTTPS origin as you already had (No TLS Verify if using the internal cert).

---

## Secondary issues

### Windows: “Error, invalid authentication cookies”

Stale cookies after hostname / Access changes.

**Fix:** Clear site data/cookies for `kasm.subsector.ca`, then sign in again through Access + Kasm SAML.

### PWA manifest / Cloudflare Access challenge

Chrome requests:

`/api/basemanifest/manifest.webmanifest`

Access can challenge that path (`auth_status: NONE`) even when the main app session is fine.

**Fix:** Second Access application:

| Item | Value |
|------|--------|
| Domain / path | `kasm.subsector.ca/api/basemanifest` |
| Policy | **Bypass** (not Allow) |
| Extra rule used | Country = Canada (optional; match your threat model) |

Main Access app stays on `kasm.subsector.ca` with Allow + email allowlist (+ country if you use it). Do **not** put Bypass on the whole hostname.

### `static.cloudflareinsights.com/beacon.min.js`

Cloudflare Web Analytics / Browser Insights beacon. Harmless for Kasm auth. Ignore, or disable Web Analytics for the zone if you do not want it. Failures are usually adblock/CSP.

---

## Useful diagnostics

### Confirm launch payload after login

In browser DevTools → Network → `request_kasm`:

- Must include non-null `username` and `token` (or equivalent session fields Kasm expects)
- 400 + “Invalid Request” with nulls → session was lost before launch (logout redirect, cookies, Access gap)

### Config / DB export

Kasm admin config export + SQL on `group_settings` were what surfaced `dashboard_redirect`. Prefer SQL confirmation over trusting the UI alone for deleted group settings.

### Logs to pull

- `kasm_api` / API server logs around `login_saml`, `authenticate`, `/api/logout`, `request_kasm`
- Support bundle pieces if available

---

## Checklist (hostname move or “Invalid Request” on launch)

1. [ ] Tunnel hostname = new public name; origin HTTPS path correct
2. [ ] Kasm Zone: `$request_host$` / Upstream Auth `proxy` / Proxy Port `0`
3. [ ] SAML IdP metadata/ACS still match new public URL if Kasm or Access URLs changed
4. [ ] No leftover `dashboard_redirect` (or similar) in `group_settings`
5. [ ] Clear browser cookies for the Kasm host after cutover
6. [ ] Access Bypass only for `/api/basemanifest` if the PWA manifest is challenged
7. [ ] Ignore Cloudflare Insights beacon unless you care about analytics

---

## What is *not* in this runbook

- staffflow / Jansen Workflows app code
- Changing Cloudflare Insights (optional only)
- Full Kasm install / TrueNAS app install steps

---

## Source session

- Cursor Cloud agent: [Kasm session hostname error](https://cursor.com/agents/bc-0b7ce799-a719-4f5e-ad47-3f6261535b5b)
- Workspace repo for that agent was `srtviperjr/staffflow` (incidental — product code unrelated)
