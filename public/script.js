// VYT DOWNLOADER - Main Application
class VYTDownloader {
    constructor() {
        // Auto-detect base URL for Vercel
        this.baseUrl = window.location.origin;
        this.currentFormats = [];
        this.currentTab = 'video';
        this.currentVideoData = null;
        
        // Initialize particles
        this.initParticles();
        
        // Initialize the app
        this.init();
    }
    
    // ===== INITIALIZATION =====
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.showWelcomeToast();
    }
    
    cacheDOM() {
        // Input elements
        this.urlInput = document.getElementById('urlInput');
        this.fetchBtn = document.getElementById('fetchBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Loading elements
        this.loading = document.getElementById('loading');
        this.results = document.getElementById('results');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.retryBtn = document.getElementById('retryBtn');
        
        // Video info elements
        this.videoTitle = document.getElementById('videoTitle');
        this.thumbnail = document.getElementById('thumbnail');
        this.duration = document.getElementById('duration');
        this.videoLength = document.getElementById('videoLength');
        this.videoAuthor = document.getElementById('videoAuthor');
        this.videoId = document.getElementById('videoId');
        this.formatCount = document.getElementById('formatCount');
        this.videoCount = document.getElementById('videoCount');
        this.audioCount = document.getElementById('audioCount');
        
        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Format containers
        this.videoFormats = document.getElementById('videoFormats');
        this.audioFormats = document.getElementById('audioFormats');
        this.servicesList = document.getElementById('servicesList');
        
        // Action buttons
        this.copyUrlBtn = document.getElementById('copyUrlBtn');
        this.shareBtn = document.getElementById('shareBtn');
        
        // Toast
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');
        this.toastIcon = document.getElementById('toastIcon');
        
        // Filter buttons
        this.filterBtns = document.querySelectorAll('.filter-btn');
    }
    
    bindEvents() {
        // Input events
        this.fetchBtn.addEventListener('click', () => this.fetchVideoInfo());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.fetchVideoInfo();
        });
        this.clearBtn.addEventListener('click', () => this.clearInput());
        
        // Tab events
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
        });
        
        // Filter events
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterFormats(e.currentTarget.dataset.quality));
        });
        
        // Action events
        this.copyUrlBtn?.addEventListener('click', () => this.copyVideoUrl());
        this.shareBtn?.addEventListener('click', () => this.shareVideo());
        this.retryBtn?.addEventListener('click', () => this.retryFetch());
        
        // URL input validation
        this.urlInput.addEventListener('input', () => this.validateUrl());
    }
    
    // ===== PARTICLE BACKGROUND =====
    initParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        const particleCount = 50;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: ${Math.random() * 3 + 1}px;
                height: ${Math.random() * 3 + 1}px;
                background: ${Math.random() > 0.5 ? 'var(--primary)' : 'var(--secondary)'};
                border-radius: 50%;
                opacity: ${Math.random() * 0.3 + 0.1};
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                filter: blur(${Math.random() * 2}px);
            `;
            particlesContainer.appendChild(particle);
            particles.push({
                element: particle,
                x: Math.random() * 100,
                y: Math.random() * 100,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5
            });
        }
        
        // Animate particles
        const animateParticles = () => {
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                
                // Wrap around edges
                if (p.x > 100) p.x = 0;
                if (p.x < 0) p.x = 100;
                if (p.y > 100) p.y = 0;
                if (p.y < 0) p.y = 100;
                
                p.element.style.left = `${p.x}%`;
                p.element.style.top = `${p.y}%`;
            });
            
            requestAnimationFrame(animateParticles);
        };
        
        animateParticles();
    }
    
    // ===== URL VALIDATION =====
    validateUrl() {
        const url = this.urlInput.value.trim();
        if (!url) {
            this.fetchBtn.disabled = false;
            return;
        }
        
        const isValid = this.isValidYouTubeUrl(url);
        this.fetchBtn.disabled = !isValid;
        
        if (isValid) {
            this.urlInput.style.borderColor = 'var(--success)';
        } else {
            this.urlInput.style.borderColor = 'var(--error)';
        }
    }
    
    isValidYouTubeUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /youtube\.com\/watch\?v=[\w-]{11}/,
            /youtu\.be\/[\w-]{11}/,
            /youtube\.com\/embed\/[\w-]{11}/,
            /youtube\.com\/shorts\/[\w-]{11}/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }
    
    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
            /^([a-zA-Z0-9_-]{11})$/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
    
    // ===== API CALL =====
    async fetchVideoInfo() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showToast('Masukkan URL YouTube terlebih dahulu!', 'error');
            return;
        }
        
        if (!this.isValidYouTubeUrl(url)) {
            this.showToast('URL YouTube tidak valid!', 'error');
            return;
        }
        
        // Reset state
        this.hideAllSections();
        this.loading.classList.remove('hidden');
        this.showLoadingAnimation();
        
        try {
            // Call our Vercel API
            const apiUrl = `${this.baseUrl}/api/download?url=${encodeURIComponent(url)}`;
            console.log('Fetching from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error || !data.success) {
                throw new Error(data.error || 'Gagal mengambil data video');
            }
            
            // Store video data
            this.currentVideoData = data;
            this.currentFormats = data.formats || [];
            
            // Update UI
            this.displayVideoInfo(data.meta);
            this.displayFormats(data.formats);
            this.displayServices(data.download_services);
            
            this.results.classList.remove('hidden');
            this.showToast('Video berhasil di-load!', 'success');
            
        } catch (error) {
            console.error('Fetch error:', error);
            
            // Fallback: Use mock data if API fails
            this.useFallbackData(url);
            
        } finally {
            this.loading.classList.add('hidden');
        }
    }
    
    // Fallback data for demo purposes
    useFallbackData(url) {
        const videoId = this.extractVideoId(url) || 'dQw4w9WgXcQ';
        
        this.currentVideoData = {
            success: true,
            meta: {
                title: 'YouTube Video (Demo Mode)',
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                thumbnail_sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
                videoId: videoId,
                duration: 180,
                duration_formatted: '3:00',
                author: 'YouTube Creator'
            },
            formats: this.generateMockFormats(videoId),
            download_services: [
                {
                    name: 'OnlineConvert',
                    url: `https://www.onlineconverter.com/youtube-to-mp4?id=${videoId}`
                },
                {
                    name: 'Y2Mate',
                    url: `https://www.y2mate.com/youtube/${videoId}`
                }
            ]
        };
        
        this.currentFormats = this.currentVideoData.formats;
        
        // Update UI with fallback data
        this.displayVideoInfo(this.currentVideoData.meta);
        this.displayFormats(this.currentVideoData.formats);
        this.displayServices(this.currentVideoData.download_services);
        
        this.results.classList.remove('hidden');
        this.showToast('Menggunakan data demo. Beberapa fitur mungkin terbatas.', 'warning');
    }
    
    generateMockFormats(videoId) {
        return [
            // Video formats
            {
                type: 'video',
                quality: '4K Ultra HD',
                resolution: '2160p',
                size: '85 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4&quality=2160`,
                container: 'mp4',
                hasAudio: true,
                bitrate: '8 Mbps',
                icon: 'fas fa-video',
                color: 'video'
            },
            {
                type: 'video',
                quality: '1080p Full HD',
                resolution: '1080p',
                size: '45 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4&quality=1080`,
                container: 'mp4',
                hasAudio: true,
                bitrate: '4 Mbps',
                icon: 'fas fa-video',
                color: 'video'
            },
            {
                type: 'video',
                quality: '720p HD',
                resolution: '720p',
                size: '25 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4&quality=720`,
                container: 'mp4',
                hasAudio: true,
                bitrate: '2 Mbps',
                icon: 'fas fa-video',
                color: 'video'
            },
            {
                type: 'video',
                quality: '480p SD',
                resolution: '480p',
                size: '15 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4&quality=480`,
                container: 'mp4',
                hasAudio: true,
                bitrate: '1 Mbps',
                icon: 'fas fa-video',
                color: 'video'
            },
            {
                type: 'video',
                quality: '360p',
                resolution: '360p',
                size: '8 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4&quality=360`,
                container: 'mp4',
                hasAudio: true,
                bitrate: '0.5 Mbps',
                icon: 'fas fa-video',
                color: 'video'
            },
            // Audio formats
            {
                type: 'audio',
                quality: 'MP3 320kbps',
                resolution: 'Audio',
                size: '12 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp3`,
                container: 'mp3',
                hasAudio: true,
                bitrate: '320 kbps',
                icon: 'fas fa-music',
                color: 'audio'
            },
            {
                type: 'audio',
                quality: 'MP3 192kbps',
                resolution: 'Audio',
                size: '8 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp3`,
                container: 'mp3',
                hasAudio: true,
                bitrate: '192 kbps',
                icon: 'fas fa-music',
                color: 'audio'
            },
            {
                type: 'audio',
                quality: 'MP3 128kbps',
                resolution: 'Audio',
                size: '5 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp3`,
                container: 'mp3',
                hasAudio: true,
                bitrate: '128 kbps',
                icon: 'fas fa-music',
                color: 'audio'
            },
            {
                type: 'audio',
                quality: 'MP3 64kbps',
                resolution: 'Audio',
                size: '3 MB',
                url: `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp3`,
                container: 'mp3',
                hasAudio: true,
                bitrate: '64 kbps',
                icon: 'fas fa-music',
                color: 'audio'
            }
        ];
    }
    
    // ===== UI UPDATES =====
    displayVideoInfo(meta) {
        if (!meta) return;
        
        this.videoTitle.textContent = meta.title;
        this.thumbnail.src = meta.thumbnail;
        this.thumbnail.onerror = () => {
            this.thumbnail.src = meta.thumbnail_sd || meta.thumbnail_hq || 'https://via.placeholder.com/300x169?text=No+Thumbnail';
        };
        
        this.duration.textContent = meta.duration_formatted || '0:00';
        this.videoLength.textContent = meta.duration_formatted || '0:00';
        this.videoAuthor.textContent = meta.author || 'YouTube Creator';
        this.videoId.textContent = meta.videoId || 'N/A';
    }
    
    displayFormats(formats) {
        if (!formats || !Array.isArray(formats)) {
            formats = this.generateMockFormats('demo');
        }
        
        // Count formats
        const videoFormats = formats.filter(f => f.type === 'video');
        const audioFormats = formats.filter(f => f.type === 'audio');
        
        this.formatCount.textContent = formats.length;
        this.videoCount.textContent = videoFormats.length;
        this.audioCount.textContent = audioFormats.length;
        
        // Render video formats
        this.videoFormats.innerHTML = '';
        videoFormats.forEach(format => {
            this.videoFormats.appendChild(this.createFormatCard(format));
        });
        
        // Render audio formats
        this.audioFormats.innerHTML = '';
        audioFormats.forEach(format => {
            this.audioFormats.appendChild(this.createFormatCard(format));
        });
        
        // Switch to video tab by default
        this.switchTab('video');
    }
    
    displayServices(services) {
        if (!services || !Array.isArray(services)) return;
        
        this.servicesList.innerHTML = '';
        
        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            
            serviceCard.innerHTML = `
                <div class="service-icon">
                    <i class="fas fa-external-link-alt"></i>
                </div>
                <h4>${service.name}</h4>
                <p>Download video melalui ${service.name}</p>
                <a href="${service.url}" target="_blank" rel="noopener noreferrer" class="service-link">
                    <i class="fas fa-external-link-alt"></i>
                    Buka ${service.name}
                </a>
            `;
            
            this.servicesList.appendChild(serviceCard);
        });
    }
    
    createFormatCard(format) {
        const card = document.createElement('div');
        card.className = 'format-card';
        card.dataset.quality = format.resolution || format.quality;
        card.dataset.type = format.type;
        
        const badgeClass = format.type === 'video' ? 'video' : 'audio';
        const typeIcon = format.type === 'video' ? 'fa-video' : 'fa-music';
        
        card.innerHTML = `
            <div class="format-header">
                <span class="quality-badge ${badgeClass}">${format.resolution || format.quality}</span>
                <span class="format-type">${format.type.toUpperCase()}</span>
            </div>
            <div class="format-body">
                <h4>${format.quality}</h4>
                <div class="format-meta">
                    <span><i class="${typeIcon}"></i> ${format.container.toUpperCase()}</span>
                    ${format.bitrate ? `<span><i class="fas fa-bolt"></i> ${format.bitrate}</span>` : ''}
                    ${format.hasAudio ? `<span><i class="fas fa-volume-up"></i> With Audio</span>` : ''}
                </div>
            </div>
            <div class="format-footer">
                <span class="format-size">${format.size}</span>
                <button class="download-btn" data-url="${format.url}">
                    <i class="fas fa-download"></i> DOWNLOAD
                </button>
            </div>
        `;
        
        // Add download event
        const downloadBtn = card.querySelector('.download-btn');
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.downloadFile(format.url, format.quality, format.container);
        });
        
        return card;
    }
    
    // ===== TAB MANAGEMENT =====
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update active tab button
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Show active tab content
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
        
        // Reset filters when switching tabs
        this.resetFilters();
    }
    
    // ===== FILTERING =====
    filterFormats(quality) {
        // Update active filter button
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === quality);
        });
        
        // Get current tab's format cards
        const currentTabId = `${this.currentTab}Tab`;
        const currentTab = document.getElementById(currentTabId);
        if (!currentTab) return;
        
        const cards = currentTab.querySelectorAll('.format-card');
        
        cards.forEach(card => {
            if (quality === 'all' || card.dataset.quality.includes(quality)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    resetFilters() {
        // Reset all filter buttons
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === 'all');
        });
        
        // Show all cards in current tab
        const currentTabId = `${this.currentTab}Tab`;
        const currentTab = document.getElementById(currentTabId);
        if (!currentTab) return;
        
        const cards = currentTab.querySelectorAll('.format-card');
        cards.forEach(card => {
            card.style.display = 'block';
        });
    }
    
    // ===== DOWNLOAD HANDLING =====
    downloadFile(url, quality, container) {
        if (!url || url.includes('loader.to')) {
            // For loader.to links, open in new tab
            window.open(url, '_blank', 'noopener,noreferrer');
            this.showToast(`Membuka ${quality} di service eksternal...`, 'info');
            return;
        }
        
        // For direct download links (if any)
        const filename = `VYT_${quality}_${Date.now()}.${container}`;
        
        this.showToast(`Mengunduh ${quality}...`, 'info');
        
        // Create temporary link for download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => {
            this.showToast('Download dimulai! Cek tab baru browser.', 'success');
        }, 1000);
    }
    
    // ===== UTILITY FUNCTIONS =====
    clearInput() {
        this.urlInput.value = '';
        this.urlInput.focus();
        this.validateUrl();
    }
    
    copyVideoUrl() {
        if (!this.currentVideoData?.meta?.videoId) return;
        
        const videoUrl = `https://youtube.com/watch?v=${this.currentVideoData.meta.videoId}`;
        
        navigator.clipboard.writeText(videoUrl)
            .then(() => this.showToast('URL video disalin ke clipboard!', 'success'))
            .catch(() => this.showToast('Gagal menyalin URL', 'error'));
    }
    
    shareVideo() {
        if (!this.currentVideoData?.meta?.videoId) return;
        
        const videoUrl = `https://youtube.com/watch?v=${this.currentVideoData.meta.videoId}`;
        const title = this.currentVideoData.meta.title || 'YouTube Video';
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: 'Check out this video on VYT DOWNLOADER',
                url: videoUrl
            }).catch(() => {
                this.copyVideoUrl();
            });
        } else {
            this.copyVideoUrl();
        }
    }
    
    retryFetch() {
        this.errorMessage.classList.add('hidden');
        this.fetchVideoInfo();
    }
    
    showLoadingAnimation() {
        const steps = document.querySelectorAll('.loading-steps .step');
        let currentStep = 0;
        
        const stepInterval = setInterval(() => {
            if (currentStep > 0) {
                steps[currentStep - 1].classList.remove('active');
            }
            
            if (currentStep < steps.length) {
                steps[currentStep].classList.add('active');
                currentStep++;
            } else {
                clearInterval(stepInterval);
            }
        }, 800);
    }
    
    hideAllSections() {
        this.results.classList.add('hidden');
        this.errorMessage.classList.add('hidden');
    }
    
    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.loading.classList.add('hidden');
    }
    
    // ===== TOAST NOTIFICATIONS =====
    showToast(message, type = 'info') {
        // Set icon based on type
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        this.toastIcon.className = `fas ${icons[type] || icons.info}`;
        this.toastMessage.textContent = message;
        
        // Set color based on type
        const colors = {
            success: 'var(--success)',
            error: 'var(--error)',
            warning: 'var(--warning)',
            info: 'var(--info)'
        };
        
        this.toast.style.borderColor = colors[type] || colors.info;
        this.toastIcon.style.color = colors[type] || colors.info;
        
        // Show toast
        this.toast.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    showWelcomeToast() {
        setTimeout(() => {
            this.showToast('Selamat datang di VYT DOWNLOADER! ✨', 'info');
        }, 1000);
    }
}

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    window.vytApp = new VYTDownloader();
    
    // Add service worker for PWA (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('urlInput').focus();
        }
        
        // Escape to clear input
        if (e.key === 'Escape') {
            document.getElementById('urlInput').value = '';
            document.getElementById('urlInput').focus();
        }
    });
});

// ===== MANIFEST.JSON (Optional PWA) =====
// Create manifest.json file in public folder:
/*
{
    "name": "VYT DOWNLOADER",
    "short_name": "VYT",
    "description": "YouTube Downloader with Gen Z Style",
    "theme_color": "#8a2be2",
    "background_color": "#0a0a14",
    "display": "standalone",
    "orientation": "portrait",
    "scope": "/",
    "start_url": "/",
    "icons": [
        {
            "src": "/icon-192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icon-512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}
*/
