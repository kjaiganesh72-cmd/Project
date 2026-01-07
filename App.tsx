
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Moon, 
  Sun, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Music, 
  Heart, 
  Share2, 
  Home, 
  Compass, 
  Library, 
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Instagram,
  Twitter,
  Facebook
} from 'lucide-react';
import { Song, Category, Section } from './types';
import { TAMIL_SONGS } from './data';
import { getMusicRecommendations } from './geminiService';

// --- Shared Components ---

const SongCard: React.FC<{ 
  song: Song; 
  onPlay: (song: Song) => void; 
  isActive: boolean;
  isPaused: boolean;
}> = ({ song, onPlay, isActive, isPaused }) => {
  return (
    <div 
      onClick={() => onPlay(song)}
      className={`group relative flex flex-col p-4 rounded-xl transition-all duration-300 cursor-pointer 
      ${isActive ? 'bg-kollywood-red/10 border-kollywood-red/30' : 'bg-white dark:bg-slate-800 border-transparent'} 
      hover:shadow-xl hover:scale-[1.02] border border-solid`}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
        <img 
          src={song.image} 
          alt={song.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="w-12 h-12 rounded-full bg-kollywood-red flex items-center justify-center text-white shadow-lg">
            {isActive && !isPaused ? <Pause size={24} fill="white" /> : <Play size={24} className="ml-1" fill="white" />}
          </div>
        </div>
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white truncate text-lg">{song.title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{song.movie}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {song.category}
        </span>
        <span className="text-xs text-slate-400">{song.year}</span>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; onSeeAll?: () => void }> = ({ title, onSeeAll }) => (
  <div className="flex items-center justify-between mb-6 px-4">
    <h2 className="text-2xl font-cinema font-bold text-slate-900 dark:text-white flex items-center gap-3">
      <span className="w-2 h-8 bg-kollywood-red rounded-full"></span>
      {title}
    </h2>
    {onSeeAll && (
      <button className="text-sm font-medium text-kollywood-red hover:underline flex items-center gap-1">
        See All <ChevronRight size={16} />
      </button>
    )}
  </div>
);

// --- Main App ---

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'Home' | 'Explore' | 'Library' | 'AI'>('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [currentSong, setCurrentSong] = useState<Song>(TAMIL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Apply Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Audio Control
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = (song: Song) => {
    if (currentSong.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleSkip = (direction: 'next' | 'prev') => {
    const currentIndex = TAMIL_SONGS.findIndex(s => s.id === currentSong.id);
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % TAMIL_SONGS.length;
    } else {
      nextIndex = (currentIndex - 1 + TAMIL_SONGS.length) % TAMIL_SONGS.length;
    }
    setCurrentSong(TAMIL_SONGS[nextIndex]);
    setIsPlaying(true);
  };

  const filteredSongs = useMemo(() => {
    return TAMIL_SONGS.filter(song => {
      const matchesSearch = 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.movie.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || song.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const sections: { title: string; filter: Section }[] = [
    { title: 'Latest Hits', filter: 'Latest' },
    { title: 'Trending Now', filter: 'Trending' },
    { title: 'Evergreen Classics', filter: 'Classic' },
    { title: 'Movie Specials', filter: 'MovieWise' },
  ];

  const handleAiSearch = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const results = await getMusicRecommendations(aiPrompt);
    setAiResults(results || []);
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 dark:text-slate-100 overflow-x-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-2xl font-cinema font-bold text-kollywood-red flex items-center gap-2">
              <Music className="text-kollywood-red" /> IsaiTamil
            </h1>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {[
              { id: 'Home', icon: Home, label: 'Home' },
              { id: 'Explore', icon: Compass, label: 'Explore' },
              { id: 'Library', icon: Library, label: 'My Library' },
              { id: 'AI', icon: Sparkles, label: 'AI Mood Finder' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-kollywood-red text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold mb-2">Create Playlist</p>
              <p className="text-xs text-slate-500 mb-4">Start organizing your favorite Tamil hits.</p>
              <button className="w-full py-2 bg-kollywood-red hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors">
                New Playlist
              </button>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto pb-32">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-kollywood-dark/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 p-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <button className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            
            <div className="flex-1 relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search songs, movies, or artists..."
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-kollywood-red transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="hidden md:flex items-center gap-4">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <Heart size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-kollywood-gold flex items-center justify-center font-bold text-white shadow-md">
                T
              </div>
            </div>
          </div>
        </header>

        {/* Hero Banner (Only on Home) */}
        {activeTab === 'Home' && !searchQuery && (
          <div className="px-4 md:px-8 pt-8">
            <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden group">
              <img 
                src="https://picsum.photos/seed/kollywood/1200/600" 
                alt="Featured" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                <span className="text-kollywood-gold font-bold tracking-widest text-sm uppercase mb-2">Featured Album</span>
                <h2 className="text-4xl md:text-6xl font-cinema font-bold text-white mb-4">Leo: Das & Co</h2>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handlePlay(TAMIL_SONGS[0])}
                    className="flex items-center gap-2 px-8 py-3 bg-white text-kollywood-dark rounded-full font-bold hover:bg-kollywood-red hover:text-white transition-all shadow-xl"
                  >
                    <Play size={20} fill="currentColor" /> Play Now
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 border border-white/30 text-white rounded-full font-bold hover:bg-white/10 transition-all backdrop-blur-md">
                    <Share2 size={20} /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
          
          {/* Categories */}
          {activeTab !== 'AI' && (
            <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide no-scrollbar">
              {(['All', 'Melody', 'Mass', 'Love', 'Folk', 'Devotional'] as Category[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap font-medium transition-all ${selectedCategory === cat ? 'bg-kollywood-red text-white shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-kollywood-red'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'AI' && (
            <div className="max-w-4xl mx-auto py-12 px-4 text-center">
              <div className="inline-flex p-4 bg-kollywood-red/10 rounded-full mb-6">
                <Sparkles className="text-kollywood-red" size={48} />
              </div>
              <h2 className="text-4xl font-cinema font-bold mb-4">AI Magic Recommendation</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">
                Tell us your mood, a situation, or a feeling, and our AI will curate the perfect Tamil playlist for you.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto mb-12">
                <input 
                  type="text" 
                  placeholder="e.g. 'I'm traveling at night through a rainy highway'..."
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-4 focus:ring-2 focus:ring-kollywood-red outline-none shadow-lg text-lg"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button 
                  onClick={handleAiSearch}
                  disabled={aiLoading}
                  className="bg-kollywood-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? 'Thinking...' : <><Sparkles size={20} /> Get Suggestions</>}
                </button>
              </div>

              {aiResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                  {aiResults.map((rec, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-kollywood-red/10 flex items-center justify-center text-kollywood-red font-bold">{idx + 1}</div>
                        <h4 className="font-bold text-lg">{rec.song}</h4>
                      </div>
                      <p className="text-kollywood-gold font-medium mb-3 text-sm">{rec.movie}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm italic">"{rec.reason}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Normal Home Display */}
          {activeTab !== 'AI' && (
            <>
              {searchQuery || selectedCategory !== 'All' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredSongs.map(song => (
                    <SongCard 
                      key={song.id} 
                      song={song} 
                      onPlay={handlePlay} 
                      isActive={currentSong.id === song.id}
                      isPaused={!isPlaying}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {sections.map(section => (
                    <div key={section.title}>
                      <SectionHeader title={section.title} onSeeAll={() => {}} />
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4">
                        {TAMIL_SONGS.filter(s => s.section === section.filter).map(song => (
                          <SongCard 
                            key={song.id} 
                            song={song} 
                            onPlay={handlePlay} 
                            isActive={currentSong.id === song.id}
                            isPaused={!isPlaying}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-auto py-12 px-8 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-cinema font-bold text-kollywood-red mb-2">IsaiTamil</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs">Connecting Tamil hearts through the soul of music. Built for the lovers of Kollywood cinema.</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-kollywood-red transition-colors"><Instagram size={20} /></a>
              <a href="#" className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-kollywood-red transition-colors"><Twitter size={20} /></a>
              <a href="#" className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:text-kollywood-red transition-colors"><Facebook size={20} /></a>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} IsaiTamil Music. All rights reserved. Designed with ❤️ for Tamil Cinema.
          </div>
        </footer>
      </main>

      {/* Music Player Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-3 md:p-4 h-24 md:h-28 flex flex-col justify-center">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between gap-4">
          
          {/* Song Info */}
          <div className="flex items-center gap-4 w-1/4">
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}>
              <img src={currentSong.image} alt={currentSong.title} className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block overflow-hidden">
              <h4 className="font-bold truncate dark:text-white">{currentSong.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentSong.movie}</p>
            </div>
            <button className="hidden lg:block text-slate-400 hover:text-kollywood-red transition-colors">
              <Heart size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center flex-1 max-w-2xl">
            <div className="flex items-center gap-6 mb-2">
              <button className="text-slate-400 hover:text-kollywood-red" onClick={() => handleSkip('prev')}>
                <SkipBack size={24} fill="currentColor" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-kollywood-red text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} className="ml-1" fill="white" />}
              </button>
              <button className="text-slate-400 hover:text-kollywood-red" onClick={() => handleSkip('next')}>
                <SkipForward size={24} fill="currentColor" />
              </button>
            </div>
            
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] md:text-xs text-slate-500 font-mono w-10 text-right">{formatTime(currentTime)}</span>
              <div 
                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer overflow-hidden group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  if (audioRef.current) audioRef.current.currentTime = percent * duration;
                }}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-kollywood-red rounded-full transition-all duration-100"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>
              <span className="text-[10px] md:text-xs text-slate-500 font-mono w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Other Extra */}
          <div className="hidden md:flex items-center gap-4 w-1/4 justify-end">
            <div className="flex items-center gap-2 group">
              <Volume2 size={20} className="text-slate-400 group-hover:text-kollywood-red" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 h-1 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-kollywood-red cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={currentSong.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={() => handleSkip('next')}
      />
    </div>
  );
}
