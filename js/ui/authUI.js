import { authService } from '../services/authService.js';

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

      if(password.length < 6) {
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
    if(this.loginView) this.loginView.style.display = 'none';
    if(this.dashboardView) this.dashboardView.style.display = 'none';
    if(this.landingView) {
      this.landingView.style.display = 'flex';
      this.landingView.classList.add('flex-col', 'items-center');
      this.landingView.classList.add('fade-in');
    }
  },

  showDashboard() {
    if(this.landingView) this.landingView.style.display = 'none';
    if(this.loginView) this.loginView.style.display = 'none';
    if(this.dashboardView) {
      this.dashboardView.style.display = 'flex';
      this.dashboardView.classList.add('flex-col');
      this.dashboardView.classList.add('fade-in');
    }
  },

  showLogin() {
    if(this.landingView) this.landingView.style.display = 'none';
    if(this.dashboardView) this.dashboardView.style.display = 'none';
    if(this.loginView) {
      this.loginView.style.display = 'block';
      this.loginView.classList.add('fade-in');
    }
  }

};
