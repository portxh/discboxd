import { supabase } from '../config/supabase.js';

export const socialService = {

  async followUser(followerId, followingId) {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('find the table')) {
          throw new Error('A tabela de seguidores não foi encontrada no banco de dados. Por favor, execute o script SQL.');
        }
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao seguir usuário:', error.message);
      return { success: false, error: error.message };
    }
  },

  async unfollowUser(followerId, followingId) {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao deixar de seguir:', error.message);
      return { success: false, error: error.message };
    }
  },

  async checkFollow(followerId, followingId) {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Erro ao checar follow:', error.message);
      return false;
    }
  },

  async getFollowingFeed(userId, page = 1, limit = 20) {
    try {
      // 1. Pega os IDs de quem o usuário segue
      const { data: follows, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followError) throw followError;

      let followingIds = [];
      if (follows && follows.length > 0) {
        followingIds = follows.map(f => f.following_id);
      }
      
      // Inclui o próprio usuário para ele ver suas atividades
      followingIds.push(userId);
      
      const offset = (page - 1) * limit;

      // 2. Busca a coleção dessas pessoas sem o join direto com profiles
      const { data, error } = await supabase
        .from('collection')
        .select(`
          id,
          rating,
          review,
          favorite_track,
          added_at,
          updated_at,
          user_id,
          album:albums!inner(id, spotify_id, title, artist, cover_url, release_year)
        `)
        .in('user_id', followingIds)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      if (!data || data.length === 0) return [];

      // 3. Busca os profiles manualmente para evitar erro de foreign key
      const userIds = [...new Set(data.map(item => item.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      // 4. Combina os dados
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
      console.error('Erro ao buscar feed de seguidos:', error.message);
      return [];
    }
  },

  async getUserFeed(userId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const { data, error } = await supabase
        .from('collection')
        .select(`id, rating, review, favorite_track, added_at, updated_at, user_id, album:albums!inner(id, spotify_id, title, artist, cover_url, release_year)`)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .eq('id', userId)
        .single();

      return data.map(item => ({
        ...item,
        profile: profile || { username: 'usuario', display_name: 'Usuário', avatar_url: '' }
      }));
    } catch (error) {
      console.error('Erro ao buscar feed do usuário:', error.message);
      return [];
    }
  },

  async getUserStats(userId) {
    try {
      const { data, error } = await supabase
        .from('collection')
        .select('album:albums(artist)')
        .eq('user_id', userId);
      if (error || !data) return { total: 0, topArtist: 'Nenhum' };
      
      const total = data.length;
      if (total === 0) return { total: 0, topArtist: 'Nenhum' };
      
      const artists = {};
      data.forEach(item => {
        if (item.album && item.album.artist) {
          const artist = item.album.artist;
          artists[artist] = (artists[artist] || 0) + 1;
        }
      });
      
      let topArtist = 'Nenhum';
      let maxCount = 0;
      Object.entries(artists).forEach(([artist, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topArtist = artist;
        }
      });
      return { total, topArtist };
    } catch (error) {
      console.error('Erro ao buscar stats do usuário:', error.message);
      return { total: 0, topArtist: 'Nenhum' };
    }
  },

  async getExploreAggregations(timeRange = 'always') {
    try {
      // timeRange pode ser 'week', 'month', 'always'
      let query = supabase
        .from('collection')
        .select(`
          id, rating, added_at,
          album:albums!inner(spotify_id, title, artist, cover_url, release_year)
        `);
        
      if (timeRange === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query = query.gte('added_at', d.toISOString());
      } else if (timeRange === 'month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        query = query.gte('added_at', d.toISOString());
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (!data) return { mostCollected: [], highestRated: [], newReleases: [] };
      
      const albumMap = {};
      
      data.forEach(item => {
        const a = item.album;
        if (!albumMap[a.spotify_id]) {
          albumMap[a.spotify_id] = {
            ...a,
            collection_count: 0,
            total_rating: 0,
            rating_count: 0,
            last_added_at: item.added_at
          };
        }
        
        albumMap[a.spotify_id].collection_count += 1;
        if (item.rating > 0) {
          albumMap[a.spotify_id].total_rating += item.rating;
          albumMap[a.spotify_id].rating_count += 1;
        }
        if (new Date(item.added_at) > new Date(albumMap[a.spotify_id].last_added_at)) {
          albumMap[a.spotify_id].last_added_at = item.added_at;
        }
      });
      
      const albumsArray = Object.values(albumMap);
      
      // Calculate averages
      albumsArray.forEach(a => {
        a.avg_rating = a.rating_count > 0 ? (a.total_rating / a.rating_count) : 0;
      });
      
      // 1. Mais Colecionados
      const mostCollected = [...albumsArray]
        .sort((a, b) => b.collection_count - a.collection_count || new Date(b.last_added_at) - new Date(a.last_added_at))
        .slice(0, 10);
        
      // 2. Melhores Avaliados (minimo 1 avaliacao)
      const highestRated = [...albumsArray]
        .filter(a => a.rating_count > 0)
        .sort((a, b) => b.avg_rating - a.avg_rating || b.rating_count - a.rating_count)
        .slice(0, 10);
        
      return {
        mostCollected,
        highestRated
      };
      
    } catch (error) {
      console.error('Erro ao buscar agregações do explorar:', error.message);
      return { mostCollected: [], highestRated: [] };
    }
  },

  // === Comentários ===

  async getComments(collectionId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Buscar perfis manualmente para evitar problemas de FK join
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(p => profilesMap[p.id] = p);
      }

      return data.map(c => ({
        ...c,
        profile: profilesMap[c.user_id] || { display_name: 'Usuário', avatar_url: '', username: 'user' }
      }));
    } catch (error) {
      console.error('Erro ao buscar comentários:', error.message);
      return [];
    }
  },

  async addComment(collectionId, userId, content) {
    try {
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          collection_id: collectionId,
          user_id: userId,
          content: content
        })
        .select('id, content, created_at, user_id')
        .single();

      if (error) {
        console.error('[addComment] Erro do Supabase:', error.code, error.message, error.details, error.hint);
        throw error;
      }
      
      return { success: true, comment: data };
    } catch (error) {
      console.error('[addComment] Erro ao adicionar comentário:', error.message);
      return { success: false, error: error.message };
    }
  },

  // === Curtidas (Likes) ===

  async getLikesInfo(collectionId, currentUserId) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('user_id')
        .eq('collection_id', collectionId);

      if (error) throw error;
      
      const count = data ? data.length : 0;
      const userLiked = data ? data.some(l => l.user_id === currentUserId) : false;
      
      return { count, userLiked };
    } catch (error) {
      console.error('Erro ao buscar likes:', error.message);
      return { count: 0, userLiked: false };
    }
  },

  async toggleLike(collectionId, userId) {
    try {
      // Check if already liked
      const { data, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (data) {
        // Remove like
        const { error: delError } = await supabase
          .from('likes')
          .delete()
          .eq('collection_id', collectionId)
          .eq('user_id', userId);
        if (delError) throw delError;
        return { success: true, liked: false };
      } else {
        // Add like
        const { error: insError } = await supabase
          .from('likes')
          .insert({ collection_id: collectionId, user_id: userId });
        if (insError) throw insError;
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error('Erro ao alternar like:', error.message);
      return { success: false, error: error.message };
    }
  },

  // === Notificações e Amigos ===
  async getNotifications(userId) {
    try {
      // 1. Pegar IDs das coleções do usuário com dados do álbum
      const { data: userCollections, error: collErr } = await supabase
        .from('collection')
        .select('id, album:albums!inner(spotify_id, title, artist, cover_url)')
        .eq('user_id', userId);

      if (collErr) {
        console.error('Erro ao buscar coleções para notificações:', collErr.message);
      }

      const collectionAlbumMap = {};
      const collectionIds = [];
      if (userCollections) {
        userCollections.forEach(c => {
          collectionIds.push(c.id);
          collectionAlbumMap[c.id] = c.album;
        });
      }

      let notifications = [];

      if (collectionIds.length > 0) {
        // Likes (que não sejam do próprio usuário)
        const { data: likesData } = await supabase
          .from('likes')
          .select('user_id, created_at, collection_id')
          .in('collection_id', collectionIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(15);
          
        if (likesData) {
          notifications.push(...likesData.map(l => ({
            type: 'like',
            user_id: l.user_id,
            created_at: l.created_at,
            collection_id: l.collection_id
          })));
        }

        // Comentários (que não sejam do próprio usuário)
        const { data: commentsData } = await supabase
          .from('comments')
          .select('user_id, created_at, collection_id, content')
          .in('collection_id', collectionIds)
          .neq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(15);

        if (commentsData) {
          notifications.push(...commentsData.map(c => ({
            type: 'comment',
            user_id: c.user_id,
            created_at: c.created_at,
            collection_id: c.collection_id,
            content: c.content
          })));
        }
      }

      // Novos seguidores
      const { data: followsData } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (followsData) {
        notifications.push(...followsData.map(f => ({
          type: 'follow',
          user_id: f.follower_id,
          created_at: f.created_at
        })));
      }

      // Ordenar tudo por data
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      notifications = notifications.slice(0, 20);

      if (notifications.length === 0) return [];

      // Buscar perfis
      const userIdsToFetch = [...new Set(notifications.map(n => n.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIdsToFetch);

      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(p => profilesMap[p.id] = p);
      }

      return notifications.map(n => ({
        ...n,
        album: collectionAlbumMap[n.collection_id] || null,
        profile: profilesMap[n.user_id] || { display_name: 'Usuário', avatar_url: '' }
      }));

    } catch (error) {
      console.error('Erro ao buscar notificações:', error.message);
      return [];
    }
  },

  async getFriendsSidebar(userId) {
    try {
      // 1. Quem o usuário segue
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (!follows || follows.length === 0) return [];

      const followingIds = follows.map(f => f.following_id);

      // 2. Busca os perfis
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', followingIds)
        .limit(10);

      if (!profilesData) return [];

      // 3. Busca a última atividade de cada um (para exibir "Ouvindo/Último")
      const { data: collections } = await supabase
        .from('collection')
        .select('user_id, album:albums!inner(title, artist)')
        .in('user_id', followingIds)
        .order('updated_at', { ascending: false });

      // Agrupa a última coleção de cada user
      const lastActivityMap = {};
      if (collections) {
        collections.forEach(c => {
          if (!lastActivityMap[c.user_id]) {
            lastActivityMap[c.user_id] = c.album;
          }
        });
      }

      return profilesData.map(p => ({
        ...p,
        lastActivity: lastActivityMap[p.id] || null
      }));
    } catch (error) {
      console.error('Erro ao buscar sidebar de amigos:', error.message);
      return [];
    }
  }

};
