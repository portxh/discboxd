import { authService } from './services/authService.js';
import { authUI } from './ui/authUI.js';
import { profileUI } from './ui/profileUI.js';
import { catalogUI } from './ui/catalogUI.js';
import { communityUI } from './ui/communityUI.js';
import { spotifyAuth } from './services/spotifyAuth.js';
import { adminUI } from './ui/adminUI.js';

// O ?code= do Spotify já foi extraído pelo <script> inline no index.html.
// Isso evita conflitos com o Supabase Auth.

const App = {

  async init() {
    authUI.init();
    profileUI.init();
    catalogUI.init();
    communityUI.init();

    // Troca o código temporário salvo (sessionStorage) por um access_token do Spotify
    await spotifyAuth.handleCallback();

    const session = await authService.getSession();
    this.handleRouting(session);

    authService.onAuthStateChange((event, session) => {
      this.handleRouting(session);
      if (event === 'PASSWORD_RECOVERY') {
        setTimeout(() => {
          alert('Redefinição de Senha Solicitada. Por favor, digite sua nova senha nas Configurações de Perfil.');
          const btnProfile = document.getElementById('btn-header-profile');
          if (btnProfile) btnProfile.click();
          const passwordEditContainer = document.getElementById('password-edit-container');
          if (passwordEditContainer && passwordEditContainer.classList.contains('hidden')) {
            const btnTogglePassword = document.getElementById('btn-toggle-password');
            if (btnTogglePassword) btnTogglePassword.click();
          }
        }, 1000);
      }
    });
  },

  async handleRouting(session) {
    if (session) {
      // Sincronizar perfil (especialmente para login social)
      let profile = await authService.getProfile(session.user.id);

      // Se não tem username (usuário novo via OAuth), gera e salva no banco
      if (profile && !profile.username) {
        console.info('[App] Usuário novo via OAuth detectado. Gerando username...');
        const tempUsername = `user_${session.user.id.substring(0, 8)}`;
        const { supabase } = await import('./config/supabase.js');
        await supabase.from('profiles').update({ username: tempUsername }).eq('id', session.user.id);
        profile.username = tempUsername;
      }

      await profileUI.loadProfileData(session);
      catalogUI.updateSpotifyState();
      await catalogUI.loadCollection(session.user.id);
      authUI.showDashboard();

      // Default to Feed de Atividade and load the community feed
      communityUI.switchTab('community');
      communityUI.switchCommunityView('following');
      
      // Inicializar Admin Panel
      await adminUI.init(session);
    } else {
      authUI.showLanding();
    }
  }

};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
