// shareUI.js — Gera card visual da coleção usando Canvas API

export const shareUI = {

  canvas: null,
  modal: null,
  btnClose: null,
  btnDownload: null,
  btnCopy: null,

  init() {
    this.canvas = document.getElementById('share-canvas');
    this.modal = document.getElementById('share-modal');
    this.btnClose = document.getElementById('btn-close-share');
    this.btnDownload = document.getElementById('btn-download-share');
    this.btnCopy = document.getElementById('btn-copy-share');
    this.setupListeners();
  },

  setupListeners() {
    this.btnClose?.addEventListener('click', () => this.close());
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    this.btnDownload?.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = 'minha-colecao-discboxd.png';
      link.href = this.canvas.toDataURL('image/png');
      link.click();
    });

    this.btnCopy?.addEventListener('click', async () => {
      try {
        const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.btnCopy.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          Copiado!
        `;
        setTimeout(() => {
          this.btnCopy.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copiar
          `;
        }, 2000);
      } catch (err) {
        console.error('Erro ao copiar:', err);
      }
    });
  },

  async open(collection, userName) {
    if (!this.canvas || !this.modal) return;
    this.modal.classList.remove('hidden');
    await this.renderCanvas(collection, userName);
  },

  close() {
    this.modal?.classList.add('hidden');
  },

  async renderCanvas(collection, userName) {
    const ctx = this.canvas.getContext('2d');
    const albums = collection.slice(0, 12); // Max 12 capas
    const cols = Math.min(albums.length, 4);
    const rows = Math.ceil(albums.length / cols);
    const coverSize = 150;
    const gap = 8;
    const padding = 32;
    const headerHeight = 80;
    const footerHeight = 50;

    const w = padding * 2 + cols * coverSize + (cols - 1) * gap;
    const h = headerHeight + padding + rows * coverSize + (rows - 1) * gap + footerHeight;

    this.canvas.width = w;
    this.canvas.height = h;

    // Background gradiente
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#F5F5F7');
    grad.addColorStop(1, '#E8E8ED');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Header (branding)
    ctx.fillStyle = '#1D1D1F';
    ctx.font = 'bold 24px Inter, system-ui, sans-serif';
    ctx.fillText('Discboxd.', padding, 48);

    ctx.fillStyle = '#86868B';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.fillText(`${userName ? userName + ' · ' : ''}${albums.length} álbuns`, padding, 68);

    // Capas dos álbuns
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
      const x = padding + col * (coverSize + gap);
      const y = headerHeight + padding / 2 + row * (coverSize + gap);

      // Sombra
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;

      // Round rectangle clip
      const radius = 12;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + coverSize - radius, y);
      ctx.quadraticCurveTo(x + coverSize, y, x + coverSize, y + radius);
      ctx.lineTo(x + coverSize, y + coverSize - radius);
      ctx.quadraticCurveTo(x + coverSize, y + coverSize, x + coverSize - radius, y + coverSize);
      ctx.lineTo(x + radius, y + coverSize);
      ctx.quadraticCurveTo(x, y + coverSize, x, y + coverSize - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      if (img) {
        ctx.clip();
        ctx.drawImage(img, x, y, coverSize, coverSize);
      } else {
        ctx.fillStyle = '#E5E5EA';
        ctx.fill();
        ctx.fillStyle = '#86868B';
        ctx.font = '32px serif';
        ctx.fillText('💿', x + coverSize / 2 - 16, y + coverSize / 2 + 10);
      }
      ctx.restore();
    });

    // Footer
    const footerY = h - 20;
    ctx.fillStyle = '#C7C7CC';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('discboxd.app · sua vida sonora, catalogada', w / 2, footerY);
    ctx.textAlign = 'start';
  }
};
