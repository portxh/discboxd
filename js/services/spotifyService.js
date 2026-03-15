// Camada de integração com a API Web do Spotify
// Responsável por buscas e obtenção de detalhes de álbuns e faixasWeb API

import { spotifyAuth } from './spotifyAuth.js';

const API_BASE = 'https://api.spotify.com/v1';

export const spotifyService = {

  async searchAlbums(query) {
    const token = await spotifyAuth.getValidToken();
    if (!token) return { items: [], error: 'not_connected' };

    try {
      const url = `${API_BASE}/search?q=${encodeURIComponent(query)}&type=album`;

      console.info('[Spotify Search] Buscando:', query, '| Token:', token.substring(0, 15) + '...');

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        console.warn('[Spotify Search] 401 — token rejeitado.');
        spotifyAuth.disconnect();
        return { items: [], error: 'token_expired' };
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Spotify Search] Erro', response.status, ':', errorBody);
        return { items: [], error: 'api_error' };
      }

      const data = await response.json();

      if (!data.albums || !data.albums.items) {
        return { items: [], error: null };
      }

      return {
        items: data.albums.items.map(album => ({
          spotify_id: album.id,
          title: album.name,
          artist: album.artists.map(a => a.name).join(', '),
          artist_id: album.artists[0]?.id || null,
          cover_url: album.images[0]?.url || null,
          release_year: parseInt(album.release_date?.substring(0, 4)) || null,
        })),
        error: null,
      };
    } catch (error) {
      console.error('[Spotify Search] Exceção:', error);
      return { items: [], error: 'api_error' };
    }
  },

  async getAlbumDetails(spotifyId) {
    const token = await spotifyAuth.getValidToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/albums/${spotifyId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) return null;

      const album = await response.json();

      // Gêneros: fallback para artista se álbum não tiver
      let genres = album.genres || [];
      if (genres.length === 0 && album.artists?.[0]?.id) {
        const artistGenres = await this.getArtistGenres(album.artists[0].id);
        if (artistGenres.length > 0) genres = artistGenres;
      }

      return {
        spotify_id: album.id,
        title: album.name,
        artist: album.artists.map(a => a.name).join(', '),
        artist_id: album.artists[0]?.id || null,
        cover_url: album.images[0]?.url || null,
        release_year: parseInt(album.release_date?.substring(0, 4)) || null,
        total_tracks: album.total_tracks,
        popularity: album.popularity || 0,
        label: album.label,
        copyrights: album.copyrights?.map(c => c.text).join(' | '),
        genres,
        tracks: album.tracks.items.map(t => ({
          name: t.name,
          number: t.track_number,
          duration_ms: t.duration_ms,
          artists: t.artists.map(a => a.name).join(', '),
        })),
      };
    } catch (error) {
      console.error('[Spotify Details] Exceção:', error);
      return null;
    }
  },

  async getArtistGenres(artistId) {
    const token = await spotifyAuth.getValidToken();
    if (!token) return [];

    try {
      const response = await fetch(`${API_BASE}/artists/${artistId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) return [];

      const artist = await response.json();
      return artist.genres || [];
    } catch (error) {
      console.error('[Spotify Artist Genres] Exceção:', error);
      return [];
    }
  }
};
