import { authService } from './services/authService.js';
import { authUI } from './ui/authUI.js';
import { profileUI } from './ui/profileUI.js';
import { catalogUI } from './ui/catalogUI.js';
import { spotifyAuth } from './services/spotifyAuth.js';

// O ?code= do Spotify já foi extraído pelo <script> inline no index.html.
// Isso evita conflitos com o Supabase Auth.

const App = {
  
  async init() {
    authUI.init();
    profileUI.init();
    catalogUI.init();

    // Troca o código temporário salvo (sessionStorage) por um access_token do Spotify
    await spotifyAuth.handleCallback();

    const session = await authService.getSession();
    this.handleRouting(session);

    authService.onAuthStateChange((event, session) => {
      this.handleRouting(session);
    });
  },

  async handleRouting(session) {
    if (session) {
      // Sincronizar perfil (especialmente para login social)
      let profile = await authService.getProfile(session.user.id);
      
      // Se não tem username (usuário novo via OAuth), tenta gerar um padrão
      if (profile && !profile.username) {
        console.info('[App] Usuário novo via OAuth detectado. Gerando username temporário...');
        const tempUsername = `user_${session.user.id.substring(0, 8)}`;
        // Update profile in DB (via Supabase logic or let trigger handle it)
        // For now, we just ensure UI handles missing username gracefully
        profile.username = tempUsername;
      }

      await profileUI.loadProfileData(session);
      catalogUI.updateSpotifyState();
      await catalogUI.loadCollection(session.user.id);
      authUI.showDashboard();
    } else {
      authUI.showLanding();
    }
  }

};

document.addEventListener('DOMContentLoaded', () => {
   App.init();
});
