// Autenticação Spotify (Fluxo Authorization Code + PKCE)
// Utiliza parâmetro 'state' para segurança e isolamento do Supabase Auth

const CLIENT_ID = 'dd1aa25dfbf4489390b0b10fbd680bd4';
const REDIRECT_URI = window.location.origin + window.location.pathname;
console.info('[Spotify] Redirect URI:', REDIRECT_URI);
const SCOPES = 'user-read-private user-read-currently-playing';
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const STATE_KEY = 'spotify_auth';

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(buf) {
  const bytes = new Uint8Array(buf);
  let str = '';
  bytes.forEach(b => str += String.fromCharCode(b));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ============================================================
// IMPORTANTE: Esta função deve ser chamada ANTES do Supabase
// para capturar o ?code= do Spotify antes que o Supabase o consuma.
// ============================================================
export function extractSpotifyCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (code && state === STATE_KEY) {
    // Callback detectado: salva o código temporário e limpa a URL para o usuário
    sessionStorage.setItem('spotify_pending_code', code);
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }
  return false;
}

export const spotifyAuth = {

  async redirectToSpotify() {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64urlencode(hashed);

    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state: STATE_KEY,
      show_dialog: 'false',
    });

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  },

  async handleCallback() {
    // Pega o code que foi salvo pelo extractSpotifyCode()
    const code = sessionStorage.getItem('spotify_pending_code');
    if (!code) return false;

    const codeVerifier = localStorage.getItem('spotify_code_verifier');
    if (!codeVerifier) {
      console.warn('[Spotify] Code verifier ausente.');
      sessionStorage.removeItem('spotify_pending_code');
      return false;
    }

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expiry', String(Date.now() + (data.expires_in * 1000)));
        if (data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        console.info('[Spotify] Autenticado com sucesso.');
        sessionStorage.removeItem('spotify_pending_code');
        localStorage.removeItem('spotify_code_verifier');
        return true;
      } else {
        console.error('[Spotify] Resposta sem token:', data);
      }
    } catch (err) {
      console.error('[Spotify] Erro no callback:', err);
    }

    sessionStorage.removeItem('spotify_pending_code');
    return false;
  },

  getToken() {
    const expiry = localStorage.getItem('spotify_token_expiry');
    if (expiry && Date.now() > parseInt(expiry)) {
      return null;
    }
    return localStorage.getItem('spotify_access_token');
  },

  async refreshToken() {
    const rt = localStorage.getItem('spotify_refresh_token');
    if (!rt || rt === 'undefined') return null;

    try {
      const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          grant_type: 'refresh_token',
          refresh_token: rt,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem('spotify_access_token', data.access_token);
        localStorage.setItem('spotify_token_expiry', String(Date.now() + (data.expires_in * 1000)));
        if (data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
        }
        return data.access_token;
      }
    } catch (err) {
      console.error('[Spotify] Erro ao renovar:', err);
    }
    return null;
  },

  async getValidToken() {
    let token = this.getToken();
    if (token) return token;
    token = await this.refreshToken();
    return token;
  },

  isConnected() {
    if (this.getToken()) return true;
    const rt = localStorage.getItem('spotify_refresh_token');
    return !!rt && rt !== 'undefined';
  },

  disconnect() {
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
    localStorage.removeItem('spotify_token_expiry');
    localStorage.removeItem('spotify_code_verifier');
  },

  getTokenMinutesLeft() {
    const expiry = localStorage.getItem('spotify_token_expiry');
    if (!expiry) return 0;
    return Math.max(0, Math.round((parseInt(expiry) - Date.now()) / 60000));
  }
};
