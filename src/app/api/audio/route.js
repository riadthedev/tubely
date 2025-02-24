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
    const info = await ytdl.getInfo(url);
    
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
    return NextResponse.json({ 
      error: 'Failed to fetch audio',
      details: error.message 
    }, { status: 500 });
  }
}