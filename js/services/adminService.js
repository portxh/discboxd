import { supabase } from '../config/supabase.js';

export const adminService = {
  /**
   * Verifica se o usuário atual tem a flag is_admin = true
   * @param {string} userId - ID do usuário atual
   * @returns {boolean}
   */
  async checkAdminStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data?.is_admin || false;
    } catch (err) {
      console.error('[AdminService] Erro ao checar status de admin:', err);
      return false;
    }
  },

  /**
   * Busca as métricas globais da plataforma
   */
  async fetchGlobalStats() {
    try {
      const [{ count: usersCount }, { count: collectionCount }, { count: commentsCount }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('collection').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true })
      ]);

      return {
        users: usersCount || 0,
        collection: collectionCount || 0,
        comments: commentsCount || 0
      };
    } catch (err) {
      console.error('[AdminService] Erro ao buscar estatísticas globais:', err);
      return { users: 0, collection: 0, comments: 0 };
    }
  },

  /**
   * Busca todas as resenhas para moderação
   */
  async fetchReviewsAdmin() {
    try {
      const { data, error } = await supabase
        .from('collection')
        .select(`
          id,
          review,
          rating,
          added_at,
          user_id,
          album:albums!inner(title, artist)
        `)
        .not('review', 'is', null)
        .neq('review', '')
        .order('added_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Busca os profiles manualmente para evitar erro de foreign key
      const userIds = [...new Set(data.map(item => item.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      return data.map(item => ({
        ...item,
        profiles: profilesMap[item.user_id] || { username: 'usuario', avatar_url: '' }
      }));
    } catch (err) {
      console.error('[AdminService] Erro ao buscar resenhas:', err);
      return [];
    }
  },

  /**
   * Deleta uma coleção/resenha (Ação de Moderação)
   */
  async deleteReviewAdmin(collectionId) {
    try {
      const { error } = await supabase
        .from('collection')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[AdminService] Erro ao deletar resenha:', err);
      throw err;
    }
  },

  /**
   * Busca todos os usuários
   */
  async fetchUsersAdmin() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_banned, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[AdminService] Erro ao buscar usuários:', err);
      return [];
    }
  },

  /**
   * Altera o status de banimento de um usuário e atualiza sua bio
   */
  async toggleUserBan(targetUserId, currentBanStatus) {
    try {
      const newStatus = !currentBanStatus;
      const updates = { is_banned: newStatus };
      
      if (newStatus) {
        updates.bio = '[CONTA SUSPENSA POR MODERAÇÃO]';
      } else {
        updates.bio = ''; // Limpa a bio ao desbanir
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetUserId);

      if (error) throw error;
      return newStatus;
    } catch (err) {
      console.error('[AdminService] Erro ao alterar status de banimento:', err);
      throw err;
    }
  }
};
