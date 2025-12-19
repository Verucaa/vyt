const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint utama untuk fetch data YouTube
app.get('/api/download', async (req, res) => {
    const youtubeUrl = req.query.url;
    
    if (!youtubeUrl) {
        return res.status(400).json({ 
            error: true, 
            message: "URL YouTube tidak boleh kosong" 
        });
    }

    const apiUrl = `https://www.a2zconverter.com/api/files/new-proxy?url=${encodeURIComponent(youtubeUrl)}`;
    
    const headers = {
        'Referer': 'https://www.a2zconverter.com/youtube-video-downloader',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
    };

    try {
        console.log(`📥 Memproses: ${youtubeUrl}`);
        const response = await axios.get(apiUrl, { headers });
        
        // Format respons agar lebih rapi
        const formattedData = {
            success: true,
            title: response.data.meta?.title || "Video YouTube",
            thumbnail: response.data.meta?.thumbnail || "",
            duration: response.data.meta?.duration || 0,
            formats: []
        };

        // Proses format video dan audio
        if (response.data.formats) {
            response.data.formats.forEach(format => {
                if (format.qualityLabel) {
                    // Format video
                    formattedData.formats.push({
                        type: 'video',
                        quality: format.qualityLabel,
                        resolution: format.height + 'p',
                        size: format.approxDurationMs ? 
                              Math.round((format.approxDurationMs / 1000) * 0.5) + ' MB' : 'N/A',
                        url: format.url,
                        container: format.container || 'mp4',
                        hasAudio: format.hasAudio || false
                    });
                } else if (format.audioQuality) {
                    // Format audio
                    formattedData.formats.push({
                        type: 'audio',
                        quality: 'Audio',
                        resolution: format.audioQuality.replace('AUDIO_QUALITY_', ''),
                        size: format.approxDurationMs ? 
                              Math.round((format.approxDurationMs / 1000) * 0.1) + ' MB' : 'N/A',
                        url: format.url,
                        container: format.container || 'mp3',
                        bitrate: format.bitrate || '128kbps'
                    });
                }
            });
        }

        res.json(formattedData);
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        res.status(500).json({ 
            error: true, 
            message: "Gagal mengambil data video. Coba lagi nanti." 
        });
    }
});

// Endpoint untuk download langsung
app.get('/api/proxy', async (req, res) => {
    const fileUrl = req.query.url;
    
    if (!fileUrl) {
        return res.status(400).send('URL tidak valid');
    }

    try {
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', 'attachment');
        response.data.pipe(res);
        
    } catch (error) {
        res.status(500).send('Download gagal');
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server VYT DOWNLOADER berjalan di http://localhost:${PORT}`);
});