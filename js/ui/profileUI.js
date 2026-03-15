import { authService } from '../services/authService.js';
import { supabase } from '../config/supabase.js';

// Camada de UI do Perfil: Gerencia o painel de configurações e dados do usuário

export const profileUI = {

  // Elementos do Dashboard
  dashboardContent: null,
  profileSettingsView: null,
  btnProfileToggle: null,
  btnCancelProfile: null,
  mainHeaderIsland: null,
  
  // Elementos do Header
  headerUserName: null,
  headerUserHandle: null,
  headerAvatar: null,

  // Formulário de Perfil
  profileForm: null,
  profileAvatarFile: null,
  profileAvatarPreview: null,
  profileNameInput: null,
  profileUsernameInput: null,
  btnTogglePassword: null,
  passwordEditContainer: null,
  profileNewPasswordInput: null,
  profileSuccessMsg: null,
  profileErrorMsg: null,
  btnSaveProfile: null,

  // Estado
  currentUserId: null,
  selectedAvatarFile: null,

  init() {
    this.dashboardContent = document.getElementById('dashboard-content');
    this.profileSettingsView = document.getElementById('profile-settings');
    this.btnProfileToggle = document.getElementById('btn-profile-toggle');
    this.btnCancelProfile = document.getElementById('btn-cancel-profile');
    this.mainHeaderIsland = document.getElementById('main-header-island');
    
    this.headerUserName = document.getElementById('header-user-name');
    this.headerUserHandle = document.getElementById('header-user-handle');
    this.headerAvatar = document.getElementById('header-avatar');

    this.profileForm = document.getElementById('profile-form');
    this.profileAvatarFile = document.getElementById('profile-avatar-file');
    this.profileAvatarPreview = document.getElementById('profile-avatar-preview');
    this.profileNameInput = document.getElementById('profile-name');
    this.profileUsernameInput = document.getElementById('profile-username');
    this.btnTogglePassword = document.getElementById('btn-toggle-password');
    this.passwordEditContainer = document.getElementById('password-edit-container');
    this.profileNewPasswordInput = document.getElementById('profile-new-password');
    this.profileSuccessMsg = document.getElementById('profile-success-msg');
    this.profileErrorMsg = document.getElementById('profile-error-msg');
    this.btnSaveProfile = document.getElementById('btn-save-profile');

    this.setupListeners();
  },

  setupListeners() {
    this.btnProfileToggle?.addEventListener('click', () => {
      this.toggleProfileSettings(true);
    });

    this.btnCancelProfile?.addEventListener('click', () => {
      this.toggleProfileSettings(false);
    });

    this.btnTogglePassword?.addEventListener('click', () => {
      this.passwordEditContainer?.classList.toggle('hidden');
      if(!this.passwordEditContainer.classList.contains('hidden')){
        this.profileNewPasswordInput?.focus();
      }
    });

    // Abre o seletor de arquivo ao clicar no avatar
    const avatarContainer = document.getElementById('avatar-upload-container');
    avatarContainer?.addEventListener('click', () => {
      this.profileAvatarFile?.click();
    });

    this.profileAvatarFile?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.selectedAvatarFile = file;
        this.profileAvatarPreview.src = URL.createObjectURL(file);
      }
    });

    this.profileNameInput?.addEventListener('input', (e) => {
      // Altera o preview do avatar se o nome for alterado (UI Avatars)
      if(!this.selectedAvatarFile && this.profileAvatarPreview.src.includes('ui-avatars')) {
         this.profileAvatarPreview.src = `https://ui-avatars.com/api/?name=${e.target.value || 'User'}&background=F5F5F7&color=1D1D1F`;
      }
    });

    this.profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearMessages();
      this.setLoading(true);

      const name = this.profileNameInput.value;
      const newPassword = this.profileNewPasswordInput.value;
      let finalAvatarUrl = this.profileAvatarPreview.src;

      try {
        // Se houver um arquivo, faz upload via Supabase Storage
        if (this.selectedAvatarFile) {
          finalAvatarUrl = await authService.uploadAvatar(this.currentUserId, this.selectedAvatarFile);
        }

        // Atualiza tabela de perfis
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: name, avatar_url: finalAvatarUrl })
          .eq('id', this.currentUserId);

        if (profileError) throw profileError;

        // Atualiza Auth se tiver senha
        if (newPassword && newPassword.length >= 6) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: newPassword
          });
          if (passwordError) throw passwordError;
          this.profileNewPasswordInput.value = ''; // Limpa após sucesso
        }

        this.showSuccess('Perfil atualizado com sucesso!');
        this.updateHeaderUI(name, this.profileUsernameInput.value, finalAvatarUrl);
        
        // Reseta campo de arquvo
        this.selectedAvatarFile = null;
        if(this.profileAvatarFile) this.profileAvatarFile.value = '';
        this.passwordEditContainer?.classList.add('hidden');

      } catch(error) {
        this.showError(`Erro ao atualizar: ${error.message}`);
      } finally {
        this.setLoading(false);
      }
    });
  },

  async loadProfileData(userSession) {
    if (!userSession) return;
    this.currentUserId = userSession.user.id;
    
    // Obter perfil do banco
    const profile = await authService.getProfile(this.currentUserId);
    
    if (profile) {
      const name = profile.display_name || userSession.user.user_metadata?.full_name || userSession.user.email?.split('@')[0] || 'User';
      const username = profile.username || `user_${this.currentUserId.substring(0, 8)}`;
      const avatarUrl = profile.avatar_url || userSession.user.user_metadata?.avatar_url;
      
      this.updateHeaderUI(name, username, avatarUrl);
      
      // Preencher form
      if (this.profileNameInput) this.profileNameInput.value = name;
      if (this.profileUsernameInput) this.profileUsernameInput.value = username;
      
      if (avatarUrl && this.profileAvatarPreview) {
        this.profileAvatarPreview.src = avatarUrl;
      } else if (this.profileAvatarPreview) {
        this.profileAvatarPreview.src = `https://ui-avatars.com/api/?name=${name}&background=F5F5F7&color=1D1D1F`;
      }
    }
  },

  updateHeaderUI(name, username, avatarUrl) {
    if (this.headerUserName) this.headerUserName.textContent = name;
    if (this.headerUserHandle) this.headerUserHandle.textContent = `@${username}`;
    
    if (this.headerAvatar) {
      if (avatarUrl && !avatarUrl.includes('ui-avatars')) {
        this.headerAvatar.src = avatarUrl;
      } else {
        this.headerAvatar.src = `https://ui-avatars.com/api/?name=${name}&background=F5F5F7&color=1D1D1F`;
      }
    }
  },

  toggleProfileSettings(show) {
    this.clearMessages();
    if (show) {
      this.dashboardContent?.classList.add('hidden');
      this.mainHeaderIsland?.classList.add('hidden');
      this.profileSettingsView?.classList.remove('hidden');
      this.profileSettingsView?.classList.add('fade-in');
    } else {
      this.profileSettingsView?.classList.add('hidden');
      this.dashboardContent?.classList.remove('hidden');
      this.mainHeaderIsland?.classList.remove('hidden');
      this.dashboardContent?.classList.add('fade-in');
    }
  },

  setLoading(isLoading) {
    if (!this.btnSaveProfile) return;
    if (isLoading) {
      this.btnSaveProfile.disabled = true;
      this.btnSaveProfile.textContent = 'Salvando...';
      this.btnSaveProfile.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      this.btnSaveProfile.disabled = false;
      this.btnSaveProfile.textContent = 'Salvar Alterações';
      this.btnSaveProfile.classList.remove('opacity-50', 'cursor-not-allowed');
    }
  },

  showSuccess(msg) {
    if(this.profileSuccessMsg) {
      this.profileSuccessMsg.textContent = msg;
      this.profileSuccessMsg.classList.remove('hidden');
    }
  },

  showError(msg) {
    if(this.profileErrorMsg) {
      this.profileErrorMsg.textContent = msg;
      this.profileErrorMsg.classList.remove('hidden');
    }
  },

  clearMessages() {
    if(this.profileErrorMsg) this.profileErrorMsg.classList.add('hidden');
    if(this.profileSuccessMsg) this.profileSuccessMsg.classList.add('hidden');
  }

};
