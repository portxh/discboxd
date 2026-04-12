// shareUI.js — Gerador de card visual da coleção (Canvas API)
// Formatos: Grid (1:1 Instagram) e Story (9:16 Instagram/WhatsApp)

export const shareUI = {

  canvas: null,
  modal: null,
  btnClose: null,
  btnDownload: null,
  btnCopy: null,
  formatButtons: null,
  currentFormat: 'grid',
  currentCollection: [],
  currentUserName: '',
  currentStats: null,

  // Presets de formato
  FORMATS: {
    grid: { width: 1080, height: 1080, cols: 3, maxAlbums: 9, label: 'Grid (1:1)' },
    story: { width: 1080, height: 1920, cols: 3, maxAlbums: 9, label: 'Story (9:16)' }
  },

  init() {
    this.canvas = document.getElementById('share-canvas');
    this.modal = document.getElementById('share-modal');
    this.btnClose = document.getElementById('btn-close-share');
    this.btnDownload = document.getElementById('btn-download-share');
    this.btnCopy = document.getElementById('btn-copy-share');
    this.formatButtons = document.querySelectorAll('.share-format-btn');
    this.setupListeners();
  },

  setupListeners() {
    this.btnClose?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Format switcher
    this.formatButtons?.forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentFormat = btn.dataset.format;
        this.updateFormatButtons();
        this.renderCanvas();
      });
    });

    this.btnDownload?.addEventListener('click', () => {
      const link = document.createElement('a');
      const formatLabel = this.currentFormat === 'story' ? 'story' : 'grid';
      link.download = `discboxd-colecao-${formatLabel}.png`;
      link.href = this.canvas.toDataURL('image/png');
      link.click();
    });

    this.btnCopy?.addEventListener('click', async () => {
      try {
        const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        const copyBtn = this.btnCopy;
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <span>Copiado!</span>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            <span>Copiar</span>
          `;
        }, 2000);
      } catch (err) {
        console.error('Erro ao copiar:', err);
      }
    });
  },

  updateFormatButtons() {
    this.formatButtons?.forEach(btn => {
      const isActive = btn.dataset.format === this.currentFormat;
      btn.classList.toggle('active', isActive);
      btn.classList.toggle('border-[var(--accent)]', isActive);
      btn.classList.toggle('bg-[var(--accent)]/5', isActive);
      btn.classList.toggle('text-[var(--accent)]', isActive);
      btn.classList.toggle('border-gray-200', !isActive);
      btn.classList.toggle('text-gray-500', !isActive);
    });
  },

  computeStats(collection) {
    const total = collection.length;
    if (total === 0) return { total: 0, topArtist: '—', decade: '—' };

    // Top Artist
    const artistCount = {};
    collection.forEach(entry => {
      const artist = entry.album.artist || 'Desconhecido';
      artistCount[artist] = (artistCount[artist] || 0) + 1;
    });
    const topArtist = Object.entries(artistCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Dominant Decade
    const decadeCount = {};
    collection.forEach(entry => {
      const year = entry.album.release_year;
      if (year) {
        const decade = Math.floor(year / 10) * 10;
        decadeCount[decade] = (decadeCount[decade] || 0) + 1;
      }
    });
    const topDecade = Object.entries(decadeCount).sort((a, b) => b[1] - a[1])[0];
    const decade = topDecade ? `Anos ${topDecade[0]}` : '—';

    return { total, topArtist, decade };
  },

  async open(collection, userName) {
    if (!this.canvas || !this.modal) return;
    this.currentCollection = collection;
    this.currentUserName = userName;
    this.currentStats = this.computeStats(collection);
    this.currentFormat = 'grid';
    this.updateFormatButtons();
    this.modal.classList.remove('hidden');
    await this.renderCanvas();
  },

  close() {
    this.modal?.classList.add('hidden');
  },

  async renderCanvas() {
    const ctx = this.canvas.getContext('2d');
    const format = this.FORMATS[this.currentFormat];
    const { width: W, height: H, cols, maxAlbums } = format;
    const albums = this.currentCollection.slice(0, maxAlbums);
    const stats = this.currentStats;

    this.canvas.width = W;
    this.canvas.height = H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0D0D0D');
    grad.addColorStop(0.5, '#1A1A2E');
    grad.addColorStop(1, '#0D0D0D');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle accent glow
    const glowGrad = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.7);
    glowGrad.addColorStop(0, 'rgba(0, 113, 227, 0.08)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    const padding = 60;

    // === HEADER ===
    let y = padding;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 42px Inter, system-ui, sans-serif';
    ctx.fillText('Discboxd.', padding, y + 38);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '16px Inter, system-ui, sans-serif';
    const subtitle = this.currentUserName ? `${this.currentUserName}` : 'Minha Coleção';
    ctx.fillText(subtitle, padding, y + 62);

    y += 100;

    // === STATS BAR ===
    const statBoxW = (W - padding * 2 - 20) / 3;
    const statBoxH = 72;
    const statsY = y;

    const statItems = [
      { value: String(stats.total), label: 'ÁLBUNS' },
      { value: stats.topArtist.length > 16 ? stats.topArtist.slice(0, 15) + '…' : stats.topArtist, label: 'TOP ARTISTA' },
      { value: stats.decade, label: 'DÉCADA' }
    ];

    statItems.forEach((stat, i) => {
      const sx = padding + i * (statBoxW + 10);
      // Stat card background
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      this.roundRect(ctx, sx, statsY, statBoxW, statBoxH, 16);
      ctx.fill();

      // Stat border
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, sx, statsY, statBoxW, statBoxH, 16);
      ctx.stroke();

      // Stat value
      ctx.fillStyle = '#FFFFFF';
      ctx.font = stat.label === 'ÁLBUNS' ? 'bold 26px Inter, system-ui, sans-serif' : 'bold 15px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stat.value, sx + statBoxW / 2, statsY + (stat.label === 'ÁLBUNS' ? 38 : 35));

      // Stat label
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = 'bold 9px Inter, system-ui, sans-serif';
      ctx.fillText(stat.label, sx + statBoxW / 2, statsY + 58);
    });
    ctx.textAlign = 'start';

    y = statsY + statBoxH + 30;

    // === ALBUM GRID ===
    const gridW = W - padding * 2;
    const gap = 10;
    const rows = Math.ceil(albums.length / cols);
    const coverSize = Math.floor((gridW - (cols - 1) * gap) / cols);

    // Calcular espaço disponível
    const footerHeight = 60;
    const availableH = H - y - footerHeight;
    const actualCoverSize = Math.min(coverSize, Math.floor((availableH - (rows - 1) * gap) / rows));

    // Centralizar grid verticalmente no espaço restante
    const totalGridH = rows * actualCoverSize + (rows - 1) * gap;
    const totalGridW = cols * actualCoverSize + (cols - 1) * gap;
    const gridX = (W - totalGridW) / 2;
    const gridY = y + (availableH - totalGridH) / 2;

    // Load images
    const coverPromises = albums.map(entry => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = entry.album.cover_url || '';
      });
    });

    const images = await Promise.all(coverPromises);

    images.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gridX + col * (actualCoverSize + gap);
      const cy = gridY + row * (actualCoverSize + gap);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;

      const radius = 14;
      this.roundRect(ctx, x, cy, actualCoverSize, actualCoverSize, radius);

      if (img) {
        ctx.clip();
        ctx.drawImage(img, x, cy, actualCoverSize, actualCoverSize);
      } else {
        ctx.fillStyle = '#2A2A3E';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.fillText('💿', x + actualCoverSize / 2, cy + actualCoverSize / 2 + 14);
        ctx.textAlign = 'start';
      }
      ctx.restore();
    });

    // === FOOTER ===
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('discboxd · sua vida sonora, catalogada', W / 2, H - 28);
    ctx.textAlign = 'start';
  },

  // Utility: draw rounded rectangle path
  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};
