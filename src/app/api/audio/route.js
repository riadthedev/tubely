import ytdl from '@distube/ytdl-core';
import { NextResponse } from 'next/server';

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
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly' 
    });

    if (!format) {
      throw new Error('No audio format found');
    }

    const stream = ytdl(url, {
      format: format,
      highWaterMark: 1 << 25, // 32MB buffer
      requestOptions: {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9'
        }
      }
    });

    // Return the stream as a Response with appropriate headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
        'Content-Disposition': `inline; filename="${info.videoDetails.title}.mp3"`.replace(/[^\x00-\x7F]/g, '_')
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