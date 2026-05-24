// UI do Catálogo — Busca, Coleção, Filtros, Agrupamento e Detalhes

import { spotifyAuth } from '../services/spotifyAuth.js';
import { authService } from '../services/authService.js';
import { collectionService } from '../services/collectionService.js';
import { spotifyService } from '../services/spotifyService.js';
import { listeningService } from '../services/listeningService.js';

export const catalogUI = {

  // Busca
  searchInput: null,
  searchResultsPanel: null,
  searchResultsGrid: null,
  searchLoading: null,
  searchNoResults: null,
  btnCloseSearch: null,

  // Camada de UI do Catálogo: Gerencia a exibição da Coleção, Buscas e Modal de Álbum
  collectionEmpty: null,
  collectionCount: null,
  collectionFilter: null,
  collectionSort: null,
  collectionGroup: null,

  // Spotify
  spotifyOverlay: null,
  btnConnectPopup: null,
  btnSkipSpotify: null,
  btnSpotifyProfile: null,
  spotifyStatusBadge: null,

  // Listening Now
  listeningNow: null,
  listeningNowTrack: null,
  listeningNowArtist: null,
  listeningNowCover: null,
  listeningInterval: null,
  visibilityHandler: null,

  // Album Detail Modal
  albumDetailModal: null,
  albumDetailCover: null,
  albumDetailTitle: null,
  albumDetailArtist: null,
  albumDetailYear: null,
  btnCloseAlbumDetail: null,
  btnAlbumDetailSpotify: null,
  albumGenresContainer: null,
  albumGenresList: null,
  albumDetailTotalTracks: null,
  albumDetailTracks: null,
  albumDetailLabel: null,
  albumDetailCopyright: null,
  btnCloseAlbumDetailDesktop: null,
  btnAlbumDetailRemove: null,
  albumDetailPopularity: null,
  albumPopularityContainer: null,
  currentDetailAlbum: null,

  // Review Modal
  reviewModal: null,
  btnCloseReview: null,
  reviewForm: null,
  reviewRatingValue: null,
  reviewAlbumId: null,
  reviewText: null,
  reviewAlbumCover: null,
  reviewAlbumName: null,
  reviewAlbumArtist: null,
  reviewFavoriteTrackList: null,
  reviewFavoriteTrackValue: null,
  starIcons: [],

  // Estado
  currentUserId: null,
  searchTimeout: null,
  cachedCollection: [],

  init() {
    this.searchInput = document.getElementById('unified-search-input');
    this.searchResultsPanel = document.getElementById('search-results-panel');
    this.searchResultsGrid = document.getElementById('search-results-grid');
    this.searchLoading = document.getElementById('search-loading');
    this.searchNoResults = document.getElementById('search-no-results');
    this.btnCloseSearch = document.getElementById('btn-close-search');
    this.collectionGrid = document.getElementById('collection-grid');
    this.collectionEmpty = document.getElementById('collection-empty');
    this.collectionCount = document.getElementById('collection-count');
    this.collectionFilter = document.getElementById('unified-search-input');
    this.collectionSort = document.getElementById('collection-sort');
    this.collectionGroup = document.getElementById('collection-group');
    this.spotifyOverlay = document.getElementById('spotify-connect-overlay');
    this.btnConnectPopup = document.getElementById('btn-connect-spotify-popup');
    this.btnSkipSpotify = document.getElementById('btn-skip-spotify');
    this.btnSpotifyProfile = document.getElementById('btn-spotify-profile');
    this.spotifyStatusBadge = document.getElementById('spotify-status-badge');
    this.listeningNow = document.getElementById('listening-now');
    this.listeningNowTrack = document.getElementById('listening-now-track');
    this.listeningNowArtist = document.getElementById('listening-now-artist');
    this.listeningNowCover = document.getElementById('listening-now-cover');

    // Album Detail Modal
    this.albumDetailModal = document.getElementById('album-detail-modal');
    this.albumDetailCover = document.getElementById('album-detail-cover');
    this.albumDetailTitle = document.getElementById('album-detail-title');
    this.albumDetailArtist = document.getElementById('album-detail-artist');
    this.albumDetailYear = document.getElementById('album-detail-year');
    this.btnCloseAlbumDetail = document.getElementById('btn-close-album-detail');
    this.btnAlbumDetailAdd = document.getElementById('btn-album-detail-add');
    this.btnAlbumDetailSpotify = document.getElementById('btn-album-detail-spotify');
    this.albumGenresContainer = document.getElementById('album-genres-container');
    this.albumGenresList = document.getElementById('album-genres-list');
    this.albumDetailTotalTracks = document.getElementById('album-detail-total-tracks');
    this.albumDetailTracks = document.getElementById('album-detail-tracks');
    this.albumDetailLabel = document.getElementById('album-detail-label');
    this.albumDetailCopyright = document.getElementById('album-detail-copyright');
    this.btnCloseAlbumDetailDesktop = document.getElementById('btn-close-album-detail-desktop');
    this.btnAlbumDetailRemove = document.getElementById('btn-album-detail-remove');
    this.albumDetailPopularity = document.getElementById('album-detail-popularity');
    this.albumPopularityContainer = document.getElementById('album-popularity-container');
    this.headerLogo = document.getElementById('header-logo');

    // Review Modal
    this.reviewModal = document.getElementById('review-modal');
    this.btnCloseReview = document.getElementById('btn-close-review');
    this.reviewForm = document.getElementById('review-form');
    this.reviewRatingValue = document.getElementById('review-rating-value');
    this.reviewAlbumId = document.getElementById('review-album-id');
    this.reviewText = document.getElementById('review-text');
    this.reviewAlbumCover = document.getElementById('review-album-cover');
    this.reviewAlbumName = document.getElementById('review-album-name');
    this.reviewAlbumArtist = document.getElementById('review-album-artist');
    this.reviewFavoriteTrackList = document.getElementById('review-favorite-track-list');
    this.reviewFavoriteTrackValue = document.getElementById('review-favorite-track-value');
    this.starIcons = document.querySelectorAll('.star-icon');

    // Stats
    this.collectionStatsPanel = document.getElementById('collection-stats');
    this.statTotal = document.getElementById('stat-total');
    this.statTopArtist = document.getElementById('stat-top-artist');
    this.statDecade = document.getElementById('stat-decade');
    this.statLastCover = document.getElementById('stat-last-cover');

    this.btnEmptyAction = document.getElementById('btn-empty-action');

    this.setupListeners();
    this.setupReviewModal();
  },

  // Utilitário para escapar HTML e prevenir XSS
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  setupReviewModal() {
    // Interação com as estrelas
    this.starIcons.forEach(star => {
      star.addEventListener('click', (e) => {
        const value = parseInt(e.currentTarget.dataset.value);
        this.reviewRatingValue.value = value;
        this.updateStarsUI(value);
      });
      star.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          star.click();
        }
      });
    });

    // Fechar modal
    this.btnCloseReview?.addEventListener('click', () => {
      this.reviewModal.classList.add('hidden');
    });

    // Submeter form
    this.reviewForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const albumId = this.reviewAlbumId.value;
      const rating = this.reviewRatingValue.value ? parseInt(this.reviewRatingValue.value) : null;
      const reviewText = this.reviewText.value.trim();
      const favoriteTrack = this.reviewFavoriteTrackValue?.value || null;

      const btn = document.getElementById('btn-save-review');
      const originalText = btn.textContent;
      btn.textContent = 'Salvando...';
      btn.disabled = true;

      const { success } = await collectionService.updateReview(this.currentUserId, albumId, rating, reviewText, favoriteTrack);
      if (success) {
        this.reviewModal.classList.add('hidden');
        await this.loadCollection(this.currentUserId); // Recarregar coleção para atualizar estrelas
      } else {
        alert('Erro ao salvar avaliação.');
      }

      btn.textContent = originalText;
      btn.disabled = false;
    });

    const btnDeleteReview = document.getElementById('btn-delete-review');
    btnDeleteReview?.addEventListener('click', async () => {
      const albumId = this.reviewAlbumId.value;
      const originalText = btnDeleteReview.textContent;
      btnDeleteReview.textContent = 'Apagando...';
      btnDeleteReview.disabled = true;

      const { success } = await collectionService.updateReview(this.currentUserId, albumId, null, null, null);
      if (success) {
        this.reviewModal.classList.add('hidden');
        await this.loadCollection(this.currentUserId);
      } else {
        alert('Erro ao excluir avaliação.');
      }

      btnDeleteReview.textContent = originalText;
      btnDeleteReview.disabled = false;
    });
  },

  updateStarsUI(value) {
    this.starIcons.forEach(star => {
      star.setAttribute('aria-checked', parseInt(star.dataset.value) <= value ? 'true' : 'false');
      if (parseInt(star.dataset.value) <= value) {
        star.classList.remove('text-gray-300');
        star.classList.add('text-yellow-400');
      } else {
        star.classList.remove('text-yellow-400');
        star.classList.add('text-gray-300');
      }
    });
  },

  async openReviewModal(entry) {
    this.reviewAlbumId.value = entry.album.id;
    this.reviewAlbumName.textContent = entry.album.title;
    this.reviewAlbumArtist.textContent = entry.album.artist;
    this.reviewAlbumCover.src = entry.album.cover_url || '';

    // Set existing values
    this.reviewRatingValue.value = entry.rating || 0;
    this.updateStarsUI(entry.rating || 0);
    this.reviewText.value = entry.review || '';

    const btnDeleteReview = document.getElementById('btn-delete-review');
    if (btnDeleteReview) {
      if (entry.rating || entry.review || entry.favorite_track) {
        btnDeleteReview.classList.remove('hidden');
      } else {
        btnDeleteReview.classList.add('hidden');
      }
    }

    // Load tracks for favorite track selector
    if (this.reviewFavoriteTrackList) {
      this.reviewFavoriteTrackList.innerHTML = '<p class="text-xs text-gray-400 text-center py-4 animate-pulse">Carregando faixas...</p>';
      this.reviewFavoriteTrackValue.value = entry.favorite_track || '';

      try {
        const details = await spotifyService.getAlbumDetails(entry.album.spotify_id);
        if (details && details.tracks) {
          this.reviewFavoriteTrackList.innerHTML = '';
          details.tracks.forEach(track => {
            const isSelected = entry.favorite_track === track.name;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${isSelected ? 'bg-[var(--accent)] text-white shadow-sm' : 'hover:bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-sm'}`;
            btn.textContent = track.name;

            btn.addEventListener('click', () => {
              // Deselect if already selected
              if (this.reviewFavoriteTrackValue.value === track.name) {
                this.reviewFavoriteTrackValue.value = '';
                btn.className = 'text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-sm';
              } else {
                // Clear previous selection visually
                Array.from(this.reviewFavoriteTrackList.children).forEach(child => {
                  child.className = 'text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:shadow-sm';
                });
                this.reviewFavoriteTrackValue.value = track.name;
                btn.className = 'text-left px-3 py-2 rounded-lg text-xs font-medium transition-all bg-[var(--accent)] text-white shadow-sm';
              }
            });

            this.reviewFavoriteTrackList.appendChild(btn);
          });
        } else {
          this.reviewFavoriteTrackList.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Erro ao carregar faixas</p>';
        }
      } catch (err) {
        this.reviewFavoriteTrackList.innerHTML = '<p class="text-xs text-red-400 text-center py-4">Erro ao carregar faixas</p>';
      }
    }

    this.reviewModal.classList.remove('hidden');
  },

  setupListeners() {
    this.btnConnectPopup?.addEventListener('click', () => spotifyAuth.redirectToSpotify());

    // Botão "Agora não" do popup de Spotify (C3)
    this.btnSkipSpotify?.addEventListener('click', () => {
      this.spotifyOverlay?.classList.add('hidden');
      localStorage.setItem('spotify_popup_dismissed', 'true');
    });

    this.btnSpotifyProfile?.addEventListener('click', () => {
      if (spotifyAuth.isConnected()) {
        spotifyAuth.disconnect();
        this.updateSpotifyState();
      } else {
        spotifyAuth.redirectToSpotify();
      }
    });

    // Setup Segmented Controls for Search Scope
    const scopeButtons = document.querySelectorAll('#search-scope-desktop button, #search-scope-mobile button');
    this.searchScope = 'spotify';
    
    scopeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scope = e.currentTarget.dataset.scope;
        this.searchScope = scope;
        scopeButtons.forEach(b => {
          if(b.dataset.scope === scope) b.classList.add('active');
          else b.classList.remove('active');
        });
        
        const searchInput = document.getElementById('unified-search-input');
        if (searchInput) {
           searchInput.placeholder = scope === 'spotify' ? 'Buscar álbuns no Spotify...' : 'Filtrar coleção...';
           searchInput.value = ''; 
           if(this.hideSearchResults) this.hideSearchResults(); 
           this.applyFilterAndSort(); 
        }
        // Re-evaluate disabled state based on new scope
        this.updateSpotifyState();
      });
    });

    this.searchInput?.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (this.searchScope === 'spotify') {
        clearTimeout(this.searchTimeout);
        if (query.length < 3) { if(this.hideSearchResults) this.hideSearchResults(); return; }
        this.searchTimeout = setTimeout(() => this.performSearch(query), 400);
      } else {
        this.applyFilterAndSort();
      }
    });

    this.btnCloseSearch?.addEventListener('click', () => {
      if(this.hideSearchResults) this.hideSearchResults();
      this.searchInput.value = '';
    });

    // Mobile filters toggle
    const btnToggleFilters = document.getElementById('btn-toggle-filters');
    const mobileAdvancedFilters = document.getElementById('mobile-advanced-filters');
    btnToggleFilters?.addEventListener('click', () => {
        if(mobileAdvancedFilters.classList.contains('mobile-filters-collapsed')) {
             mobileAdvancedFilters.classList.remove('mobile-filters-collapsed');
             mobileAdvancedFilters.classList.add('grid');
        } else {
             mobileAdvancedFilters.classList.add('mobile-filters-collapsed');
             mobileAdvancedFilters.classList.remove('grid');
        }
    });



    this.headerLogo?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.collectionSort?.addEventListener('change', () => this.applyFilterAndSort());
    this.collectionGroup?.addEventListener('change', () => this.applyFilterAndSort());

    // Share button
    this.btnShareCollection?.addEventListener('click', () => {
      const userName = document.getElementById('header-user-name')?.textContent || '';
      shareUI.open(this.cachedCollection, userName);
    });

    // Empty state action button
    this.btnEmptyAction?.addEventListener('click', () => {
      if (spotifyAuth.isConnected()) {
        this.searchInput?.focus();
      } else {
        spotifyAuth.redirectToSpotify();
      }
    });

    // Clicar em atividade de amigo
    document.addEventListener('click', async (e) => {
      const card = e.target.closest('.friend-activity-card');
      if (card) {
        const query = card.dataset.albumQuery;
        if (!query) return;

        // Feedback visual
        const originalOpacity = card.style.opacity;
        card.style.opacity = '0.7';

        try {
          // Destruturando items do retorno do searchAlbums
          const { items } = await spotifyService.searchAlbums(query);
          if (items && items.length > 0) {
            this.openAlbumDetail(items[0], 'search');
          }
        } catch (err) {
          console.error('Erro ao buscar álbum do amigo:', err);
        } finally {
          card.style.opacity = originalOpacity || '1';
        }
      }
    });

    // Album Detail Modal
    this.btnCloseAlbumDetail?.addEventListener('click', () => this.closeAlbumDetail());
    this.btnCloseAlbumDetailDesktop?.addEventListener('click', () => this.closeAlbumDetail());
    this.albumDetailModal?.addEventListener('click', (e) => {
      if (e.target === this.albumDetailModal) this.closeAlbumDetail();
    });
    this.btnAlbumDetailAdd?.addEventListener('click', async () => {
      if (!this.currentDetailAlbum) return;
      const btn = this.btnAlbumDetailAdd;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span class="hidden md:inline">Salvando...</span>
      `;
      btn.disabled = true;
      // Enrich album with genres from details if not already present
      let albumToSave = { ...this.currentDetailAlbum };
      if (!albumToSave.genres || albumToSave.genres.length === 0) {
        const details = await spotifyService.getAlbumDetails(albumToSave.spotify_id);
        if (details && details.genres.length > 0) {
          albumToSave.genres = details.genres;
        }
      }
      const { success } = await collectionService.addToCollection(this.currentUserId, albumToSave);
      if (success) {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <span class="hidden md:inline">Adicionado</span>
        `;
        btn.classList.add('bg-green-500', 'border-green-500');
        await this.loadCollection(this.currentUserId);
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span class="hidden md:inline">Erro</span>
        `;
        btn.disabled = false;
      }
    });

    this.btnAlbumDetailRemove?.addEventListener('click', async () => {
      if (!this.currentDetailAlbum) return;
      const btn = this.btnAlbumDetailRemove;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `
        <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span class="hidden md:inline">Removendo...</span>
      `;
      btn.disabled = true;
      const albumId = this.currentDetailAlbum.id;
      const { success } = await collectionService.removeFromCollection(this.currentUserId, albumId);
      if (success) {
        await this.loadCollection(this.currentUserId);
        this.closeAlbumDetail();
      } else {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span class="hidden md:inline">Erro</span>
        `;
        btn.disabled = false;
      }
    });
  },

  openAlbumDetail(album, source = 'search') {
    this.currentDetailAlbum = album;

    this.albumDetailCover.src = album.cover_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23F5F5F7%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2386868B%22 font-family=%22Inter,sans-serif%22 font-size=%2240%22%3E%F0%9F%92%BF%3C/text%3E%3C/svg%3E';
    this.albumDetailTitle.textContent = album.title;
    this.albumDetailArtist.textContent = album.artist;
    this.albumDetailYear.textContent = album.release_year || '';
    this.btnAlbumDetailSpotify.href = `https://open.spotify.com/album/${album.spotify_id}`;
    this.btnAlbumDetailSpotify.innerHTML = `
      <svg class="h-5 w-5 md:h-4 md:w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
      <span class="hidden md:inline">Spotify</span>
    `;

    const isInCollection = this.cachedCollection.some(
      entry => entry.album.spotify_id === album.spotify_id
    );

    // Reset visibility and classes for both buttons
    this.btnAlbumDetailAdd.classList.remove('hidden');
    this.btnAlbumDetailAdd.disabled = false;
    this.btnAlbumDetailAdd.classList.remove('bg-green-500', 'border-green-500');

    if (this.btnAlbumDetailRemove) {
      this.btnAlbumDetailRemove.classList.add('hidden');
      this.btnAlbumDetailRemove.disabled = false;
    }

    // Se o álbum está na coleção, mostramos o botão de remover. Caso contrário, o de adicionar.
    if (isInCollection || source === 'collection') {
      this.btnAlbumDetailAdd.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
        <span class="hidden md:inline">Na sua coleção</span>
      `;
      this.btnAlbumDetailAdd.disabled = true;
      this.btnAlbumDetailAdd.classList.add('bg-green-500', 'border-green-500');

      if (this.btnAlbumDetailRemove) {
        this.btnAlbumDetailRemove.classList.remove('hidden');
        this.btnAlbumDetailRemove.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          <span class="hidden md:inline">Remover da Coleção</span>
        `;
      }
    } else {
      this.btnAlbumDetailAdd.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        <span class="hidden md:inline">Adicionar à Coleção</span>
      `;
    }

    // Garantir que o botão do Spotify seja visível (reset)
    if (this.btnAlbumDetailSpotify) {
      this.btnAlbumDetailSpotify.classList.remove('hidden');
    }

    this.albumDetailModal.classList.remove('hidden');
    // Animação do modal
    const modalCard = this.albumDetailModal.querySelector('.apple-card');
    if (modalCard) {
      modalCard.classList.remove('animate-modal-out');
      modalCard.classList.add('animate-modal-in');
    }

    // Limpa estados de carregamento anteriores
    this.albumDetailTotalTracks.textContent = '';
    this.albumDetailLabel.textContent = '';
    this.albumDetailCopyright.textContent = '';
    this.albumGenresContainer?.classList.add('hidden');
    this.albumPopularityContainer?.classList.add('hidden');
    this.albumDetailTracks.innerHTML = `
      <div class="animate-pulse space-y-2">
        <div class="h-8 bg-gray-100 rounded-lg"></div>
        <div class="h-8 bg-gray-100 rounded-lg w-5/6"></div>
        <div class="h-8 bg-gray-100 rounded-lg w-4/6"></div>
      </div>
    `;

    // Limpa a resenha
    const reviewContainer = document.getElementById('album-detail-user-review');
    const reviewStars = document.getElementById('album-detail-review-stars');
    const reviewText = document.getElementById('album-detail-review-text');
    const reviewTrack = document.getElementById('album-detail-review-track');
    if (reviewContainer) reviewContainer.classList.add('hidden');

    if (source === 'collection' && isInCollection) {
      const collectionEntry = this.cachedCollection.find(e => e.album.spotify_id === album.spotify_id);
      if (collectionEntry && (collectionEntry.rating || collectionEntry.review || collectionEntry.favorite_track)) {
        if (reviewContainer) reviewContainer.classList.remove('hidden');
        if (reviewStars) reviewStars.textContent = collectionEntry.rating ? `${'★'.repeat(Math.floor(collectionEntry.rating))}${'☆'.repeat(5 - Math.floor(collectionEntry.rating))}` : '';
        if (reviewText) {
          if (collectionEntry.review) {
            reviewText.textContent = `"${collectionEntry.review}"`;
            reviewText.classList.remove('hidden');
          } else {
            reviewText.classList.add('hidden');
          }
        }
        if (reviewTrack) {
          if (collectionEntry.favorite_track) {
            reviewTrack.textContent = `★ Destaque: ${collectionEntry.favorite_track}`;
            reviewTrack.classList.remove('hidden');
          } else {
            reviewTrack.classList.add('hidden');
          }
        }
      }
    }

    // Busca detalhes completos (tracklist, genres, label)
    this.fetchAndRenderExtraDetails(album.spotify_id);
  },

  async fetchAndRenderExtraDetails(spotifyId) {
    try {
      const details = await spotifyService.getAlbumDetails(spotifyId);
      if (!details) throw new Error("A requisição retornou vazio ou falhou sem erro explícito.");



      // Músicas
      this.albumDetailTotalTracks.textContent = `${details.total_tracks} músicas`;
      this.albumDetailTracks.replaceChildren();
      details.tracks.forEach(t => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group/track';
        
        const numSpan = document.createElement('span');
        numSpan.className = 'w-4 text-[10px] text-gray-400 text-right';
        numSpan.textContent = String(t.number);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex-1 min-w-0';
        
        const pName = document.createElement('p');
        pName.className = 'text-xs font-medium truncate';
        pName.textContent = t.name;
        contentDiv.appendChild(pName);
        
        if (t.artists !== details.artist) {
          const pArt = document.createElement('p');
          pArt.className = 'text-[10px] text-gray-400 truncate';
          pArt.textContent = t.artists;
          contentDiv.appendChild(pArt);
        }
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'text-[10px] text-gray-400';
        timeSpan.textContent = this.msToTime(t.duration_ms);
        
        div.appendChild(numSpan);
        div.appendChild(contentDiv);
        div.appendChild(timeSpan);
        this.albumDetailTracks.appendChild(div);
      });

      // Footer
      this.albumDetailLabel.textContent = details.label || '';
      this.albumDetailCopyright.textContent = details.copyrights || '';

      // Popularidade (Views)
      if (this.albumDetailPopularity && this.albumPopularityContainer && details.popularity > 0) {
        this.albumDetailPopularity.textContent = `${details.popularity}% de alcance global`;
        this.albumPopularityContainer.classList.remove('hidden');
      }
    } catch (error) {
      console.error('[catalogUI] Erro ao buscar detalhes:', error);

      const isRateLimit = error.message && error.message.includes('429');

      if (isRateLimit) {
        this.albumDetailTracks.replaceChildren();
        const div = document.createElement('div');
        div.className = 'py-6 px-4 bg-[var(--accent)]/5 rounded-xl border border-[var(--accent)]/20 text-center';
        div.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-[var(--accent)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p class="text-sm font-semibold text-[var(--accent)] mb-1">Servidores Ocupados</p>
            <p class="text-xs text-gray-500">Muitos álbuns abertos recentemente. O Spotify bloqueou temporariamente nossas requisições. Tente de novo em alguns minutos.</p>
        `;
        this.albumDetailTracks.appendChild(div);
      } else {
        this.albumDetailTracks.replaceChildren();
        const div = document.createElement('div');
        div.className = 'py-4 space-y-2';
        
        const p = document.createElement('p');
        p.className = 'text-xs text-red-500 font-bold';
        p.textContent = 'Falha no Carregamento';
        
        const errDiv = document.createElement('div');
        errDiv.className = 'bg-red-50 border border-red-100 text-red-800 text-[10px] p-2 rounded max-h-40 overflow-y-auto font-mono whitespace-pre-wrap';
        errDiv.textContent = error.message || error;
        
        div.appendChild(p);
        div.appendChild(errDiv);
        this.albumDetailTracks.appendChild(div);
      }
    }
  },

  msToTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  },

  closeAlbumDetail() {
    const modalCard = this.albumDetailModal?.querySelector('.apple-card');
    if (modalCard) {
      modalCard.classList.remove('animate-modal-in');
      modalCard.classList.add('animate-modal-out');
      modalCard.addEventListener('animationend', () => {
        this.albumDetailModal.classList.add('hidden');
        modalCard.classList.remove('animate-modal-out');
      }, { once: true });
    } else {
      this.albumDetailModal.classList.add('hidden');
    }
    this.currentDetailAlbum = null;
  },

  // === SPOTIFY STATE ===

  updateSpotifyState() {
    const connected = spotifyAuth.isConnected();

    if (this.searchInput) {
      // Only block the input when scope is 'spotify' AND Spotify is not connected
      const isSpotifyScope = (this.searchScope === 'spotify');
      const shouldDisable = !connected && isSpotifyScope;
      this.searchInput.disabled = shouldDisable;
      if (shouldDisable) {
        this.searchInput.placeholder = '🔒 Busca desabilitada — conecte o Spotify no seu Perfil';
      } else if (isSpotifyScope) {
        this.searchInput.placeholder = 'Buscar álbuns no Spotify...';
      } else {
        this.searchInput.placeholder = 'Filtrar coleção...';
      }
    }

    if (this.spotifyStatusBadge) {
      this.spotifyStatusBadge.textContent = connected ? 'Conectado' : 'Desconectado';
      this.spotifyStatusBadge.className = connected
        ? 'text-xs font-semibold px-3 py-1 rounded-full bg-[#1DB954]/10 text-[#1DB954]'
        : 'text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500';
    }

    if (this.btnSpotifyProfile) {
      if (connected) {
        this.btnSpotifyProfile.textContent = 'Desconectar Spotify';
        this.btnSpotifyProfile.classList.remove('bg-[#1DB954]', 'hover:bg-[#1ed760]');
        this.btnSpotifyProfile.classList.add('bg-red-500', 'hover:bg-red-600');
      } else {
        this.btnSpotifyProfile.innerHTML = `
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          Conectar Spotify
        `;
        this.btnSpotifyProfile.classList.remove('bg-red-500', 'hover:bg-red-600');
        this.btnSpotifyProfile.classList.add('bg-[#1DB954]', 'hover:bg-[#1ed760]');
      }
    }

    if (!connected && !localStorage.getItem('spotify_popup_dismissed')) {
      this.spotifyOverlay?.classList.remove('hidden');
    } else {
      this.spotifyOverlay?.classList.add('hidden');
    }

    if (connected) {
      this.startListeningNow();
    } else {
      this.stopListeningNow();
    }
  },

  // === BUSCA ===

  async performSearch(query) {
    if (!spotifyAuth.isConnected()) { this.updateSpotifyState(); return; }
    this.showSearchLoading();
    const { items, error } = await spotifyService.searchAlbums(query);
    this.hideSearchLoading();
    if (error) { this.updateSpotifyState(); return; }
    if (items.length === 0) { this.showNoResults(); return; }
    this.renderSearchResults(items);
  },

  renderSearchResults(albums) {
    this.searchResultsGrid.innerHTML = '';
    this.searchResultsPanel.classList.remove('hidden');
    this.searchNoResults.classList.add('hidden');

    albums.forEach(album => {
      const card = document.createElement('div');
      card.className = 'album-card group cursor-pointer';
      const nocover = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22%3E%3Crect fill=%22%23F5F5F7%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2386868B%22 font-family=%22Inter,sans-serif%22 font-size=%2232%22%3E%F0%9F%92%BF%3C/text%3E%3C/svg%3E';
      const imgDiv = document.createElement('div');
      imgDiv.className = 'relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white';
      
      const img = document.createElement('img');
      img.src = album.cover_url || nocover;
      img.alt = album.title;
      img.className = 'w-full aspect-square object-cover';
      
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300';
      
      imgDiv.appendChild(img);
      imgDiv.appendChild(overlay);
      
      const h4 = document.createElement('h4');
      h4.className = 'text-sm font-semibold mt-2 truncate';
      h4.textContent = album.title;
      
      const pArtist = document.createElement('p');
      pArtist.className = 'text-xs text-[var(--text-secondary)] truncate';
      pArtist.textContent = album.artist;
      
      const pYear = document.createElement('p');
      pYear.className = 'text-xs text-gray-400';
      pYear.textContent = String(album.release_year || '');
      
      card.replaceChildren(imgDiv, h4, pArtist, pYear);
      card.addEventListener('click', () => this.openAlbumDetail(album, 'search'));
      this.searchResultsGrid.appendChild(card);
    });
  },

  // === COLEÇÃO ===

  async loadCollection(userId) {
    this.currentUserId = userId;
    const items = await collectionService.getCollection(userId);
    this.cachedCollection = items;
    this.applyFilterAndSort();
  },

  applyFilterAndSort() {
    const filterQuery = (this.collectionFilter?.value || '').toLowerCase().trim();
    const sortBy = this.collectionSort?.value || 'recent';

    let items = [...this.cachedCollection];

    // Filtrar (título ou artista)
    if (filterQuery) {
      items = items.filter(entry => {
        const a = entry.album;
        return a.title.toLowerCase().includes(filterQuery)
          || a.artist.toLowerCase().includes(filterQuery);
      });
    }

    // Contador
    if (this.collectionCount) {
      const total = this.cachedCollection.length;
      this.collectionCount.textContent = total > 0 ? `(${total})` : '';
    }

    // Stats
    this.renderStats(this.cachedCollection);

    // Share button visibility
    if (this.btnShareCollection) {
      if (this.cachedCollection.length > 0) {
        this.btnShareCollection.classList.remove('hidden');
        this.btnShareCollection.classList.add('inline-flex');
      } else {
        this.btnShareCollection.classList.add('hidden');
        this.btnShareCollection.classList.remove('inline-flex');
      }
    }

    const groupBy = this.collectionGroup?.value || 'none';



    // Agrupamento
    if (groupBy !== 'none') {
      // Ordenar dentro de cada grupo
      items.sort((a, b) => {
        switch (sortBy) {
          case 'title': return (a.album.title || '').localeCompare(b.album.title || '');
          case 'artist': return (a.album.artist || '').localeCompare(b.album.artist || '');
          case 'year': return (b.album.release_year || 0) - (a.album.release_year || 0);
          case 'popularity': return (b.album.popularity || 0) - (a.album.popularity || 0);
          case 'recent':
          default: return new Date(b.added_at) - new Date(a.added_at);
        }
      });
      this.renderGrouped(items, groupBy);
      return;
    }

    // Ordenar
    items.sort((a, b) => {
      switch (sortBy) {
        case 'title': return (a.album.title || '').localeCompare(b.album.title || '');
        case 'artist': return (a.album.artist || '').localeCompare(b.album.artist || '');
        case 'year': return (b.album.release_year || 0) - (a.album.release_year || 0);
        case 'popularity': return (b.album.popularity || 0) - (a.album.popularity || 0);
        case 'recent':
        default: return new Date(b.added_at) - new Date(a.added_at);
      }
    });

    this.renderCollection(items);
  },

  // === ESTATÍSTICAS ===

  renderStats(items) {
    if (!this.collectionStatsPanel) return;

    if (items.length === 0) {
      this.collectionStatsPanel.classList.add('hidden');
      this.updateEmptyState();
      return;
    }

    this.collectionStatsPanel.classList.remove('hidden');

    // Total
    if (this.statTotal) this.statTotal.textContent = items.length;

    // Top Artista
    if (this.statTopArtist) {
      const artistCount = {};
      items.forEach(entry => {
        const artist = entry.album.artist || 'Desconhecido';
        artistCount[artist] = (artistCount[artist] || 0) + 1;
      });
      const topArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0];
      this.statTopArtist.textContent = topArtist ? topArtist[0] : '—';
    }

    // Década Dominante
    if (this.statDecade) {
      const decadeCount = {};
      items.forEach(entry => {
        const year = entry.album.release_year;
        if (year) {
          const decade = Math.floor(year / 10) * 10;
          decadeCount[decade] = (decadeCount[decade] || 0) + 1;
        }
      });
      const topDecade = Object.entries(decadeCount).sort((a, b) => b[1] - a[1])[0];
      this.statDecade.textContent = topDecade ? `Anos ${topDecade[0]}` : '—';
    }

    // Último Adicionado
    if (this.statLastCover) {
      const sorted = [...items].sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
      const last = sorted[0]?.album;
      if (last?.cover_url) {
        this.statLastCover.src = last.cover_url;
        this.statLastCover.alt = last.title;
        this.statLastCover.classList.remove('hidden');
      } else {
        this.statLastCover.classList.add('hidden');
      }
    }

    this.updateEmptyState();
  },

  // === EMPTY STATE ===

  updateEmptyState() {
    if (!this.btnEmptyAction) return;
    const connected = spotifyAuth.isConnected();

    if (connected) {
      this.btnEmptyAction.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        Buscar Álbuns
      `;
      this.btnEmptyAction.classList.remove('bg-[#1DB954]', 'hover:bg-[#1ed760]');
      this.btnEmptyAction.classList.add('bg-[var(--accent)]', 'hover:bg-[var(--accent-hover)]');
    } else {
      this.btnEmptyAction.innerHTML = `
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
        Conectar Spotify
      `;
      this.btnEmptyAction.classList.add('bg-[#1DB954]', 'hover:bg-[#1ed760]');
      this.btnEmptyAction.classList.remove('bg-[var(--accent)]', 'hover:bg-[var(--accent-hover)]');
    }
  },

  renderGrouped(items, groupBy) {
    if (items.length === 0 && this.cachedCollection.length === 0) {
      this.collectionGrid.innerHTML = '';
      this.collectionEmpty?.classList.remove('hidden');
      return;
    }

    this.collectionEmpty?.classList.add('hidden');
    this.collectionGrid.innerHTML = '';

    if (items.length === 0) {
      this.collectionGrid.innerHTML = '<p class="col-span-full text-center text-[var(--text-secondary)] py-8">Nenhum álbum corresponde ao filtro.</p>';
      return;
    }

    // Agrupar
    const groups = new Map();
    items.forEach(entry => {
      let key;
      if (groupBy === 'artist') {
        key = entry.album.artist || 'Desconhecido';
      } else if (groupBy === 'year') {
        key = entry.album.release_year ? String(entry.album.release_year) : 'Ano desconhecido';
      } else {
        key = 'Todos';
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    });

    // Ordenar grupos
    let sortedKeys;
    if (groupBy === 'year') {
      sortedKeys = Array.from(groups.keys()).sort((a, b) => {
        const na = parseInt(a) || 0;
        const nb = parseInt(b) || 0;
        return nb - na; // Mais recente primeiro
      });
    } else {
      sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
    }

    // Resetar para layout não-grid
    this.collectionGrid.className = 'space-y-6';

    sortedKeys.forEach(key => {
      const section = document.createElement('div');
      const albumsInGroup = groups.get(key);

      const btn = document.createElement('button');
      btn.className = 'artist-group-toggle flex items-center gap-2 w-full text-left mb-3 group/toggle cursor-pointer';
      btn.innerHTML = `
          <svg class="h-4 w-4 text-gray-400 transition-transform duration-200 group-open/toggle:rotate-90 artist-chevron" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
      `;
      const spanTitle = document.createElement('span');
      spanTitle.className = 'text-lg font-bold';
      spanTitle.textContent = String(key);
      
      const spanCount = document.createElement('span');
      spanCount.className = 'text-sm text-[var(--text-secondary)] font-normal';
      spanCount.textContent = `(${albumsInGroup.length})`;
      
      btn.appendChild(spanTitle);
      btn.appendChild(spanCount);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'artist-group-content grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';
      
      section.replaceChildren(btn, contentDiv);

      const toggle = section.querySelector('.artist-group-toggle');
      const content = section.querySelector('.artist-group-content');
      const chevron = section.querySelector('.artist-chevron');

      // Expandido por padrão
      chevron.style.transform = 'rotate(90deg)';

      toggle.addEventListener('click', () => {
        const isHidden = content.classList.toggle('hidden');
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(90deg)';
      });

      albumsInGroup.forEach(entry => {
        const card = this.createCollectionCard(entry);
        content.appendChild(card);
      });

      this.collectionGrid.appendChild(section);
    });
  },

  renderCollection(items) {
    if (items.length === 0 && this.cachedCollection.length === 0) {
      this.collectionGrid.innerHTML = '';
      this.collectionEmpty?.classList.remove('hidden');
      return;
    }

    this.collectionEmpty?.classList.add('hidden');

    // Restaurar grid layout
    this.collectionGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4';
    this.collectionGrid.innerHTML = '';

    if (items.length === 0) {
      this.collectionGrid.innerHTML = '<p class="col-span-full text-center text-[var(--text-secondary)] py-8">Nenhum álbum corresponde ao filtro.</p>';
      return;
    }

    items.forEach(entry => {
      const card = this.createCollectionCard(entry);
      this.collectionGrid.appendChild(card);
    });
  },

  createCollectionCard(entry) {
    const album = entry.album || entry; // fallback para busca
    const isCollection = !!entry.added_at;

    const card = document.createElement('div');
    card.className = 'collection-card group cursor-pointer animate-add flex flex-col h-full';
    const nocover = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22%3E%3Crect fill=%22%23F5F5F7%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%2386868B%22 font-family=%22Inter,sans-serif%22 font-size=%2232%22%3E%F0%9F%92%BF%3C/text%3E%3C/svg%3E';

    // Rating HTML
    const imgDiv = document.createElement('div');
    imgDiv.className = 'relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white';
    
    const img = document.createElement('img');
    img.src = album.cover_url || nocover;
    img.alt = album.title;
    img.className = 'w-full aspect-square object-cover';
    imgDiv.appendChild(img);
    
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 md:p-3 gap-2';
    
    if (isCollection) {
      const btnReview = document.createElement('button');
      btnReview.className = 'btn-review-album apple-btn w-full py-1.5 md:py-2 text-[10px] md:text-xs rounded-lg text-white mb-1 border border-white/20';
      btnReview.dataset.albumId = String(album.id);
      btnReview.textContent = 'Avaliar';
      
      const btnRemove = document.createElement('button');
      btnRemove.className = 'btn-remove-album apple-btn-secondary w-full py-1.5 md:py-2 text-[10px] md:text-xs rounded-lg border-white/50 text-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors';
      btnRemove.dataset.albumId = String(album.id);
      btnRemove.textContent = 'Remover';
      
      overlay.appendChild(btnReview);
      overlay.appendChild(btnRemove);
    }
    imgDiv.appendChild(overlay);
    
    const h4 = document.createElement('h4');
    h4.className = 'text-xs md:text-sm font-semibold mt-2 truncate';
    h4.textContent = album.title;
    
    const pArtist = document.createElement('p');
    pArtist.className = 'text-[10px] md:text-xs text-[var(--text-secondary)] truncate';
    pArtist.textContent = album.artist;
    
    card.replaceChildren(imgDiv, h4, pArtist);
    
    if (isCollection) {
      if (entry.rating) {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'flex items-center text-yellow-400 mt-1';
        ratingDiv.textContent = '★'.repeat(Math.floor(entry.rating)) + '☆'.repeat(5 - Math.floor(entry.rating));
        card.appendChild(ratingDiv);
      } else {
        const btnRate = document.createElement('button');
        btnRate.className = 'btn-rate-text text-[10px] text-[var(--accent)] mt-1 font-medium hover:underline text-left';
        btnRate.tabIndex = 0;
        btnRate.textContent = 'Avaliar álbum';
        card.appendChild(btnRate);
      }
    }
    
    if (entry.favorite_track) {
      const pFav = document.createElement('p');
      pFav.className = 'text-[10px] text-[var(--accent)] font-medium truncate mt-1';
      pFav.textContent = '★ Destaque: ' + entry.favorite_track;
      card.appendChild(pFav);
    }

    // Clicar no card abre detalhes
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-album') || e.target.closest('.btn-review-album')) return; // Não abrir detalhe se clicar em ações
      this.openAlbumDetail(album, isCollection ? 'collection' : 'search');
    });

    // Botão Avaliar
    const btnReview = card.querySelector('.btn-review-album');
    btnReview?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openReviewModal(entry);
    });

    const btnRateText = card.querySelector('.btn-rate-text');
    btnRateText?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openReviewModal(entry);
    });

    // Botão remover
    const btnRemove = card.querySelector('.btn-remove-album');
    btnRemove?.addEventListener('click', async (e) => {
      e.stopPropagation();
      // Animação de remoção
      card.classList.remove('animate-add');
      card.classList.add('animate-remove');
      card.addEventListener('animationend', async () => {
        btnRemove.textContent = 'Removendo...';
        const { success } = await collectionService.removeFromCollection(this.currentUserId, album.id);
        if (success) await this.loadCollection(this.currentUserId);
      }, { once: true });
    });

    return card;
  },

  // === LISTENING NOW ===

  startListeningNow() {
    this.pollListeningNow();
    if (this.listeningInterval) clearInterval(this.listeningInterval);
    this.listeningInterval = setInterval(() => this.pollListeningNow(), 30000);

    // Remove listener anterior para evitar acúmulo entre chamadas
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    // Pausar polling quando a aba está em background
    this.visibilityHandler = () => {
      if (document.hidden) {
        clearInterval(this.listeningInterval);
        this.listeningInterval = null;
      } else if (spotifyAuth.isConnected()) {
        this.pollListeningNow();
        this.listeningInterval = setInterval(() => this.pollListeningNow(), 30000);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  },

  stopListeningNow() {
    if (this.listeningInterval) {
      clearInterval(this.listeningInterval);
      this.listeningInterval = null;
    }
    this.listeningNow?.classList.add('hidden');
  },

  async pollListeningNow() {
    const track = await listeningService.getCurrentTrack();
    if (!track) { this.listeningNow?.classList.add('hidden'); return; }

    if (this.listeningNowTrack) this.listeningNowTrack.textContent = track.track;
    if (this.listeningNowArtist) this.listeningNowArtist.textContent = track.artist;
    if (this.listeningNowCover) {
      this.listeningNowCover.src = track.albumCover || '';
      this.listeningNowCover.alt = track.albumName;
    }
    this.listeningNow?.classList.remove('hidden');
  },

  // === UTILITÁRIOS ===

  showSearchLoading() {
    this.searchResultsPanel.classList.remove('hidden');
    this.searchResultsGrid.innerHTML = '';
    this.searchNoResults.classList.add('hidden');
    this.searchLoading.classList.remove('hidden');
  },
  hideSearchLoading() { this.searchLoading.classList.add('hidden'); },
  showNoResults() {
    this.searchResultsPanel.classList.remove('hidden');
    this.searchResultsGrid.innerHTML = '';
    this.searchNoResults.classList.remove('hidden');
  },
  hideSearchResults() {
    this.searchResultsPanel.classList.add('hidden');
    this.searchResultsGrid.innerHTML = '';
  }
};

export default catalogUI;
