import { adminService } from '../services/adminService.js';

export const adminUI = {
  isAdmin: false,
  isInitialized: false,
  elements: {
    btnAdminPanel: document.getElementById('btn-admin-panel'),
    modal: document.getElementById('admin-panel-modal'),
    btnClose: document.getElementById('btn-close-admin-modal'),
    tabs: document.querySelectorAll('.admin-tab-btn'),
    tabContents: document.querySelectorAll('.admin-tab-content'),
    
    // Stats
    statUsers: document.getElementById('admin-stat-users'),
    statAlbums: document.getElementById('admin-stat-albums'),
    statComments: document.getElementById('admin-stat-comments'),
    
    // Moderation
    reviewsList: document.getElementById('admin-reviews-list'),
    reviewsLoading: document.getElementById('admin-reviews-loading'),
    btnRefreshReviews: document.getElementById('admin-refresh-reviews'),
    
    // Users
    usersList: document.getElementById('admin-users-list'),
    usersLoading: document.getElementById('admin-users-loading'),
    btnRefreshUsers: document.getElementById('admin-refresh-users')
  },

  async init(session) {
    if (!session) return;
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // 1. Verifica se o usuário é admin
    this.isAdmin = await adminService.checkAdminStatus(session.user.id);
    
    // 2. Se for admin, exibe o botão no header e configura os listeners
    if (this.isAdmin && this.elements.btnAdminPanel) {
      this.elements.btnAdminPanel.classList.remove('hidden');
      this.setupListeners();
    }
  },

  setupListeners() {
    // Abrir Modal
    this.elements.btnAdminPanel.addEventListener('click', () => {
      this.elements.modal.classList.remove('hidden');
      this.loadTab('stats'); // Default tab
    });

    // Fechar Modal
    this.elements.btnClose.addEventListener('click', () => {
      this.elements.modal.classList.add('hidden');
    });

    // Fechar Modal no clique fora
    this.elements.modal.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.elements.modal.classList.add('hidden');
      }
    });

    // Alternar Abas
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Botões de Refresh
    this.elements.btnRefreshReviews.addEventListener('click', () => this.loadReviews());
    this.elements.btnRefreshUsers.addEventListener('click', () => this.loadUsers());
  },

  switchTab(tabName) {
    // Atualizar UI das abas
    this.elements.tabs.forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active', 'border-purple-600', 'text-purple-600');
        t.classList.remove('border-transparent', 'text-gray-500');
      } else {
        t.classList.remove('active', 'border-purple-600', 'text-purple-600');
        t.classList.add('border-transparent', 'text-gray-500');
      }
    });

    // Mostrar conteúdo da aba
    this.elements.tabContents.forEach(content => {
      if (content.id === `admin-tab-${tabName}`) {
        content.classList.remove('hidden');
      } else {
        content.classList.add('hidden');
      }
    });

    // Carregar dados da aba
    this.loadTab(tabName);
  },

  async loadTab(tabName) {
    if (tabName === 'stats') {
      await this.loadStats();
    } else if (tabName === 'moderation') {
      await this.loadReviews();
    } else if (tabName === 'users') {
      await this.loadUsers();
    }
  },

  // ==========================================
  // LÓGICA DAS ABAS
  // ==========================================

  async loadStats() {
    this.elements.statUsers.textContent = '...';
    this.elements.statAlbums.textContent = '...';
    this.elements.statComments.textContent = '...';

    const stats = await adminService.fetchGlobalStats();
    
    this.elements.statUsers.textContent = stats.users;
    this.elements.statAlbums.textContent = stats.collection;
    this.elements.statComments.textContent = stats.comments;
  },

  async loadReviews() {
    this.elements.reviewsList.innerHTML = '';
    this.elements.reviewsLoading.classList.remove('hidden');

    const reviews = await adminService.fetchReviewsAdmin();
    this.elements.reviewsLoading.classList.add('hidden');

    if (reviews.length === 0) {
      this.elements.reviewsList.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">Nenhuma resenha encontrada.</td></tr>`;
      return;
    }

    reviews.forEach(item => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-gray-50 transition-colors group";
      
      const avatar = item.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User';
      const username = item.profiles?.username || 'user';
      
      tr.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <img src="${avatar}" class="h-6 w-6 rounded-full object-cover">
            <span class="font-medium">@${username}</span>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="font-semibold text-gray-900 truncate max-w-[150px]" title="${item.album_name}">${item.album_name}</div>
          <div class="text-xs text-gray-500 truncate max-w-[150px]" title="${item.artist_name}">${item.artist_name}</div>
        </td>
        <td class="px-4 py-3 text-gray-600 max-w-[250px] truncate" title="${item.review}">
          "${item.review}"
        </td>
        <td class="px-4 py-3 text-right">
          <button class="btn-delete-review text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity" data-id="${item.id}">
            Excluir
          </button>
        </td>
      `;

      this.elements.reviewsList.appendChild(tr);
    });

    // Adicionar Listeners de Exclusão
    document.querySelectorAll('.btn-delete-review').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm('Tem certeza que deseja apagar esta resenha? Esta ação não pode ser desfeita.')) {
          const originalText = e.target.textContent;
          e.target.textContent = '...';
          e.target.disabled = true;
          
          try {
            await adminService.deleteReviewAdmin(id);
            this.loadReviews(); // Recarrega a lista
          } catch (err) {
            alert('Erro ao excluir resenha.');
            e.target.textContent = originalText;
            e.target.disabled = false;
          }
        }
      });
    });
  },

  async loadUsers() {
    this.elements.usersList.innerHTML = '';
    this.elements.usersLoading.classList.remove('hidden');

    const users = await adminService.fetchUsersAdmin();
    this.elements.usersLoading.classList.add('hidden');

    if (users.length === 0) {
      this.elements.usersList.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>`;
      return;
    }

    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.className = "hover:bg-gray-50 transition-colors";
      
      const avatar = user.avatar_url || 'https://ui-avatars.com/api/?name=User';
      const date = new Date(user.created_at).toLocaleDateString('pt-BR');
      
      const statusBadge = user.is_banned 
        ? `<span class="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Banido</span>`
        : `<span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">Ativo</span>`;
      
      const adminBadge = user.is_admin ? `<span class="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded uppercase">Admin</span>` : '';

      tr.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <img src="${avatar}" class="h-8 w-8 rounded-full object-cover">
            <div>
              <div class="font-medium text-gray-900 flex items-center">${user.display_name} ${adminBadge}</div>
              <div class="text-xs text-gray-500">@${user.username}</div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-xs text-gray-500">${date}</td>
        <td class="px-4 py-3 text-center">${statusBadge}</td>
        <td class="px-4 py-3 text-right">
          ${!user.is_admin ? `
            <button class="btn-toggle-ban text-xs font-bold ${user.is_banned ? 'text-green-600 hover:text-green-800' : 'text-red-500 hover:text-red-700'} px-2 py-1 rounded transition-colors" data-id="${user.id}" data-banned="${user.is_banned}">
              ${user.is_banned ? 'Desbanir' : 'Banir'}
            </button>
          ` : '<span class="text-xs text-gray-400 italic">Protegido</span>'}
        </td>
      `;

      this.elements.usersList.appendChild(tr);
    });

    // Adicionar Listeners de Banimento
    document.querySelectorAll('.btn-toggle-ban').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const isBanned = e.target.dataset.banned === 'true';
        const action = isBanned ? 'desbanir' : 'banir';
        
        if (confirm(`Tem certeza que deseja ${action} este usuário?`)) {
          const originalText = e.target.textContent;
          e.target.textContent = '...';
          e.target.disabled = true;
          
          try {
            await adminService.toggleUserBan(id, isBanned);
            this.loadUsers(); // Recarrega a lista
          } catch (err) {
            alert(`Erro ao ${action} usuário.`);
            e.target.textContent = originalText;
            e.target.disabled = false;
          }
        }
      });
    });
  }
};
