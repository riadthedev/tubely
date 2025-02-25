import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set maximum duration to 1 minutes

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
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'audio',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        }
      }
    };

    const info = await ytdl.getInfo(url, options);
    
    // Get the audio format with more specific criteria
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly',
      format: 'mp4'  // Specify mp4 format which is more widely supported
    });

    // Add format validation
    if (!format || !format.url) {
      throw new Error('No valid audio format found');
    }

    // Verify the URL is accessible
    try {
      const testResponse = await fetch(format.url, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error('Audio URL not accessible');
      }
    } catch (urlError) {
      throw new Error('Failed to validate audio URL: ' + urlError.message);
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