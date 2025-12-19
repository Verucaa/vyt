import axios from 'axios';

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }

  try {
    const url = new URL(request.url);
    const youtubeUrl = url.searchParams.get('url');

    // Validate input
    if (!youtubeUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL YouTube tidak boleh kosong' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'URL YouTube tidak valid. Pastikan URL benar.' 
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    console.log(`Processing YouTube video: ${videoId}`);

    // Get video info from public API
    const videoData = await getVideoInfo(videoId);
    
    return new Response(
      JSON.stringify(videoData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=3600'
        }
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Terjadi kesalahan server. Coba lagi nanti.',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// Extract YouTube video ID from URL
function extractVideoId(url) {
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

// Get video info and generate download links
async function getVideoInfo(videoId) {
  try {
    // Fetch video metadata
    const metadata = await fetchVideoMetadata(videoId);
    
    // Generate download formats
    const formats = generateDownloadFormats(videoId, metadata.duration);
    
    return {
      success: true,
      meta: {
        title: metadata.title || `YouTube Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        thumbnail_sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        thumbnail_hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoId: videoId,
        duration: metadata.duration || 0,
        duration_formatted: formatDuration(metadata.duration || 0),
        author: metadata.author || 'YouTube Creator'
      },
      formats: formats,
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
    
  } catch (error) {
    // Fallback data jika API gagal
    return getFallbackData(videoId);
  }
}

// Fetch video metadata from YouTube oEmbed
async function fetchVideoMetadata(videoId) {
  try {
    const response = await axios.get(
      `https://www.youtube.com/oembed?url=https://youtube.com/watch?v=${videoId}&format=json`,
      { timeout: 5000 }
    );
    
    return {
      title: response.data.title,
      author: response.data.author_name,
      duration: 0 // YouTube oEmbed tidak memberikan duration
    };
  } catch (error) {
    // Return default data jika gagal
    return {
      title: `YouTube Video ${videoId}`,
      author: 'YouTube Creator',
      duration: 180 // Default 3 menit
    };
  }
}

// Generate download format options
function generateDownloadFormats(videoId, duration) {
  const formats = [];
  
  // Video formats
  const videoQualities = [
    { quality: '144p', resolution: '144p', size: 'Very Low', bitrate: '0.1' },
    { quality: '360p', resolution: '360p', size: 'Low', bitrate: '0.5' },
    { quality: '480p', resolution: '480p', size: 'SD', bitrate: '1' },
    { quality: '720p', resolution: '720p', size: 'HD', bitrate: '2' },
    { quality: '1080p', resolution: '1080p', size: 'Full HD', bitrate: '4' },
    { quality: '4K', resolution: '2160p', size: 'Ultra HD', bitrate: '8' }
  ];
  
  // Audio formats
  const audioQualities = [
    { quality: '64kbps', resolution: 'Low', size: 'Small', bitrate: '64' },
    { quality: '128kbps', resolution: 'Standard', size: 'Medium', bitrate: '128' },
    { quality: '192kbps', resolution: 'High', size: 'Large', bitrate: '192' },
    { quality: '320kbps', resolution: 'Premium', size: 'Extra Large', bitrate: '320' }
  ];
  
  // Add video formats
  videoQualities.forEach((item, index) => {
    const sizeInMB = calculateFileSize(duration, item.bitrate, 'video');
    formats.push({
      type: 'video',
      quality: item.quality,
      resolution: item.resolution,
      size: `${sizeInMB} MB`,
      url: generateDownloadUrl(videoId, 'mp4', item.resolution),
      container: 'mp4',
      hasAudio: true,
      bitrate: `${item.bitrate} Mbps`,
      icon: 'fas fa-video',
      color: 'video'
    });
  });
  
  // Add audio formats
  audioQualities.forEach((item, index) => {
    const sizeInMB = calculateFileSize(duration, item.bitrate, 'audio');
    formats.push({
      type: 'audio',
      quality: `MP3 ${item.quality}`,
      resolution: 'Audio',
      size: `${sizeInMB} MB`,
      url: generateDownloadUrl(videoId, 'mp3', item.quality),
      container: 'mp3',
      hasAudio: true,
      bitrate: `${item.bitrate} kbps`,
      icon: 'fas fa-music',
      color: 'audio'
    });
  });
  
  return formats;
}

// Generate download URL using public services
function generateDownloadUrl(videoId, format, quality) {
  const encodedVideoId = encodeURIComponent(videoId);
  const encodedQuality = encodeURIComponent(quality);
  
  // Menggunakan berbagai download service
  const services = {
    'mp4': `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp4&quality=${quality}`,
    'mp3': `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}&f=mp3`
  };
  
  return services[format] || `https://loader.to/api/button/?url=https://youtube.com/watch?v=${videoId}`;
}

// Calculate estimated file size
function calculateFileSize(durationSeconds, bitrate, type) {
  if (!durationSeconds) durationSeconds = 180; // Default 3 minutes
  
  let sizeMB;
  
  if (type === 'video') {
    // Video size calculation (bitrate in Mbps)
    const bitrateMbps = parseFloat(bitrate);
    sizeMB = (bitrateMbps * durationSeconds) / 8;
  } else {
    // Audio size calculation (bitrate in kbps)
    const bitrateKbps = parseFloat(bitrate);
    sizeMB = (bitrateKbps * durationSeconds) / (8 * 1024);
  }
  
  return Math.round(sizeMB * 10) / 10; // Round to 1 decimal
}

// Format duration from seconds to MM:SS
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Fallback data if everything fails
function getFallbackData(videoId) {
  return {
    success: true,
    meta: {
      title: 'YouTube Video',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnail_sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
      videoId: videoId,
      duration: 180,
      duration_formatted: '3:00',
      author: 'YouTube Creator'
    },
    formats: [
      {
        type: 'video',
        quality: '720p',
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
      }
    ],
    note: 'Menggunakan fallback data. Service online akan digunakan untuk download.'
  };
}
