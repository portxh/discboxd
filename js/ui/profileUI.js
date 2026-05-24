import { authService } from '../services/authService.js';
import { supabase } from '../config/supabase.js';

// Camada de UI do Perfil: Gerencia o painel de configurações e dados do usuário

export const profileUI = {

  // Elementos do Dashboard
  dashboardContent: null,
  profileSettingsModal: null,
  btnProfileToggle: null,
  btnCancelProfile: null,
  btnCloseProfileModal: null,
  mainHeaderIsland: null,

  // Elementos do Header
  headerUserName: null,
  headerUserHandle: null,
  headerAvatar: null,

  // Formulário de Perfil
  profileForm: null,
  profileAvatarFile: null,
  profileAvatarPreview: null,
  profileUsernameInput: null,
  profileBioInput: null,
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
    this.profileSettingsModal = document.getElementById('profile-settings-modal');
    this.btnProfileToggle = document.getElementById('btn-profile-toggle');
    this.btnCancelProfile = document.getElementById('btn-cancel-profile');
    this.btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
    this.mainHeaderIsland = document.getElementById('main-header-island');

    this.headerUserName = document.getElementById('header-user-name');
    this.headerUserHandle = document.getElementById('header-user-handle');
    this.headerAvatar = document.getElementById('header-avatar');

    this.profileForm = document.getElementById('profile-form');
    this.profileAvatarFile = document.getElementById('profile-avatar-file');
    this.profileAvatarPreview = document.getElementById('profile-avatar-preview');
    this.profileNameInput = document.getElementById('profile-name');
    this.profileUsernameInput = document.getElementById('profile-username');
    this.profileBioInput = document.getElementById('profile-bio');
    this.btnTogglePassword = document.getElementById('btn-toggle-password');
    this.passwordEditContainer = document.getElementById('password-edit-container');
    this.profileNewPasswordInput = document.getElementById('profile-new-password');
    this.profileSuccessMsg = document.getElementById('profile-success-msg');
    this.profileErrorMsg = document.getElementById('profile-error-msg');
    this.btnSaveProfile = document.getElementById('btn-save-profile');

    // Notificações
    this.btnNotificationsToggle = document.getElementById('btn-notifications-toggle');
    this.notificationsDropdown = document.getElementById('notifications-dropdown');
    this.notificationsList = document.getElementById('notifications-list');
    this.notificationsBadge = document.getElementById('notifications-badge');

    this.setupListeners();
  },

  setupListeners() {
    this.btnProfileToggle?.addEventListener('click', async () => {
      const { communityUI } = await import('./communityUI.js');
      communityUI.switchTab('profile');
      this.loadProfileView();
    });

    const btnEditProfileHeader = document.getElementById('btn-edit-profile-header');
    btnEditProfileHeader?.addEventListener('click', () => {
      this.toggleProfileSettings(true);
    });

    const btnOpenProfileSettings = document.getElementById('btn-open-profile-settings');
    btnOpenProfileSettings?.addEventListener('click', () => {
      this.toggleProfileSettings(true);
    });

    this.btnCancelProfile?.addEventListener('click', () => {
      this.toggleProfileSettings(false);
    });

    this.btnCloseProfileModal?.addEventListener('click', () => {
      this.toggleProfileSettings(false);
    });

    this.btnTogglePassword?.addEventListener('click', () => {
      this.passwordEditContainer?.classList.toggle('hidden');
      if (!this.passwordEditContainer.classList.contains('hidden')) {
        this.profileNewPasswordInput?.focus();
      }
    });

    // Notificações Toggle
    this.btnNotificationsToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.notificationsDropdown?.classList.toggle('hidden');
      if (!this.notificationsDropdown?.classList.contains('hidden')) {
        this.loadNotifications();
        this.notificationsBadge?.classList.add('hidden'); // Limpa o badge ao abrir
      }
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (this.notificationsDropdown && !this.notificationsDropdown.contains(e.target) && !this.btnNotificationsToggle.contains(e.target)) {
        this.notificationsDropdown.classList.add('hidden');
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
      if (!this.selectedAvatarFile && this.profileAvatarPreview.src.includes('ui-avatars')) {
        this.profileAvatarPreview.src = `https://ui-avatars.com/api/?name=${e.target.value || 'User'}&background=F5F5F7&color=1D1D1F`;
      }
    });

    this.profileForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.clearMessages();
      this.setLoading(true);

      const name = this.profileNameInput.value;
      const newPassword = this.profileNewPasswordInput.value;
      const bio = this.profileBioInput ? this.profileBioInput.value : '';
      let finalAvatarUrl = this.profileAvatarPreview.src;

      try {
        // Se houver um arquivo, faz upload via Supabase Storage
        if (this.selectedAvatarFile) {
          finalAvatarUrl = await authService.uploadAvatar(this.currentUserId, this.selectedAvatarFile);
        }

        // Atualiza tabela de perfis
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ display_name: name, avatar_url: finalAvatarUrl, bio: bio })
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
        if (this.profileAvatarFile) this.profileAvatarFile.value = '';
        this.passwordEditContainer?.classList.add('hidden');

      } catch (error) {
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
      if (this.profileBioInput) this.profileBioInput.value = profile.bio || '';

      if (avatarUrl && this.profileAvatarPreview) {
        this.profileAvatarPreview.src = avatarUrl;
      } else if (this.profileAvatarPreview) {
        this.profileAvatarPreview.src = `https://ui-avatars.com/api/?name=${name}&background=F5F5F7&color=1D1D1F`;
      }

      // Ao carregar os dados, tenta buscar notificações iniciais para mostrar o badge
      this.checkNewNotifications();
    }
  },

  async checkNewNotifications() {
    if (!this.currentUserId) return;
    const { socialService } = await import('../services/socialService.js');
    const notifs = await socialService.getNotifications(this.currentUserId);
    if (!notifs || notifs.length === 0) return;

    const lastRead = localStorage.getItem(`discboxd_notif_read_${this.currentUserId}`) || '1970-01-01T00:00:00Z';
    const hasNew = notifs.some(n => new Date(n.created_at) > new Date(lastRead));
    if (hasNew) {
      this.notificationsBadge?.classList.remove('hidden');
    }
  },

  async loadNotifications() {
    if (!this.currentUserId || !this.notificationsList) return;

    this.notificationsList.innerHTML = '<div class="p-4 text-center text-xs text-gray-400">Carregando...</div>';

    const { socialService } = await import('../services/socialService.js');
    const notifs = await socialService.getNotifications(this.currentUserId);

    this.notificationsList.innerHTML = '';

    if (!notifs || notifs.length === 0) {
      this.notificationsList.innerHTML = '<div class="p-4 text-center text-xs text-gray-400">Nenhuma notificação</div>';
      return;
    }

    // Marca timestamp de leitura
    const lastRead = localStorage.getItem(`discboxd_notif_read_${this.currentUserId}`) || '1970-01-01T00:00:00Z';
    localStorage.setItem(`discboxd_notif_read_${this.currentUserId}`, new Date().toISOString());

    notifs.forEach(n => {
      const isUnread = new Date(n.created_at) > new Date(lastRead);
      const div = document.createElement('div');
      div.className = `flex gap-3 p-3 border-b border-gray-50/50 hover:bg-gray-50 transition-colors items-start ${n.type !== 'follow' ? 'cursor-pointer' : ''} ${isUnread ? 'bg-blue-50/40' : ''}`;

      const avatar = n.profile.avatar_url || `https://ui-avatars.com/api/?name=${n.profile.display_name}&background=E5E5EA&color=1D1D1F`;
      const dateStr = new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      const albumName = n.album ? n.album.title : '';

      const escapeHTML = (str) => {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
      };
      
      let text = '';
      let icon = '';
      if (n.type === 'like') {
        icon = '<span class="text-red-500">❤️</span>';
        const suffix = albumName ? ' de <span class="font-semibold text-[var(--accent)]">' + escapeHTML(albumName) + '</span>' : '';
        text = '<span class="font-bold text-[var(--text-primary)]">' + escapeHTML(n.profile.display_name) + '</span> curtiu sua resenha' + suffix + '.';
      } else if (n.type === 'comment') {
        icon = '<span class="text-blue-500">💬</span>';
        const suffix = albumName ? ' em <span class="font-semibold text-[var(--accent)]">' + escapeHTML(albumName) + '</span>' : '';
        text = '<span class="font-bold text-[var(--text-primary)]">' + escapeHTML(n.profile.display_name) + '</span> comentou' + suffix + ': "' + escapeHTML(n.content) + '"';
      } else if (n.type === 'follow') {
        icon = '<span class="text-green-500">👤</span>';
        text = '<span class="font-bold text-[var(--text-primary)]">' + escapeHTML(n.profile.display_name) + '</span> começou a te seguir.';
      }

      const img = document.createElement('img');
      img.src = avatar;
      img.className = 'w-8 h-8 rounded-full object-cover shadow-sm shrink-0';
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'flex-1 min-w-0';
      
      const pText = document.createElement('p');
      pText.className = 'text-xs text-gray-600 leading-tight';
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(icon + ' ' + text, 'text/html');
      while (doc.body.firstChild) {
        pText.appendChild(doc.body.firstChild);
      }
      
      const pDate = document.createElement('p');
      pDate.className = 'text-[10px] text-gray-400 mt-1';
      pDate.textContent = dateStr;
      
      contentDiv.appendChild(pText);
      contentDiv.appendChild(pDate);
      
      div.replaceChildren(img, contentDiv);

      // Navegar para a resenha no feed ao clicar
      if ((n.type === 'like' || n.type === 'comment') && n.collection_id) {
        div.addEventListener('click', async () => {
          this.notificationsDropdown?.classList.add('hidden');
          const { communityUI } = await import('./communityUI.js');
          await communityUI.navigateToPost(n.collection_id);
        });
      }

      this.notificationsList.appendChild(div);
    });
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
      this.profileSettingsModal?.classList.remove('hidden');
    } else {
      this.profileSettingsModal?.classList.add('hidden');
    }
  },

  async loadProfileView() {
    if (!this.currentUserId) return;
    
    const viewName = document.getElementById('profile-view-name');
    const viewUsername = document.getElementById('profile-view-username');
    const viewBio = document.getElementById('profile-view-bio');
    const viewAvatar = document.getElementById('profile-view-avatar');
    
    const profile = await authService.getProfile(this.currentUserId);
    if (profile) {
      const name = profile.display_name || 'Usuário';
      if (viewName) viewName.textContent = name;
      if (viewUsername) viewUsername.textContent = `@${profile.username || 'usuario'}`;
      if (viewBio) viewBio.textContent = profile.bio || '';
      if (viewAvatar) viewAvatar.src = profile.avatar_url || `https://ui-avatars.com/api/?name=${name}&background=F5F5F7&color=1D1D1F`;
    }

    const { socialService } = await import('../services/socialService.js');
    const stats = await socialService.getUserStats(this.currentUserId);
    const statAlbums = document.getElementById('profile-stat-albums');
    const statArtist = document.getElementById('profile-stat-artist');
    if (statAlbums) statAlbums.textContent = stats.total || 0;
    if (statArtist) statArtist.textContent = stats.topArtist || 'Nenhum';

    this.loadPersonalFeed();
  },

  async loadPersonalFeed() {
    const feedContainer = document.getElementById('personal-feed-container');
    const loading = document.getElementById('personal-feed-loading');
    if (!feedContainer || !loading) return;
    
    feedContainer.innerHTML = '';
    loading.classList.remove('hidden');

    const { socialService } = await import('../services/socialService.js');
    const feedData = await socialService.getUserFeed(this.currentUserId, 1, 50);
    
    loading.classList.add('hidden');
    
    if (!feedData || feedData.length === 0) {
      feedContainer.innerHTML = '<div class="text-center py-12 text-gray-500">Nenhuma atividade recente encontrada. Comece avaliando alguns álbuns!</div>';
      return;
    }

    const { communityUI } = await import('./communityUI.js');
    for (const item of feedData) {
      const card = await communityUI.createFeedCard(item);
      if (card) feedContainer.appendChild(card);
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
    if (this.profileSuccessMsg) {
      this.profileSuccessMsg.textContent = msg;
      this.profileSuccessMsg.classList.remove('hidden');
    }
  },

  showError(msg) {
    if (this.profileErrorMsg) {
      this.profileErrorMsg.textContent = msg;
      this.profileErrorMsg.classList.remove('hidden');
    }
  },

  clearMessages() {
    if (this.profileErrorMsg) this.profileErrorMsg.classList.add('hidden');
    if (this.profileSuccessMsg) this.profileSuccessMsg.classList.add('hidden');
  }

};
