import { collectionService } from '../services/collectionService.js';
import { socialService } from '../services/socialService.js';
import { authService } from '../services/authService.js';
import { catalogUI } from './catalogUI.js';

export const communityUI = {
  tabCollection: null,
  tabCommunity: null,
  tabCollectionMobile: null,
  tabCommunityMobile: null,
  tabUsers: null,

  viewCollection: null,
  viewCommunity: null,
  viewUsers: null,

  communityFeedContainer: null,
  communityLoading: null,
  exploreGrid: null,
  exploreLoading: null,

  feedFollowingSection: null,
  feedExploreSection: null,
  btnFeedFollowing: null,
  btnFeedExplore: null,

  userSearchInput: null,
  userSearchResults: null,
  searchTimeout: null,
  currentUserId: null,

  // Paginação
  followingFeedPage: 1,
  hasMoreFeed: true,
  btnLoadMoreFeed: null,

  // Filtros Explorar
  exploreFilters: null,
  exploreTimeRange: null,
  currentExploreSort: 'mostCollected',
  exploreData: { mostCollected: [], highestRated: [], newReleases: [] },

  // User Modal
  userPreviewModal: null,
  btnCloseUserPreview: null,
  btnPreviewFollow: null,
  previewAvatar: null,
  previewName: null,
  previewUsername: null,
  previewBio: null,
  previewAlbumsCount: null,
  previewTopArtist: null,

  init() {
    this.tabCollection = document.getElementById('tab-collection');
    this.tabCommunity = document.getElementById('tab-community');
    this.tabCollectionMobile = document.getElementById('tab-collection-mobile');
    this.tabCommunityMobile = document.getElementById('tab-community-mobile');
    this.tabUsers = document.getElementById('tab-users');

    this.viewCollection = document.getElementById('view-my-collection');
    this.viewCommunity = document.getElementById('view-community');
    this.viewUsers = document.getElementById('view-users');
    this.viewProfile = document.getElementById('view-profile');

    this.communityFeedContainer = document.getElementById('community-feed-container');
    this.communityLoading = document.getElementById('community-loading');
    this.exploreGrid = document.getElementById('explore-grid');
    this.exploreLoading = document.getElementById('explore-loading');

    this.feedFollowingSection = document.getElementById('community-following-feed');
    this.feedExploreSection = document.getElementById('community-explore-feed');
    this.btnFeedFollowing = document.getElementById('btn-feed-following');
    this.btnFeedExplore = document.getElementById('btn-feed-explore');

    this.btnLoadMoreFeed = document.createElement('button');
    this.btnLoadMoreFeed.className = 'apple-btn-secondary w-full py-3 mt-4 hidden';
    this.btnLoadMoreFeed.textContent = 'Carregar mais atividades';
    this.feedFollowingSection?.appendChild(this.btnLoadMoreFeed);

    this.userSearchInput = document.getElementById('user-search-input');
    this.userSearchResults = document.getElementById('user-search-results');

    this.exploreFilters = document.getElementById('explore-filters');
    this.exploreTimeRange = document.getElementById('explore-time-range');

    this.userPreviewModal = document.getElementById('user-preview-modal');
    this.btnCloseUserPreview = document.getElementById('btn-close-user-preview');
    this.btnPreviewFollow = document.getElementById('btn-preview-follow');
    this.previewAvatar = document.getElementById('preview-avatar');
    this.previewName = document.getElementById('preview-name');
    this.previewUsername = document.getElementById('preview-username');
    this.previewBio = document.getElementById('preview-bio');
    this.previewAlbumsCount = document.getElementById('preview-albums-count');
    this.previewTopArtist = document.getElementById('preview-top-artist');

    this.setupListeners();
    this.loadSession();
  },

  async loadSession() {
    const session = await authService.getSession();
    if (session) {
      this.currentUserId = session.user.id;
      // Carregar a sidebar/mobile logo que tiver o usuário logado
      this.loadFriendsSidebar();
    }
  },

  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  parseHTML(htmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlStr, 'text/html');
    const frag = document.createDocumentFragment();
    while (doc.body.firstChild) {
      frag.appendChild(doc.body.firstChild);
    }
    return frag;
  },

  setupListeners() {
    // Tabs — Desktop Sidebar
    this.tabCollection?.addEventListener('click', () => this.switchTab('collection'));
    this.tabCommunity?.addEventListener('click', () => {
      this.switchTab('community');
      this.switchCommunityView('following');
    });
    // Tabs — Mobile Bottom Bar
    this.tabCollectionMobile?.addEventListener('click', () => this.switchTab('collection'));
    this.tabCommunityMobile?.addEventListener('click', () => {
      this.switchTab('community');
      this.switchCommunityView('following');
    });
    this.tabUsers?.addEventListener('click', () => this.switchTab('users'));

    // Community Sub-tabs
    this.btnFeedFollowing?.addEventListener('click', () => this.switchCommunityView('following'));
    this.btnFeedExplore?.addEventListener('click', () => this.switchCommunityView('explore'));

    // User Search
    this.userSearchInput?.addEventListener('focus', () => {
      this.viewCommunity?.classList.add('hidden');
      this.viewUsers?.classList.remove('hidden');
    });

    this.userSearchInput?.addEventListener('blur', (e) => {
      if (e.target.value.trim().length === 0) {
        this.viewCommunity?.classList.remove('hidden');
        this.viewUsers?.classList.add('hidden');
      }
    });

    this.userSearchInput?.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length === 0) {
        this.viewCommunity?.classList.remove('hidden');
        this.viewUsers?.classList.add('hidden');
        if (this.userSearchResults) this.userSearchResults.innerHTML = '';
        return;
      }

      this.viewCommunity?.classList.add('hidden');
      this.viewUsers?.classList.remove('hidden');

      if (query.length < 3) {
        if (this.userSearchResults) {
          this.userSearchResults.innerHTML = '<p class="col-span-full text-center text-[var(--text-secondary)] py-4">Digite pelo menos 3 caracteres para buscar...</p>';
        }
        return;
      }

      this.searchTimeout = setTimeout(() => this.performUserSearch(query), 400);
    });

    // Explore Filters
    const filterBtns = document.querySelectorAll('.explore-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => {
          b.classList.remove('bg-[var(--accent)]', 'text-white', 'shadow-sm', 'active');
          b.classList.add('text-gray-500', 'hover:bg-gray-100');
        });
        const target = e.target;
        target.classList.remove('text-gray-500', 'hover:bg-gray-100');
        target.classList.add('bg-[var(--accent)]', 'text-white', 'shadow-sm', 'active');

        this.currentExploreSort = target.dataset.exploreSort;
        this.renderExploreGrid();
      });
    });

    this.exploreTimeRange?.addEventListener('change', () => {
      this.loadExploreFeed();
    });

    // Load More
    this.btnLoadMoreFeed?.addEventListener('click', () => {
      this.followingFeedPage++;
      this.loadFollowingFeed(true);
    });

    // User Preview Modal
    this.btnCloseUserPreview?.addEventListener('click', () => {
      this.userPreviewModal?.classList.add('hidden');
    });
  },

  switchTab(tab) {
    // Reset all tabs (desktop sidebar + mobile bottom bar)
    [this.tabCollection, this.tabCommunity].forEach(t => {
      if (!t) return;
      t.classList.remove('active');
    });
    [this.tabCollectionMobile, this.tabCommunityMobile].forEach(t => {
      if (!t) return;
      t.classList.remove('active');
    });

    // Hide all views
    if (this.viewCollection) this.viewCollection.classList.add('hidden');
    if (this.viewCommunity) this.viewCommunity.classList.add('hidden');
    if (this.viewUsers) this.viewUsers.classList.add('hidden');
    if (this.viewProfile) this.viewProfile.classList.add('hidden');

    const headerCollectionSearch = document.getElementById('header-collection-search');
    const headerUsersSearch = document.getElementById('header-users-search');

    // Activate selected
    if (tab === 'collection') {
      this.tabCollection?.classList.add('active');
      this.tabCollectionMobile?.classList.add('active');
      this.viewCollection?.classList.remove('hidden');
      
      headerCollectionSearch?.classList.remove('hidden');
      headerCollectionSearch?.classList.add('flex');
      headerUsersSearch?.classList.add('hidden');
      headerUsersSearch?.classList.remove('flex');
    } else if (tab === 'community') {
      this.tabCommunity?.classList.add('active');
      this.tabCommunityMobile?.classList.add('active');
      
      if (this.userSearchInput && this.userSearchInput.value.trim().length > 0) {
        this.viewUsers?.classList.remove('hidden');
      } else {
        this.viewCommunity?.classList.remove('hidden');
      }
      
      headerCollectionSearch?.classList.add('hidden');
      headerCollectionSearch?.classList.remove('flex');
      headerUsersSearch?.classList.remove('hidden');
      headerUsersSearch?.classList.add('flex');
    } else if (tab === 'profile') {
      this.viewProfile?.classList.remove('hidden');
      
      headerCollectionSearch?.classList.add('hidden');
      headerCollectionSearch?.classList.remove('flex');
      headerUsersSearch?.classList.add('hidden');
      headerUsersSearch?.classList.remove('flex');
    }
  },

  switchCommunityView(view) {
    if (view === 'following') {
      this.btnFeedFollowing.classList.replace('text-gray-500', 'text-[var(--text-primary)]');
      this.btnFeedFollowing.classList.replace('hover:text-gray-700', 'bg-white');
      this.btnFeedFollowing.classList.add('shadow-sm');

      this.btnFeedExplore.classList.replace('text-[var(--text-primary)]', 'text-gray-500');
      this.btnFeedExplore.classList.replace('bg-white', 'hover:text-gray-700');
      this.btnFeedExplore.classList.remove('shadow-sm');

      this.feedFollowingSection.classList.remove('hidden');
      this.feedExploreSection.classList.add('hidden');
      if (this.exploreFilters) this.exploreFilters.classList.add('hidden');
      if (this.followingFeedPage === 1) {
        this.loadFollowingFeed();
      }
    } else {
      this.btnFeedExplore.classList.replace('text-gray-500', 'text-[var(--text-primary)]');
      this.btnFeedExplore.classList.replace('hover:text-gray-700', 'bg-white');
      this.btnFeedExplore.classList.add('shadow-sm');

      this.btnFeedFollowing.classList.replace('text-[var(--text-primary)]', 'text-gray-500');
      this.btnFeedFollowing.classList.replace('bg-white', 'hover:text-gray-700');
      this.btnFeedFollowing.classList.remove('shadow-sm');

      this.feedExploreSection.classList.remove('hidden');
      this.feedFollowingSection.classList.add('hidden');
      if (this.exploreFilters) this.exploreFilters.classList.remove('hidden');
      this.loadExploreFeed();
    }
  },

  async loadFollowingFeed(append = false) {
    if (!this.communityFeedContainer || !this.currentUserId) return;

    if (!append) {
      this.communityFeedContainer.innerHTML = '';
      this.followingFeedPage = 1;
      this.hasMoreFeed = true;
    }

    if (!this.hasMoreFeed) return;

    if (this.communityLoading) this.communityLoading.classList.remove('hidden');
    if (this.btnLoadMoreFeed) this.btnLoadMoreFeed.classList.add('hidden');

    const feed = await socialService.getFollowingFeed(this.currentUserId, this.followingFeedPage, 10);

    if (this.communityLoading) this.communityLoading.classList.add('hidden');

    if (feed.length === 0 && !append) {
      this.communityFeedContainer.innerHTML = '<p class="text-center text-[var(--text-secondary)] py-8">Nenhuma atividade recente na comunidade.</p>';
      return;
    }

    if (feed.length < 10) {
      this.hasMoreFeed = false;
    } else {
      if (this.btnLoadMoreFeed) this.btnLoadMoreFeed.classList.remove('hidden');
    }

    for (const entry of feed) {
      const card = await this.createFeedCard(entry);
      if (card) this.communityFeedContainer.appendChild(card);
    }
  },

  async createFeedCard(entry) {
    const card = document.createElement('div');
    card.className = 'apple-card p-4 bg-white/80 backdrop-blur-md flex flex-col md:flex-row gap-4 mb-4 hover:shadow-lg transition-shadow';
    card.setAttribute('data-collection-id', entry.id);

    const avatar = entry.profile.avatar_url || `https://ui-avatars.com/api/?name=${entry.profile.display_name}&background=E5E5EA&color=1D1D1F`;
    const dateStr = new Date(entry.added_at).toLocaleDateString('pt-BR');

    let ratingHtml = '';
    if (entry.rating) {
      const starsStr = '★'.repeat(Math.floor(entry.rating)) + '☆'.repeat(5 - Math.floor(entry.rating));
      ratingHtml = '<div class="flex items-center text-yellow-400 text-sm mt-1">' + this.escapeHTML(starsStr) + '</div>';
    }

    // Load Likes info
    const likesInfo = await socialService.getLikesInfo(entry.id, this.currentUserId);
    const isLiked = likesInfo.userLiked;
    const likeCount = likesInfo.count;

    // Pre-load comments eagerly
    const initialComments = await socialService.getComments(entry.id);
    const commentCount = initialComments.length;

    card.replaceChildren(this.parseHTML(
      '<div class="flex-shrink-0 flex items-center gap-3 md:w-48">' +
        '<img src="' + this.escapeHTML(avatar) + '" alt="' + this.escapeHTML(entry.profile.display_name) + '" class="w-10 h-10 rounded-full object-cover shadow-sm">' +
        '<div class="min-w-0">' +
          '<p class="text-sm font-bold truncate">' + this.escapeHTML(entry.profile.display_name) + '</p>' +
          '<p class="text-[10px] text-[var(--text-secondary)] truncate">@' + this.escapeHTML(entry.profile.username) + '</p>' +
        '</div>' +
      '</div>' +
      
      '<div class="flex-1 flex flex-col gap-2">' +
        '<div class="flex gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 cursor-pointer group hover:bg-white hover:border-gray-200 transition-colors">' +
          '<img src="' + this.escapeHTML(entry.album.cover_url) + '" alt="' + this.escapeHTML(entry.album.title) + '" class="w-16 h-16 rounded-md object-cover shadow-sm">' +
          '<div class="flex-1 min-w-0 relative">' +
            '<h4 class="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate pr-8">' + this.escapeHTML(entry.album.title) + '</h4>' +
            '<p class="text-xs text-[var(--text-secondary)] truncate">' + this.escapeHTML(entry.album.artist) + '</p>' +
            ratingHtml +
            (entry.favorite_track ? '<p class="text-[10px] text-[var(--accent)] font-medium truncate mt-1">★ Destaque: ' + this.escapeHTML(entry.favorite_track) + '</p>' : '') +
            (entry.review ? '<p class="mt-2 text-sm italic text-gray-600 line-clamp-2">"' + this.escapeHTML(entry.review) + '"</p>' : '<p class="mt-1 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Adicionado em ' + dateStr + '</p>') +
          '</div>' +
        '</div>' +
        
        '<div class="flex justify-end px-2 gap-4">' +
          '<button class="btn-toggle-like text-[10px] font-bold transition-colors flex items-center gap-1 uppercase tracking-wider ' + (isLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500') + '">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 ' + (isLiked ? 'fill-current' : '') + '" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>' +
            '<span>' + (likeCount > 0 ? likeCount : 'Curtir') + '</span>' +
          '</button>' +
          '<button class="btn-toggle-comments text-[10px] font-bold text-gray-400 hover:text-[var(--accent)] transition-colors flex items-center gap-1 uppercase tracking-wider">' +
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>' +
            (commentCount > 0 ? commentCount + ' Comentários' : 'Comentar') +
          '</button>' +
        '</div>' +
        
        '<div class="comments-section ' + (commentCount > 0 ? '' : 'hidden') + ' mt-2 pt-3 border-t border-gray-100">' +
          '<div class="comments-list space-y-3 mb-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">' +
          '</div>' +
          '<div class="flex gap-2">' +
            '<input type="text" aria-label="Escreva um comentário sobre ' + this.escapeHTML(entry.album.title) + '" class="comment-input flex-1 apple-input py-1.5 px-3 text-xs bg-gray-50 border-gray-100" placeholder="Escreva um comentário...">' +
            '<button class="btn-send-comment bg-[var(--accent)] text-white px-3 rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors">Enviar</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    ));

    const albumSection = card.querySelector('.group');
    albumSection.addEventListener('click', async () => {
      const albumObj = {
        spotify_id: entry.album.spotify_id,
        title: entry.album.title,
        artist: entry.album.artist,
        cover_url: entry.album.cover_url,
        release_year: entry.album.release_year || ''
      };
      catalogUI.openAlbumDetail(albumObj, 'search');
    });

    // Likes Logic
    const btnLike = card.querySelector('.btn-toggle-like');
    let currentLiked = isLiked;
    let currentLikesCount = likeCount;

    btnLike.addEventListener('click', async (e) => {
      e.stopPropagation();
      btnLike.disabled = true;
      const res = await socialService.toggleLike(entry.id, this.currentUserId);
      if (res.success) {
        currentLiked = res.liked;
        currentLikesCount += currentLiked ? 1 : -1;

        btnLike.className = `btn-toggle-like text-[10px] font-bold transition-colors flex items-center gap-1 uppercase tracking-wider ${currentLiked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`;
        btnLike.replaceChildren(this.parseHTML(
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 ' + this.escapeHTML(currentLiked ? 'fill-current' : '') + '" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>' +
          '<span>' + this.escapeHTML(String(currentLikesCount > 0 ? currentLikesCount : 'Curtir')) + '</span>'
        ));
      }
      btnLike.disabled = false;
    });

    // Comments Logic
    const btnToggleComments = card.querySelector('.btn-toggle-comments');
    const commentsSection = card.querySelector('.comments-section');
    const commentsList = card.querySelector('.comments-list');
    const commentInput = card.querySelector('.comment-input');
    const btnSendComment = card.querySelector('.btn-send-comment');

    const renderComments = (comments) => {
      commentsList.innerHTML = '';
      if (comments.length === 0) {
        commentsList.innerHTML = '<p class="text-[10px] text-center text-gray-400 py-2">Seja o primeiro a comentar.</p>';
        return;
      }
      comments.forEach(c => {
        const cAvatar = c.profile.avatar_url || `https://ui-avatars.com/api/?name=${c.profile.display_name}&background=E5E5EA&color=1D1D1F`;
        const div = document.createElement('div');
        div.className = 'flex gap-2 items-start';
        div.replaceChildren(this.parseHTML(
          '<img src="' + this.escapeHTML(cAvatar) + '" alt="' + this.escapeHTML(c.profile.display_name) + '" class="w-6 h-6 rounded-full object-cover shrink-0">' +
          '<div class="bg-gray-50 rounded-xl p-2 px-3 flex-1 min-w-0">' +
            '<p class="text-[10px] font-bold text-[var(--text-primary)]">' + this.escapeHTML(c.profile.display_name) + '</p>' +
            '<p class="text-[11px] text-gray-600 mt-0.5 break-words">' + this.escapeHTML(c.content) + '</p>' +
          '</div>'
        ));
        commentsList.appendChild(div);
      });
      commentsList.scrollTop = commentsList.scrollHeight;
    };

    // Renderizar comentários imediatamente
    renderComments(initialComments);

    // Toggle apenas mostra/esconde a seção
    btnToggleComments.addEventListener('click', () => {
      commentsSection.classList.toggle('hidden');
      if (!commentsSection.classList.contains('hidden')) {
        commentInput.focus();
      }
    });

    const handleSendComment = async () => {
      const text = commentInput.value.trim();
      if (!text) return;
      btnSendComment.disabled = true;
      commentInput.disabled = true;

      const res = await socialService.addComment(entry.id, this.currentUserId, text);
      if (res.success) {
        commentInput.value = '';
        const comments = await socialService.getComments(entry.id);
        renderComments(comments);
        commentsSection.classList.remove('hidden');
        btnToggleComments.replaceChildren(this.parseHTML(
          '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>' +
          ' ' + comments.length + ' Comentários'
        ));
      } else {
        console.error('[Comentário] Falha:', res.error);
        commentsList.replaceChildren(this.parseHTML('<p class="text-[10px] text-center text-red-400 py-2">Erro: ' + this.escapeHTML(String(res.error || 'Falha ao enviar comentário. Verifique o console.')) + '</p>'));
      }

      btnSendComment.disabled = false;
      commentInput.disabled = false;
      commentInput.focus();
    };

    btnSendComment.addEventListener('click', handleSendComment);
    commentInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendComment();
    });

    return card;
  },

  async loadExploreFeed() {
    if (!this.exploreGrid) return;
    this.exploreGrid.innerHTML = '';
    if (this.exploreLoading) this.exploreLoading.classList.remove('hidden');

    const timeRange = this.exploreTimeRange ? this.exploreTimeRange.value : 'always';
    this.exploreData = await socialService.getExploreAggregations(timeRange);

    if (this.exploreLoading) this.exploreLoading.classList.add('hidden');
    this.renderExploreGrid();
  },

  renderExploreGrid() {
    if (!this.exploreGrid) return;
    this.exploreGrid.innerHTML = '';

    let items = [];
    if (this.currentExploreSort === 'highestRated') items = this.exploreData.highestRated || [];
    else items = this.exploreData.mostCollected || [];

    if (items.length === 0) {
      this.exploreGrid.innerHTML = '<p class="col-span-full text-center text-[var(--text-secondary)] py-8">Nenhum álbum encontrado para este filtro.</p>';
      return;
    }

    items.forEach(entry => {
      const nocover = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22%3E%3Crect fill=%22%23F5F5F7%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2386868B%22 font-family=%22Inter,sans-serif%22 font-size=%2232%22%3E%F0%9F%92%BF%3C/text%3E%3C/svg%3E';
      const card = document.createElement('div');
      card.className = 'collection-card group cursor-pointer animate-add flex flex-col h-full';

      // Verifica se o album ja esta na colecao do usuario
      const userCollection = catalogUI.cachedCollection || [];
      const alreadyInCollection = userCollection.some(
        c => c.album && c.album.spotify_id === entry.spotify_id
      );

      let badgeHtml = '';
      if (this.currentExploreSort === 'mostCollected') {
        badgeHtml = '<div class="absolute top-2 right-2 bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">🔥 ' + this.escapeHTML(String(entry.collection_count)) + ' Coleções</div>';
      } else if (this.currentExploreSort === 'highestRated') {
        badgeHtml = '<div class="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">★ ' + this.escapeHTML(String(entry.avg_rating.toFixed(1))) + '</div>';
      } else if (this.currentExploreSort === 'newReleases') {
        badgeHtml = '<div class="absolute top-2 right-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">📅 ' + this.escapeHTML(String(entry.release_year || 'Novo')) + '</div>';
      }

      const addBtnText = this.escapeHTML(alreadyInCollection ? '✔ Na Coleção' : '+ Coleção');
      const addBtnClass = this.escapeHTML(alreadyInCollection
        ? 'bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg cursor-default'
        : 'btn-add-explore bg-white text-[var(--text-primary)] font-bold text-xs px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform');

      card.replaceChildren(this.parseHTML(
        '<div class="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white">' +
          '<img src="' + (this.escapeHTML(entry.cover_url) || nocover) + '" alt="' + this.escapeHTML(entry.title) + '" class="w-full aspect-square object-cover">' +
          badgeHtml +
          '<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">' +
             '<button class="' + addBtnClass + '">' +
               addBtnText +
             '</button>' +
          '</div>' +
        '</div>' +
        '<h4 class="text-xs md:text-sm font-semibold mt-2 truncate">' + this.escapeHTML(entry.title) + '</h4>' +
        '<p class="text-[10px] md:text-xs text-[var(--text-secondary)] truncate">' + this.escapeHTML(entry.artist) + '</p>'
      ));

      if (!alreadyInCollection) {
        const btnAdd = card.querySelector('.btn-add-explore');
        btnAdd.addEventListener('click', async (e) => {
          e.stopPropagation();
          btnAdd.disabled = true;
          btnAdd.innerHTML = '⏳';

          const res = await collectionService.addToCollection(this.currentUserId, {
            spotify_id: entry.spotify_id,
            title: entry.title,
            artist: entry.artist,
            cover_url: entry.cover_url,
            release_year: entry.release_year
          });

          if (res.success) {
            btnAdd.className = "bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg cursor-default";
            btnAdd.innerHTML = '✔ Na Coleção';
            await catalogUI.loadCollection(this.currentUserId);
          } else {
            btnAdd.innerHTML = '❌ Erro';
            btnAdd.disabled = false;
          }
        });
      }
      this.exploreGrid.appendChild(card);
    });
  },

  async performUserSearch(query) {
    if (!this.currentUserId) await this.loadSession();
    if (!this.userSearchResults) return;
    this.userSearchResults.innerHTML = '<p class="col-span-full text-center text-[var(--text-secondary)] py-4">Buscando...</p>';

    const users = await collectionService.searchUsers(query);
    this.userSearchResults.innerHTML = '';

    if (users.length === 0) {
      this.userSearchResults.innerHTML = '<p class="col-span-full text-center text-[var(--text-secondary)] py-4">Nenhum colecionador encontrado.</p>';
      return;
    }


    const resultsHtml = await Promise.all(users.map(async (user) => {
      if (user.id === this.currentUserId) return null;

      const isFollowing = await socialService.checkFollow(this.currentUserId, user.id);

      const card = document.createElement('div');
      card.className = 'apple-card p-4 flex items-center gap-4 bg-white/60 backdrop-blur-md hover:bg-white hover:shadow-lg transition-all group';
      const avatar = user.avatar_url || `https://ui-avatars.com/api/?name=${user.display_name}&background=E5E5EA&color=1D1D1F`;

      card.replaceChildren(this.parseHTML(
        '<img src="' + this.escapeHTML(avatar) + '" class="w-12 h-12 rounded-full object-cover shadow-sm cursor-pointer">' +
        '<div class="flex-1 min-w-0 cursor-pointer">' +
          '<p class="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">' + this.escapeHTML(user.display_name) + '</p>' +
          '<p class="text-xs text-[var(--text-secondary)] truncate">@' + this.escapeHTML(user.username) + '</p>' +
          (user.current_track_name ? '<p class="text-[10px] text-[#1DB954] mt-1 truncate font-medium">🎧 ' + this.escapeHTML(user.current_track_name) + ' - ' + this.escapeHTML(user.current_track_artist) + '</p>' : '') +
        '</div>' +
        '<button class="btn-follow px-4 py-1.5 rounded-full text-xs font-bold transition-all ' + this.escapeHTML(isFollowing ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-[var(--accent)] text-white hover:bg-blue-600') + '">' +
          this.escapeHTML(isFollowing ? 'Seguindo' : 'Seguir') +
        '</button>'
      ));

      // Clicar no avatar ou infos abre preview
      const clickableArea = card.querySelector('.flex-1');
      const avatarImg = card.querySelector('img');
      const openModal = async () => {
        if (!this.userPreviewModal) return;

        // Show modal with basic info immediately
        this.previewAvatar.src = this.escapeHTML(avatar);
        this.previewName.textContent = this.escapeHTML(user.display_name);
        this.previewUsername.textContent = '@' + this.escapeHTML(user.username);
        this.previewBio.textContent = user.bio ? this.escapeHTML(user.bio) : 'Nenhuma biografia informada.';

        this.previewAlbumsCount.textContent = '...';
        this.previewTopArtist.textContent = '...';

        // Follow btn in modal
        this.btnPreviewFollow.className = `apple-btn w-full shadow-sm text-sm py-3 transition-colors ${isFollowing ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-[var(--accent)] text-white hover:bg-blue-600'}`;
        this.btnPreviewFollow.textContent = isFollowing ? 'Seguindo' : 'Seguir';

        // Follow action inside modal
        this.btnPreviewFollow.onclick = async () => {
          this.btnPreviewFollow.disabled = true;
          this.btnPreviewFollow.innerHTML = '⏳';

          let success = false;
          let newFollowState = isFollowing;

          if (isFollowing) {
            const res = await socialService.unfollowUser(this.currentUserId, user.id);
            success = res.success;
            if (success) newFollowState = false;
          } else {
            const res = await socialService.followUser(this.currentUserId, user.id);
            if (res.success) {
              success = true;
              newFollowState = true;
            } else {
              alert(res.error);
            }
          }

          if (success) {
            // Update external button
            isFollowing = newFollowState;
            btnFollow.textContent = isFollowing ? 'Seguindo' : 'Seguir';
            btnFollow.className = `btn-follow px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isFollowing ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-[var(--accent)] text-white hover:bg-blue-600'}`;
            // Update modal button
            this.btnPreviewFollow.textContent = isFollowing ? 'Seguindo' : 'Seguir';
            this.btnPreviewFollow.className = `apple-btn w-full shadow-sm text-sm py-3 transition-colors ${isFollowing ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-[var(--accent)] text-white hover:bg-blue-600'}`;
          }

          this.btnPreviewFollow.disabled = false;
        };

        this.userPreviewModal.classList.remove('hidden');

        const previewLatestReviews = document.getElementById('preview-latest-reviews');
        if (previewLatestReviews) {
          previewLatestReviews.innerHTML = '<p class="text-xs text-gray-400 text-center py-4 animate-pulse">Carregando...</p>';
        }

        // Fetch collection to get stats
        const userCol = await collectionService.getUserCollection(user.id);
        this.previewAlbumsCount.textContent = userCol.length;

        if (userCol.length > 0) {
          const artistCount = new Map();
          userCol.forEach(item => {
            if (item.album && item.album.artist) {
              const art = item.album.artist.split(',')[0].trim();
              artistCount.set(art, (artistCount.get(art) || 0) + 1);
            }
          });
          const topArtist = Array.from(artistCount.keys()).reduce((a, b) => artistCount.get(a) > artistCount.get(b) ? a : b);
          this.previewTopArtist.textContent = topArtist;
        } else {
          this.previewTopArtist.textContent = '-';
        }

        if (previewLatestReviews) {
          const reviews = userCol.filter(item => item.rating || item.review).sort((a, b) => new Date(b.added_at) - new Date(a.added_at)).slice(0, 5);
          
          if (reviews.length === 0) {
            previewLatestReviews.innerHTML = '<p class="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">Nenhuma avaliação recente.</p>';
          } else {
            previewLatestReviews.innerHTML = '';
            reviews.forEach(item => {
              const stars = item.rating ? `${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))}` : '';
              const card = document.createElement('div');
              card.className = 'flex items-center gap-3 bg-gray-50/80 p-2 rounded-xl border border-gray-100';
              card.replaceChildren(this.parseHTML(
                '<img src="' + this.escapeHTML(item.album.cover_url) + '" class="w-10 h-10 rounded-md object-cover shadow-sm">' +
                '<div class="flex-1 min-w-0">' +
                  '<p class="text-xs font-bold text-[var(--text-primary)] truncate">' + this.escapeHTML(item.album.title) + '</p>' +
                  '<p class="text-[10px] text-[var(--text-secondary)] truncate">' + this.escapeHTML(item.album.artist) + '</p>' +
                  '<div class="text-[10px] text-yellow-400 tracking-wider mt-0.5">' + this.escapeHTML(stars) + '</div>' +
                '</div>'
              ));
              previewLatestReviews.appendChild(card);
            });
          }
        }
      };

      clickableArea.addEventListener('click', openModal);
      avatarImg.addEventListener('click', openModal);

      // Lógica do botão
      const btnFollow = card.querySelector('.btn-follow');
      btnFollow.addEventListener('click', async (e) => {
        e.stopPropagation(); // Previne abrir o modal se clicar no botao "Seguir" da search
        btnFollow.disabled = true;

        let success = false;
        if (isFollowing) {
          const res = await socialService.unfollowUser(this.currentUserId, user.id);
          success = res.success;
          if (success) isFollowing = false;
        } else {
          const res = await socialService.followUser(this.currentUserId, user.id);
          if (res.success) {
            success = true;
            isFollowing = true;
          } else {
            alert(res.error);
          }
        }

        if (success) {
          btnFollow.textContent = isFollowing ? 'Seguindo' : 'Seguir';
          btnFollow.className = `btn-follow px-4 py-1.5 rounded-full text-xs font-bold transition-all ${isFollowing ? 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500' : 'bg-[var(--accent)] text-white hover:bg-blue-600'}`;
        }
        btnFollow.disabled = false;
      });

      return card;
    }));

    resultsHtml.forEach(card => {
      if (card) this.userSearchResults.appendChild(card);
    });
  },

  async loadFriendsSidebar() {
    if (!this.currentUserId) return;

    const sidebarContainer = document.getElementById('friends-activity-sidebar-container');
    const mobileContainer = document.getElementById('friends-activity-mobile-container');

    if (!sidebarContainer && !mobileContainer) return;

    const friends = await socialService.getFriendsSidebar(this.currentUserId);

    if (friends.length === 0) {
      const emptyMsg = '<div class="text-xs text-gray-400 py-4 px-2 text-center">Encontre pessoas para seguir e acompanhe o que estão escutando!</div>';
      if (sidebarContainer) sidebarContainer.innerHTML = emptyMsg;
      if (mobileContainer) mobileContainer.innerHTML = emptyMsg;
      return;
    }

    // Gerar o HTML dos cards de amigos
    const generateHtml = (isMobile) => {
      return friends.map(friend => {
        const avatar = friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.display_name}&background=E5E5EA&color=1D1D1F`;
        let statusHtml = '';
        let albumQuery = '';

        if (friend.current_track_name) {
          statusHtml = 'Ouvindo: <span class="text-[var(--accent)] font-medium">' + this.escapeHTML(friend.current_track_name) + ' - ' + this.escapeHTML(friend.current_track_artist) + '</span>';
          // Ao clicar em card de amigo sem track atual, dispara busca pelo último álbum
        } else if (friend.lastActivity) {
          statusHtml = 'Último: <span class="text-gray-400 font-medium">' + this.escapeHTML(friend.lastActivity.title) + ' - ' + this.escapeHTML(friend.lastActivity.artist) + '</span>';
          albumQuery = `${friend.lastActivity.title} ${friend.lastActivity.artist}`;
        } else {
          statusHtml = `Nenhuma atividade recente.`;
        }

        const widthClass = isMobile ? 'flex-none w-64' : '';
        const imgSize = isMobile ? 'h-10 w-10' : 'h-9 w-9';
        const textSize = isMobile ? 'text-xs' : 'text-[11px]';
        const indicatorColor = friend.current_track_name ? 'bg-[#1DB954]' : 'bg-gray-300';

        const div = document.createElement('div');
        div.className = 'friend-activity-card ' + widthClass + ' apple-card p-3 bg-white/60 backdrop-blur-md border border-white/40 flex items-center gap-3 group cursor-pointer hover:bg-white transition-all';
        if (albumQuery) div.dataset.albumQuery = albumQuery;
        
        div.replaceChildren(this.parseHTML(
            '<div class="relative">' +
              '<img src="' + this.escapeHTML(avatar) + '" class="' + imgSize + ' rounded-full object-cover shadow-sm" alt="' + this.escapeHTML(friend.display_name) + '">' +
              '<span class="absolute bottom-0 right-0 h-2.5 w-2.5 ' + indicatorColor + ' border-2 border-white rounded-full"></span>' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
              '<p class="' + textSize + ' font-bold text-[#1D1D1F] truncate leading-tight">' + this.escapeHTML(friend.display_name) + '</p>' +
              '<p class="text-[10px] text-[var(--text-secondary)] truncate">' + statusHtml + '</p>' +
            '</div>'
        ));
        return div;
      });
    };

    if (sidebarContainer) {
      sidebarContainer.replaceChildren(...generateHtml(false));
      this.attachSidebarListeners(sidebarContainer);
    }

    if (mobileContainer) {
      mobileContainer.replaceChildren(...generateHtml(true));
      this.attachSidebarListeners(mobileContainer);
    }
  },

  attachSidebarListeners(container) {
    const cards = container.querySelectorAll('.friend-activity-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const query = card.getAttribute('data-album-query');
        if (query) {
          // Usa o input de busca correto e muda para a aba de coleção
          const searchInput = document.getElementById('unified-search-input');
          if (searchInput) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();

            // Muda para a tab correta de coleção se não estiver
            this.switchTab('collection');
          }
        }
      });
    });
  },

  async navigateToPost(collectionId) {
    // 1. Mudar para aba Comunidade > Seguindo
    this.switchTab('community');
    this.switchCommunityView('following');

    // 2. Aguardar o feed carregar (se ainda não carregou)
    await new Promise(resolve => setTimeout(resolve, 500));

    // 3. Tentar encontrar o card. Se não existir, recarregar o feed completo.
    let target = this.communityFeedContainer?.querySelector(`[data-collection-id="${collectionId}"]`);

    if (!target) {
      await this.loadFollowingFeed();
      await new Promise(resolve => setTimeout(resolve, 300));
      target = this.communityFeedContainer?.querySelector(`[data-collection-id="${collectionId}"]`);
    }

    if (target) {
      // 4. Scroll suave + destaque visual
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-2', 'ring-[var(--accent)]', 'ring-offset-2');
      target.style.transition = 'box-shadow 0.3s, outline 0.3s';

      // Abrir automaticamente a seção de comentários
      const btnComments = target.querySelector('.btn-toggle-comments');
      const commentsSection = target.querySelector('.comments-section');
      if (btnComments && commentsSection?.classList.contains('hidden')) {
        btnComments.click();
      }

      // Remover destaque após 3s
      setTimeout(() => {
        target.classList.remove('ring-2', 'ring-[var(--accent)]', 'ring-offset-2');
      }, 3000);
    }
  }
};
