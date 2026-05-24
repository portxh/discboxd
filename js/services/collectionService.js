// Camada de serviço para gerenciar a coleção de álbuns do usuário
// Interage com a tabela 'collection' no Supabase

import { supabase } from '../config/supabase.js';

export const collectionService = {

  async addToCollection(userId, albumData) {
    try {
      // 1. Tenta buscar se o álbum já existe globalmente na tabela 'albums'
      let { data: album, error: findError } = await supabase
        .from('albums')
        .select('*')
        .eq('spotify_id', albumData.spotify_id)
        .maybeSingle();

      if (findError) throw findError;

      // 2. Se o álbum não existir, tenta inseri-lo na tabela 'albums'
      if (!album) {
        const albumToInsert = {
          spotify_id: albumData.spotify_id,
          title: albumData.title,
          artist: albumData.artist,
          cover_url: albumData.cover_url,
          release_year: albumData.release_year,
          genres: albumData.genres || [],
        };

        const { data: newAlbum, error: albumError } = await supabase
          .from('albums')
          .insert(albumToInsert)
          .select()
          .single();

        if (albumError) {
          // Se for um erro relacionado à coluna 'genres', tenta inserir sem ela
          if (albumError.message.includes('genres')) {
            console.warn('Coluna "genres" não encontrada. Retry sem gêneros...');
            const retryData = { ...albumToInsert };
            delete retryData.genres;
            const retry = await supabase.from('albums').insert(retryData).select().single();
            if (retry.error) throw retry.error;
            album = retry.data;
          } else {
            throw albumError;
          }
        } else {
          album = newAlbum;
        }
      }

      // Vincula o álbum à coleção do usuário na tabela 'collection'
      const { error: collError } = await supabase
        .from('collection')
        .upsert({
          user_id: userId,
          album_id: album.id,
          status: 'na_colecao',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,album_id' });

      if (collError) throw collError;

      return { success: true, album };
    } catch (error) {
      console.error('Erro ao adicionar à coleção:', error.message);
      return { success: false, error: error.message };
    }
  },

  async removeFromCollection(userId, albumId) {
    try {
      const { error } = await supabase
        .from('collection')
        .delete()
        .eq('user_id', userId)
        .eq('album_id', albumId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao remover da coleção:', error.message);
      return { success: false, error: error.message };
    }
  },

  async getCollection(userId) {
    try {
      // Tenta buscar os álbuns da coleção do usuário, incluindo os gêneros
      let { data, error } = await supabase
        .from('collection')
        .select(`
          id,
          status,
          rating,
          review,
          favorite_track,
          added_at,
          updated_at,
          album:albums (
            id,
            spotify_id,
            title,
            artist,
            cover_url,
            release_year,
            genres
          )
        `)
        .eq('user_id', userId)
        .order('added_at', { ascending: false });

      // Se houver um erro de coluna (ex: 'genres' não existe), tenta buscar sem os gêneros
      if (error && error.message.includes('genres')) {
        console.warn('Coluna "genres" não encontrada no Supabase. Buscando sem gêneros...');
        const retry = await supabase
          .from('collection')
          .select(`
            id,
            status,
            rating,
            review,
            favorite_track,
            added_at,
            updated_at,
            album:albums (
              id,
              spotify_id,
              title,
              artist,
              cover_url,
              release_year
            )
          `)
          .eq('user_id', userId)
          .order('added_at', { ascending: false });
        
        if (retry.error) throw retry.error;
        data = retry.data;
      } else if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar coleção:', error.message);
      return [];
    }
  },

  async isInCollection(userId, spotifyId) {
    try {
      // Verifica se um álbum específico (pelo spotify_id) está na coleção de um usuário.
      const { data, error } = await supabase
        .from('collection')
        .select('id, album:albums!inner(spotify_id)')
        .eq('user_id', userId)
        .eq('albums.spotify_id', spotifyId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Erro ao verificar álbum na coleção:', error.message);
      return false;
    }
  },

  async updateAlbumGenres(albumId, genres) {
    try {
      const { error } = await supabase
        .from('albums')
        .update({ genres })
        .eq('id', albumId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao atualizar gêneros:', error.message);
      return false;
    }
  },

  async updateReview(userId, albumId, rating, reviewText, favoriteTrack) {
    try {
      const { error } = await supabase
        .from('collection')
        .update({ 
          rating: rating || null, 
          review: reviewText || null, 
          favorite_track: favoriteTrack || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('album_id', albumId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar resenha:', error.message);
      return { success: false, error: error.message };
    }
  },

  async getPublicFeed(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('collection')
        .select(`
          id,
          rating,
          review,
          added_at,
          user_id,
          album:albums!inner(title, artist, cover_url)
        `)
        .order('added_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      // Fetch profiles manually to avoid foreign key issues
      const userIds = [...new Set(data.map(item => item.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url, id')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      const enrichedData = data.map(item => ({
        ...item,
        profile: profilesMap[item.user_id] || { 
          username: 'usuario', 
          display_name: 'Usuário', 
          avatar_url: '' 
        }
      }));

      return enrichedData;
    } catch (error) {
      console.error('Erro ao buscar feed público:', error.message);
      return [];
    }
  },

  async searchUsers(query) {
    if (!query) return [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error.message);
      return [];
    }
  },

  async getUserCollection(userId) {
    // Mesma lógica do getCollection, mas para visualização pública
    return this.getCollection(userId);
  }
};
