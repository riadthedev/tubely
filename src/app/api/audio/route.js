import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum duration to 60 seconds (Vercel hobby plan limit)

export async function GET(request) {
  // Get the URL from the search params
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  // Validate the YouTube URL
  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    
    // Get the audio format
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly' 
    });

    if (!format) {
      throw new Error('No audio format found');
    }

    // Check if video duration exceeds Vercel's timeout limit
    const duration = parseInt(info.videoDetails.lengthSeconds);
    if (duration > 600) { // 10 minutes max
      throw new Error('Video is too long. Please choose a video under 10 minutes.');
    }

    // Instead of streaming directly, return the audio URL and metadata
    return NextResponse.json({
      url: format.url,
      title: info.videoDetails.title,
      duration: duration,
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      format: {
        container: format.container,
        contentLength: format.contentLength,
        audioBitrate: format.audioBitrate
      }
    });

  } catch (error) {
    console.error('Audio fetch error:', error.message, error.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch audio',
      details: error.message 
    }, { status: 500 });
  }
}