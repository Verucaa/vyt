class VYTDownloader {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.currentFormats = [];
        this.currentTab = 'video';
        
        this.init();
    }
    
    init() {
        // DOM Elements
        this.urlInput = document.getElementById('urlInput');
        this.fetchBtn = document.getElementById('fetchBtn');
        this.loading = document.getElementById('loading');
        this.videoInfo = document.getElementById('videoInfo');
        this.videoTitle = document.getElementById('videoTitle');
        this.thumbnail = document.getElementById('thumbnail');
        this.duration = document.getElementById('duration');
        this.videoLength = document.getElementById('length');
        this.formatCount = document.getElementById('formatCount');
        this.tabs = document.getElementById('tabs');
        this.videoFormats = document.getElementById('videoFormats');
        this.audioFormats = document.getElementById('audioFormats');
        this.videoCards = document.getElementById('videoCards');
        this.audioCards = document.getElementById('audioCards');
        this.errorMessage = document.getElementById('errorMessage');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Event Listeners
        this.fetchBtn.addEventListener('click', () => this.fetchVideoInfo());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchVideoInfo();
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Quality filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterQuality(e.target.dataset.quality));
        });
        
        // Initial state
        this.showToast('Selamat datang di VYT DOWNLOADER! ✨', 'success');
    }
    
    async fetchVideoInfo() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showToast('Masukkan URL YouTube terlebih dahulu!', 'error');
            return;
        }
        
        // Validasi URL YouTube
        if (!this.isValidYouTubeUrl(url)) {
            this.showToast('URL YouTube tidak valid!', 'error');
            return;
        }
        
        // Reset state
        this.hideAllSections();
        this.loading.classList.remove('hidden');
        
        try {
            const response = await fetch(`${this.baseUrl}/api/download?url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.message);
            }
            
            this.displayVideoInfo(data);
            this.displayFormats(data.formats);
            
        } catch (error) {
            console.error('Fetch error:', error);
            this.showError('Gagal mengambil data video. Pastikan URL benar dan coba lagi.');
        } finally {
            this.loading.classList.add('hidden');
        }
    }
    
    isValidYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /youtube\.com\/watch\?v=[\w-]+/,
            /youtu\.be\/[\w-]+/
        ];
        return patterns.some(pattern => pattern.test(url));
    }
    
    displayVideoInfo(data) {
        this.videoTitle.textContent = data.title;
        this.thumbnail.src = data.thumbnail || 'https://via.placeholder.com/200x113?text=No+Thumbnail';
        this.formatCount.textContent = data.formats.length;
        
        // Format duration
        if (data.duration) {
            const minutes = Math.floor(data.duration / 60);
            const seconds = data.duration % 60;
            this.duration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.videoLength.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        this.videoInfo.classList.remove('hidden');
        this.tabs.classList.remove('hidden');
    }
    
    displayFormats(formats) {
        this.currentFormats = formats;
        
        // Pisahkan video dan audio
        const videoFormats = formats.filter(f => f.type === 'video');
        const audioFormats = formats.filter(f => f.type === 'audio');
        
        // Render video formats
        this.videoCards.innerHTML = '';
        videoFormats.forEach(format => {
            this.videoCards.appendChild(this.createFormatCard(format));
        });
        
        // Render audio formats
        this.audioCards.innerHTML = '';
        audioFormats.forEach(format => {
            this.audioCards.appendChild(this.createFormatCard(format));
        });
        
        // Show current tab
        this.switchTab(this.currentTab);
    }
    
    createFormatCard(format) {
        const card = document.createElement('div');
        card.className = 'format-card';
        card.dataset.quality = format.resolution;
        
        // Badge warna berdasarkan tipe
        const badgeClass = format.type === 'video' ? 'video' : 'audio';
        const typeIcon = format.type === 'video' ? 'fa-video' : 'fa-music';
        
        card.innerHTML = `
            <div class="format-header">
                <span class="quality-badge ${badgeClass}">${format.resolution}</span>
                <span class="format-type">${format.type.toUpperCase()}</span>
            </div>
            <div class="format-body">
                <h4>${format.quality}</h4>
                <div class="format-meta">
                    <span><i class="fas fa-${typeIcon}"></i> ${format.container.toUpperCase()}</span>
                    ${format.bitrate ? `<span><i class="fas fa-bolt"></i> ${format.bitrate}</span>` : ''}
                    ${format.hasAudio ? `<span><i class="fas fa-volume-up"></i> With Audio</span>` : ''}
                </div>
            </div>
            <div class="format-footer">
                <span class="size">${format.size}</span>
                <button class="download-btn" data-url="${format.url}">
                    <i class="fas fa-download"></i> DOWNLOAD
                </button>
            </div>
        `;
        
        // Add download event
        const downloadBtn = card.querySelector('.download-btn');
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile(format.url, `${format.quality}_${format.resolution}.${format.container}`);
        });
        
        return card;
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Show/hide sections
        if (tab === 'video') {
            this.videoFormats.classList.remove('hidden');
            this.audioFormats.classList.add('hidden');
        } else {
            this.videoFormats.classList.add('hidden');
            this.audioFormats.classList.remove('hidden');
        }
    }
    
    filterQuality(quality) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === quality);
        });
        
        // Filter cards
        const cards = this.videoCards.querySelectorAll('.format-card');
        cards.forEach(card => {
            if (quality === 'all' || card.dataset.quality.includes(quality)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    async downloadFile(url, filename) {
        this.showToast(`Mengunduh ${filename}...`, 'info');
        
        // Gunakan proxy untuk download
        const downloadUrl = `${this.baseUrl}/api/proxy?url=${encodeURIComponent(url)}`;
        
        // Create temporary link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast('Download dimulai! Cek folder Downloads.', 'success');
    }
    
    showError(message) {
        this.errorMessage.querySelector('p').textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.errorMessage.classList.add('hidden');
        }, 5000);
    }
    
    showToast(message, type = 'info') {
        this.toastMessage.textContent = message;
        
        // Set color based on type
        this.toast.style.background = type === 'error' ? 'var(--error)' : 
                                     type === 'info' ? 'var(--secondary)' : 
                                     'var(--success)';
        
        this.toast.classList.remove('hidden');
        this.toast.classList.add('show');
        
        // Auto hide
        setTimeout(() => {
            this.toast.classList.remove('show');
            setTimeout(() => this.toast.classList.add('hidden'), 300);
        }, 3000);
    }
    
    hideAllSections() {
        this.videoInfo.classList.add('hidden');
        this.tabs.classList.add('hidden');
        this.videoFormats.classList.add('hidden');
        this.audioFormats.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VYTDownloader();
});