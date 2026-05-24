import { authService } from '../services/authService.js';
import { collectionService } from '../services/collectionService.js';

// Camada de UI: Gerencia as visões de Landing, Login e Cadastro

export const authUI = {


  landingView: null,
  loginView: null,
  dashboardView: null,


  getStartedBtn: null,


  loginForm: null,
  registerForm: null,
  toggleToRegisterBtn: null,
  toggleToLoginBtn: null,


  authErrorMsg: null,


  loginEmailInput: null,
  loginPasswordInput: null,
  loginBtn: null,


  registerEmailInput: null,
  registerPasswordInput: null,
  registerNameInput: null,
  registerUsernameInput: null,
  registerBtn: null,


  logoutBtn: null,
  loginSpotifyModalBtn: null,

  forgotPasswordModal: null,
  btnToggleForgotPassword: null,
  btnCloseForgotPassword: null,
  forgotPasswordForm: null,
  forgotPasswordEmailInput: null,
  btnSubmitForgotPassword: null,

  init() {
    this.landingView = document.getElementById('landing-view');
    this.loginView = document.getElementById('login-view');
    this.dashboardView = document.getElementById('dashboard-view');
    this.getStartedBtn = document.getElementById('btn-get-started');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.toggleToRegisterBtn = document.getElementById('toggle-register');
    this.toggleToLoginBtn = document.getElementById('toggle-login');
    this.authErrorMsg = document.getElementById('auth-error-msg');
    this.loginEmailInput = document.getElementById('login-email');
    this.loginPasswordInput = document.getElementById('login-password');
    this.loginBtn = document.getElementById('btn-login');
    this.registerEmailInput = document.getElementById('register-email');
    this.registerPasswordInput = document.getElementById('register-password');
    this.registerNameInput = document.getElementById('register-name');
    this.registerBtn = document.getElementById('btn-register');
    this.logoutBtn = document.getElementById('btn-logout');
    this.loginSpotifyModalBtn = document.getElementById('btn-login-spotify-modal');

    this.forgotPasswordModal = document.getElementById('forgot-password-modal');
    this.btnToggleForgotPassword = document.getElementById('toggle-forgot-password');
    this.btnCloseForgotPassword = document.getElementById('btn-close-forgot-password');
    this.forgotPasswordForm = document.getElementById('forgot-password-form');
    this.forgotPasswordEmailInput = document.getElementById('forgot-password-email');
    this.btnSubmitForgotPassword = document.getElementById('btn-submit-forgot-password');

    this.setupViewToggles();
    this.setupSubmitListeners();
  },

  setupViewToggles() {
    this.getStartedBtn?.addEventListener('click', () => {
      this.showLogin();
    });

    this.toggleToRegisterBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.clearErrors();
      this.loginForm.classList.add('hidden');
      this.registerForm.classList.remove('hidden');
      this.registerForm.classList.add('fade-in');
    });

    this.toggleToLoginBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.clearErrors();
      this.registerForm.classList.add('hidden');
      this.loginForm.classList.remove('hidden');
      this.loginForm.classList.add('fade-in');
    });

    this.btnToggleForgotPassword?.addEventListener('click', (e) => {
      e.preventDefault();
      this.forgotPasswordModal?.classList.remove('hidden');
    });

    this.btnCloseForgotPassword?.addEventListener('click', () => {
      this.forgotPasswordModal?.classList.add('hidden');
    });
    
    this.forgotPasswordModal?.addEventListener('click', (e) => {
      if (e.target === this.forgotPasswordModal) {
        this.forgotPasswordModal.classList.add('hidden');
      }
    });
  },

  setupSubmitListeners() {
    this.loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearErrors();
      this.setLoading(this.loginBtn, true);

      const email = this.loginEmailInput.value;
      const password = this.loginPasswordInput.value;

      const { data, error } = await authService.signIn(email, password);

      this.setLoading(this.loginBtn, false);

      if (error) {
        this.showError('Erro ao entrar. Verifique suas credenciais.');
      } else {
        this.loginForm.reset();
      }
    });

    this.registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearErrors();
      this.setLoading(this.registerBtn, true);

      const email = this.registerEmailInput.value;
      const password = this.registerPasswordInput.value;
      const name = this.registerNameInput.value;
      const username = this.registerUsernameInput.value.toLowerCase().trim();

      if (password.length < 6) {
        this.setLoading(this.registerBtn, false);
        return this.showError('Sua senha deve ter no mínimo 6 caracteres.');
      }

      const { data, error } = await authService.signUp(email, password, name, username);

      this.setLoading(this.registerBtn, false);

      if (error) {
        this.showError(`Erro ao criar conta: ${error}`);
      } else {
        alert('Conta criada com sucesso! Você já pode entrar.');
        this.toggleToLoginBtn.click();
        this.loginEmailInput.value = email;
        this.registerForm.reset();
      }
    });

    this.logoutBtn?.addEventListener('click', async () => {
      await authService.signOut();
    });

    this.loginSpotifyModalBtn?.addEventListener('click', () => this.handleSpotifyLogin());

    this.forgotPasswordForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.setLoading(this.btnSubmitForgotPassword, true);
      
      const email = this.forgotPasswordEmailInput.value;
      const { error } = await authService.resetPassword(email);
      
      this.setLoading(this.btnSubmitForgotPassword, false);
      
      if (error) {
        alert(`Erro ao solicitar recuperação: ${error}`);
      } else {
        alert('Link de recuperação enviado! Verifique seu email.');
        this.forgotPasswordModal?.classList.add('hidden');
        this.forgotPasswordForm?.reset();
      }
    });
  },

  async handleSpotifyLogin() {
    this.clearErrors();
    const { error } = await authService.signInWithSpotify();
    if (error) {
      this.showError(`Erro ao conectar com Spotify: ${error}`);
    }
  },

  setLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Carregando...';
      button.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Enviar';
      button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  },

  showError(message) {
    if (!this.authErrorMsg) return;
    this.authErrorMsg.textContent = message;
    this.authErrorMsg.classList.remove('hidden');
    this.authErrorMsg.classList.add('fade-in');
  },

  clearErrors() {
    if (!this.authErrorMsg) return;
    this.authErrorMsg.textContent = '';
    this.authErrorMsg.classList.add('hidden');
  },

  showLanding() {
    if (this.loginView) this.loginView.style.display = 'none';
    if (this.dashboardView) this.dashboardView.style.display = 'none';
    if (this.landingView) {
      this.landingView.style.display = 'flex';
      this.landingView.classList.add('flex-col', 'items-center');
      this.landingView.classList.add('animate-crossfade');
    }
  },

  showDashboard() {
    if (this.landingView) this.landingView.style.display = 'none';
    if (this.loginView) this.loginView.style.display = 'none';
    if (this.dashboardView) {
      this.dashboardView.style.display = 'flex';
      this.dashboardView.classList.add('flex-col');
      this.dashboardView.classList.add('animate-crossfade');
    }
  },

  async showLogin() {
    if (this.landingView) this.landingView.style.display = 'none';
    if (this.dashboardView) this.dashboardView.style.display = 'none';
    if (this.loginView) {
      this.loginView.style.display = 'flex';
      this.loginView.classList.add('animate-crossfade');

      const feedContainer = document.getElementById('landing-feed-container');
      if (feedContainer) {
        try {
          const feed = await collectionService.getPublicFeed(3);
          if (feed && feed.length > 0) {
            feedContainer.innerHTML = '';
            feed.forEach(item => {
              const stars = item.rating ? `${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))}` : '';
              const card = document.createElement('div');
              card.className = 'apple-card p-3 bg-white/50 border border-white/20 backdrop-blur-md flex items-center gap-3 shadow-sm';
              
              const escapeHTML = (str) => {
                const div = document.createElement('div');
                div.innerText = str || '';
                return div.innerHTML;
              };

              const img = document.createElement('img');
              img.src = item.album?.cover_url || '';
              img.className = 'w-10 h-10 rounded-md object-cover shadow-sm';
              
              const contentDiv = document.createElement('div');
              contentDiv.className = 'flex-1 min-w-0';
              
              const topDiv = document.createElement('div');
              topDiv.className = 'flex justify-between items-center';
              
              const usernameP = document.createElement('p');
              usernameP.className = 'text-[10px] font-bold text-[var(--accent)] truncate';
              usernameP.textContent = '@' + (item.user?.username || '');
              
              const starsDiv = document.createElement('div');
              starsDiv.className = 'text-[8px] text-yellow-400 tracking-wider';
              starsDiv.textContent = stars;
              
              topDiv.appendChild(usernameP);
              topDiv.appendChild(starsDiv);
              
              const titleP = document.createElement('p');
              titleP.className = 'text-xs font-bold text-[var(--text-primary)] truncate mt-0.5';
              titleP.textContent = item.album?.title || '';
              
              contentDiv.appendChild(topDiv);
              contentDiv.appendChild(titleP);
              
              if (item.review) {
                const reviewP = document.createElement('p');
                reviewP.className = 'text-[10px] text-[var(--text-secondary)] italic truncate mt-0.5';
                reviewP.textContent = '"' + item.review + '"';
                contentDiv.appendChild(reviewP);
              }
              
              card.replaceChildren(img, contentDiv);
              feedContainer.appendChild(card);
            });
          } else {
            feedContainer.innerHTML = '<p class="text-xs text-center text-[var(--text-secondary)]">Nenhuma atividade recente.</p>';
          }
        } catch(e) {
          console.error("Erro ao carregar feed público:", e);
        }
      }
    }
  }

};
