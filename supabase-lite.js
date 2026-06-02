/*
  GamersArchives Supabase Lite Client
  Browser-native fallback for Auth + REST. This removes the need for an
  external JavaScript CDN during the beta. Realtime subscriptions degrade
  gracefully to manual refreshes until the full SDK is bundled locally.
*/
(function () {
  'use strict';

  function createClient(baseUrl, apiKey) {
    if (!baseUrl || !apiKey) return null;
    const base = String(baseUrl).replace(/\/+$/, '');
    const storageKey = 'gamersarchives.supabase.session';
    const listeners = new Set();

    function readSession() {
      try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); }
      catch { return null; }
    }
    function writeSession(session) {
      if (session) localStorage.setItem(storageKey, JSON.stringify(session));
      else localStorage.removeItem(storageKey);
    }
    function emit(event, session) {
      listeners.forEach(listener => {
        try { listener(event, session); } catch (error) { console.warn('Auth listener failed:', error); }
      });
    }
    function makeSession(payload) {
      if (!payload?.access_token) return null;
      return {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        token_type: payload.token_type || 'bearer',
        expires_in: payload.expires_in,
        expires_at: payload.expires_at || (payload.expires_in ? Math.floor(Date.now() / 1000) + Number(payload.expires_in) : null),
        user: payload.user || null,
      };
    }
    function headers({ json = true, authenticated = true, prefer } = {}) {
      const result = { apikey: apiKey };
      const session = readSession();
      if (authenticated && session?.access_token) result.Authorization = `Bearer ${session.access_token}`;
      if (json) result['Content-Type'] = 'application/json';
      if (prefer) result.Prefer = prefer;
      return result;
    }
    async function parseResponse(response) {
      const text = await response.text();
      let body = null;
      if (text) {
        try { body = JSON.parse(text); } catch { body = text; }
      }
      if (!response.ok) {
        const message = body?.msg || body?.message || body?.error_description || body?.error || (typeof body === 'string' ? body : '') || `${response.status} ${response.statusText}`;
        return { data: null, error: { message, status: response.status, details: body } };
      }
      return { data: body, error: null };
    }
    async function authRequest(path, body, options = {}) {
      try {
        const response = await fetch(`${base}${path}`, {
          method: options.method || 'POST',
          headers: headers({ authenticated: options.authenticated !== false }),
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        return await parseResponse(response);
      } catch (error) {
        return { data: null, error: { message: `Network request failed: ${error.message}` } };
      }
    }
    async function refreshSession(session) {
      if (!session?.refresh_token) return session;
      const response = await authRequest('/auth/v1/token?grant_type=refresh_token', { refresh_token: session.refresh_token }, { authenticated: false });
      if (response.error) return session;
      const next = makeSession(response.data);
      if (next) writeSession(next);
      return next || session;
    }

    class QueryBuilder {
      constructor(table) {
        this.table = table;
        this.action = 'select';
        this.payload = null;
        this.filters = [];
        this.orderValue = null;
        this.limitValue = null;
        this.singleValue = false;
        this.columns = '*';
      }
      select(columns = '*') { this.action = 'select'; this.columns = columns || '*'; return this; }
      insert(payload) { this.action = 'insert'; this.payload = payload; return this; }
      update(payload) { this.action = 'update'; this.payload = payload; return this; }
      delete() { this.action = 'delete'; return this; }
      eq(column, value) { this.filters.push([column, `eq.${value}`]); return this; }
      order(column, options = {}) { this.orderValue = `${column}.${options.ascending === false ? 'desc' : 'asc'}`; return this; }
      limit(value) { this.limitValue = Number(value); return this; }
      single() { this.singleValue = true; return this; }
      async execute() {
        const params = new URLSearchParams();
        if (this.action === 'select') params.set('select', this.columns);
        this.filters.forEach(([column, value]) => params.append(column, value));
        if (this.orderValue) params.set('order', this.orderValue);
        if (Number.isFinite(this.limitValue)) params.set('limit', String(this.limitValue));
        const url = `${base}/rest/v1/${encodeURIComponent(this.table)}${params.toString() ? `?${params}` : ''}`;
        const method = this.action === 'insert' ? 'POST' : this.action === 'update' ? 'PATCH' : this.action === 'delete' ? 'DELETE' : 'GET';
        try {
          const response = await fetch(url, {
            method,
            headers: headers({ json: method !== 'GET', prefer: method === 'GET' ? undefined : 'return=representation' }),
            body: method === 'GET' ? undefined : JSON.stringify(this.payload),
          });
          const result = await parseResponse(response);
          if (result.error) return result;
          if (this.singleValue) {
            const value = Array.isArray(result.data) ? result.data[0] : result.data;
            return value ? { data: value, error: null } : { data: null, error: { message: 'Profile record was not found.' } };
          }
          return result;
        } catch (error) {
          return { data: null, error: { message: `Network request failed: ${error.message}` } };
        }
      }
      then(resolve, reject) { return this.execute().then(resolve, reject); }
    }

    const auth = {
      async signUp({ email, password, options = {} }) {
        const redirect = options.emailRedirectTo ? `?redirect_to=${encodeURIComponent(options.emailRedirectTo)}` : '';
        const result = await authRequest(`/auth/v1/signup${redirect}`, { email, password, data: options.data || {} }, { authenticated: false });
        if (!result.error) {
          const session = makeSession(result.data);
          if (session) { writeSession(session); emit('SIGNED_IN', session); }
        }
        return result;
      },
      async signInWithPassword({ email, password }) {
        const result = await authRequest('/auth/v1/token?grant_type=password', { email, password }, { authenticated: false });
        if (!result.error) {
          const session = makeSession(result.data);
          if (!session) return { data: null, error: { message: 'No login session was returned. Confirm the account email or recreate the account.' } };
          writeSession(session); emit('SIGNED_IN', session);
          return { data: { session, user: session.user }, error: null };
        }
        return result;
      },
      async signOut() {
        const session = readSession();
        if (session?.access_token) await authRequest('/auth/v1/logout', undefined, { method: 'POST' });
        writeSession(null); emit('SIGNED_OUT', null);
        return { error: null };
      },
      async getSession() {
        let session = readSession();
        if (session?.expires_at && session.expires_at <= Math.floor(Date.now() / 1000) + 15) session = await refreshSession(session);
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback) {
        listeners.add(callback);
        queueMicrotask(() => callback('INITIAL_SESSION', readSession()));
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      },
    };

    return {
      auth,
      from(table) { return new QueryBuilder(table); },
      async rpc(name, payload = {}) {
        try {
          const response = await fetch(`${base}/rest/v1/rpc/${encodeURIComponent(name)}`, {
            method: 'POST', headers: headers(), body: JSON.stringify(payload),
          });
          return await parseResponse(response);
        } catch (error) {
          return { data: null, error: { message: `Network request failed: ${error.message}` } };
        }
      },
      channel() {
        return { on() { return this; }, subscribe() { return this; } };
      },
    };
  }

  window.GamersArchivesSupabaseLite = { createClient };
})();
