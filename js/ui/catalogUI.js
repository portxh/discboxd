// UI do Catálogo — Busca, Coleção, Filtros, Agrupamento e Detalhes

import { spotifyAuth } from '../services/spotifyAuth.js';
import { spotifyService } from '../services/spotifyService.js';
import { collectionService } from '../services/collectionService.js';
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

  // Estado
  currentUserId: null,
  searchTimeout: null,
  cachedCollection: [],

  init() {
    this.searchInput = document.getElementById('search-input');
    this.searchResultsPanel = document.getElementById('search-results-panel');
    this.searchResultsGrid = document.getElementById('search-results-grid');
    this.searchLoading = document.getElementById('search-loading');
    this.searchNoResults = document.getElementById('search-no-results');
    this.btnCloseSearch = document.getElementById('btn-close-search');
    this.collectionGrid = document.getElementById('collection-grid');
    this.collectionEmpty = document.getElementById('collection-empty');
    this.collectionCount = document.getElementById('collection-count');
    this.collectionFilter = document.getElementById('collection-search');
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

    this.setupListeners();
  },

  setupListeners() {
    this.btnConnectPopup?.addEventListener('click', () => spotifyAuth.redirectToSpotify());

    // Listener para o botão de pesquisa (Lupa) do Spotify
    this.btnSearchSpotify?.addEventListener('click', () => {
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

    this.searchInput?.addEventListener('input', (e) => {
      clearTimeout(this.searchTimeout);
      const query = e.target.value.trim();
      if (query.length < 3) { this.hideSearchResults(); return; }
      this.searchTimeout = setTimeout(() => this.performSearch(query), 400);
    });

    this.btnCloseSearch?.addEventListener('click', () => {
      this.hideSearchResults();
      this.searchInput.value = '';
    });

    this.collectionFilter?.addEventListener('input', () => this.applyFilterAndSort());
    
    this.btnToggleFilters?.addEventListener('click', () => {
      this.collectionControls.classList.toggle('hidden');
      this.collectionControls.classList.toggle('flex');
    });

    this.headerLogo?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.collectionSort?.addEventListener('change', () => this.applyFilterAndSort());
    this.collectionGroup?.addEventListener('change', () => this.applyFilterAndSort());

    // Clicar em atividade de amigo (mock)
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

    this.albumDetailCover.src = album.cover_url || 'https://via.placeholder.com/400?text=No+Cover';
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

    // Busca detalhes completos (tracklist, genres, label)
    this.fetchAndRenderExtraDetails(album.spotify_id);
  },

  async fetchAndRenderExtraDetails(spotifyId) {
    const details = await spotifyService.getAlbumDetails(spotifyId);
    if (!details) {
      this.albumDetailTracks.innerHTML = '<p class="text-xs text-red-500 py-4">Não foi possível carregar as músicas.</p>';
      return;
    }



    // Músicas
    this.albumDetailTotalTracks.textContent = `${details.total_tracks} músicas`;
    this.albumDetailTracks.innerHTML = details.tracks.map(t => `
      <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group/track">
        <span class="w-4 text-[10px] text-gray-400 text-right">${t.number}</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium truncate">${t.name}</p>
          ${t.artists !== details.artist ? `<p class="text-[10px] text-gray-400 truncate">${t.artists}</p>` : ''}
        </div>
        <span class="text-[10px] text-gray-400">${this.msToTime(t.duration_ms)}</span>
      </div>
    `).join('');

    // Footer
    this.albumDetailLabel.textContent = details.label || '';
    this.albumDetailCopyright.textContent = details.copyrights || '';

    // Popularidade (Views)
    if (this.albumDetailPopularity && this.albumPopularityContainer && details.popularity > 0) {
      this.albumDetailPopularity.textContent = `${details.popularity}% de alcance global`;
      this.albumPopularityContainer.classList.remove('hidden');
    }
  },

  msToTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  },

  closeAlbumDetail() {
    this.albumDetailModal.classList.add('hidden');
    this.currentDetailAlbum = null;
  },

  // === SPOTIFY STATE ===

  updateSpotifyState() {
    const connected = spotifyAuth.isConnected();

    if (this.searchInput) {
      this.searchInput.disabled = !connected;
      this.searchInput.placeholder = connected
        ? 'Buscar álbuns no Spotify...'
        : '🔒 Busca desabilitada — conecte o Spotify no seu Perfil';
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
      card.innerHTML = `
        <div class="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white">
          <img src="${album.cover_url || 'https://via.placeholder.com/300?text=No+Cover'}" alt="${album.title}" class="w-full aspect-square object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <h4 class="text-sm font-semibold mt-2 truncate">${album.title}</h4>
        <p class="text-xs text-[var(--text-secondary)] truncate">${album.artist}</p>
        <p class="text-xs text-gray-400">${album.release_year || ''}</p>
      `;
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
    const groups = {};
    items.forEach(entry => {
      let key;
      if (groupBy === 'artist') {
        key = entry.album.artist || 'Desconhecido';
      } else if (groupBy === 'year') {
        key = entry.album.release_year ? String(entry.album.release_year) : 'Ano desconhecido';
      } else {
        key = 'Todos';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    // Ordenar grupos
    let sortedKeys;
    if (groupBy === 'year') {
      sortedKeys = Object.keys(groups).sort((a, b) => {
        const na = parseInt(a) || 0;
        const nb = parseInt(b) || 0;
        return nb - na; // Mais recente primeiro
      });
    } else {
      sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    }

    // Resetar para layout não-grid
    this.collectionGrid.className = 'space-y-6';

    sortedKeys.forEach(key => {
      const section = document.createElement('div');
      const albumsInGroup = groups[key];

      section.innerHTML = `
        <button class="artist-group-toggle flex items-center gap-2 w-full text-left mb-3 group/toggle cursor-pointer">
          <svg class="h-4 w-4 text-gray-400 transition-transform duration-200 group-open/toggle:rotate-90 artist-chevron" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
          </svg>
          <span class="text-lg font-bold">${key}</span>
          <span class="text-sm text-[var(--text-secondary)] font-normal">(${albumsInGroup.length})</span>
        </button>
        <div class="artist-group-content grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"></div>
      `;

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
        const album = entry.album;
        const card = this.createCollectionCard(album);
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
      const card = this.createCollectionCard(entry.album);
      this.collectionGrid.appendChild(card);
    });
  },

  createCollectionCard(album) {
    const card = document.createElement('div');
    card.className = 'collection-card group cursor-pointer';
    card.innerHTML = `
      <div class="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white">
        <img src="${album.cover_url || 'https://via.placeholder.com/300?text=No+Cover'}" alt="${album.title}" class="w-full aspect-square object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <button class="btn-remove-album apple-btn-secondary w-full py-2 text-xs rounded-lg border-white/50 text-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors" data-album-id="${album.id}">
            Remover
          </button>
        </div>
      </div>
      <h4 class="text-sm font-semibold mt-2 truncate">${album.title}</h4>
      <p class="text-xs text-[var(--text-secondary)] truncate">${album.artist}</p>
    `;

    // Clicar no card abre detalhes
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-album')) return; // Não abrir detalhe se clicar em remover
      this.openAlbumDetail(album, 'collection');
    });

    // Botão remover
    const btnRemove = card.querySelector('.btn-remove-album');
    btnRemove?.addEventListener('click', async (e) => {
      e.stopPropagation();
      btnRemove.textContent = 'Removendo...';
      const { success } = await collectionService.removeFromCollection(this.currentUserId, album.id);
      if (success) await this.loadCollection(this.currentUserId);
    });

    return card;
  },

  // === LISTENING NOW ===

  startListeningNow() {
    this.pollListeningNow();
    if (this.listeningInterval) clearInterval(this.listeningInterval);
    this.listeningInterval = setInterval(() => this.pollListeningNow(), 30000);
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
