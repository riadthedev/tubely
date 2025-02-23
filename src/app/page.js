'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const audioRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/audio?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
    } catch (err) {
      setError('Failed to download audio. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup the object URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 text-center">
          YouTube Audio Player
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-200 mb-2">
                YouTube URL
              </label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors
                ${isLoading 
                  ? 'bg-blue-600 cursor-not-allowed opacity-70'
                  : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {isLoading ? 'Loading...' : 'Load Audio'}
            </button>
          </form>

          {error && (
            <div className="mt-4 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {audioUrl && (
            <div className="mt-6">
              <audio 
                ref={audioRef}
                controls
                className="w-full"
                src={audioUrl}
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-gray-400 text-sm">
          Enter a YouTube video URL above to play its audio.
        </p>
      </div>
    </main>
  );
}
