// Camada de serviço para detectar o que o usuário está ouvindo no momento
// Integrado com a API Web do Spotify (Currently Playing)

import { spotifyAuth } from './spotifyAuth.js';

const API_BASE = 'https://api.spotify.com/v1';

export const listeningService = {

  async getCurrentTrack() {
    const token = await spotifyAuth.getValidToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/me/player/currently-playing`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // 204 = nada tocando no momento
      if (response.status === 204 || response.status === 202) return null;
      if (!response.ok) return null;

      const data = await response.json();

      if (!data.is_playing || !data.item) return null;

      return {
        track: data.item.name,
        artist: data.item.artists.map(a => a.name).join(', '),
        albumCover: data.item.album?.images?.[0]?.url || null,
        albumName: data.item.album?.name || '',
      };
    } catch (err) {
      console.error('[Listening Now] Erro:', err);
      return null;
    }
  }
};
