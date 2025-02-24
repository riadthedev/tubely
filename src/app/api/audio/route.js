import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set maximum duration to 5 minutes

export async function GET(request) {
  // Get the URL from the search params
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  // Validate the YouTube URL
  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  try {
    // Add user-agent and cookies to mimic a real browser
    const options = {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      }
    };

    const info = await ytdl.getInfo(url, options);
    
    // Get the audio format
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly' 
    });

    if (!format) {
      throw new Error('No audio format found');
    }

    // Instead of streaming directly, return the audio URL and metadata
    return NextResponse.json({
      url: format.url,
      title: info.videoDetails.title,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      format: {
        container: format.container,
        contentLength: format.contentLength,
        audioBitrate: format.audioBitrate
      }
    });

  } catch (error) {
    console.error('Audio fetch error:', error.message, error.stack);
    
    // Add more specific error handling
    if (error.message.includes('Sign in to confirm')) {
      return NextResponse.json({ 
        error: 'YouTube request blocked',
        details: 'Unable to access this video due to YouTube restrictions. Please try again later.' 
      }, { status: 429 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch audio',
      details: error.message 
    }, { status: 500 });
  }
}