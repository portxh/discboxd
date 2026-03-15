import { supabase } from '../config/supabase.js';

// Camada de integração com Supabase Auth
// Gerencia Sessões, Login, Cadastro e Perfil de Usuário

export const authService = {
  
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Erro ao pegar sessão:', error.message);
      return null;
    }
  },

  onAuthStateChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async signInWithSpotify() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
          scopes: 'user-read-email user-read-private'
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erro no login Spotify:', error.message);
      return { data: null, error: error.message };
    }
  },

  async signUp(email, password, displayName, username) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username: username
          }
        }
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },
  
   async getProfile(userId) {
     try {
       const { data, error } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', userId)
         .single();
       if (error) throw error;
       return data;
     } catch (error) {
       console.error('Erro ao buscar perfil:', error.message);
       return null;
     }
   },
    
    async uploadAvatar(userId, file) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obtém a URL pública do arquivo enviado
        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        return data.publicUrl;
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error.message);
        throw error;
      }
    }
};
