import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, Leaf, CheckSquare, Flame, Moon, Sun, Plus, 
  Trash2, Award, FileText, Settings, Play, Pause, RefreshCw, LogOut, Sparkles, Maximize2, Minimize2,
  Music, SkipForward, SkipBack
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export default function App() {
  // Authentication & Leaderboard States
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  // Theme & Layout States
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('timer');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef(null);
  
  // Custom Timer States
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Focus Category Streams
  const [subjects, setSubjects] = useState(['Coding', 'Math', 'Reading', 'Design']);
  const [selectedSubject, setSelectedSubject] = useState('Coding');
  const [newSubject, setNewSubject] = useState('');

  // Personal Progress & Storage Hook Metrics
  const [forest, setForest] = useState(() => JSON.parse(localStorage.getItem('ss_forest')) || []);
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('ss_todos')) || []);
  const [notes, setNotes] = useState(() => localStorage.getItem('ss_notes') || '');
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('ss_streak')) || 0);
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('ss_stats')) || { today: 0, week: 0 });

  // Real-Time Canvas Tree Growth Scaling Formula
  const totalSessionSeconds = (isBreak ? customBreak : customWork) * 60;
  const currentSecondsLeft = (minutes * 60) + seconds;
  const focusRatio = isActive || currentSecondsLeft < totalSessionSeconds 
    ? ((totalSessionSeconds - currentSecondsLeft) / totalSessionSeconds) 
    : 0;

function App() {
  // Lofi Audio Stream Controls
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioStream] = useState(new Audio('https://stream.zeno.fm/0r0xa792kwzuv')); // Continuous 24/7 Lofi Cafe Stream

  const toggleLofiPlayback = () => {
    if (isAudioPlaying) {
      audioStream.pause();
      setIsAudioPlaying(false);
    } else {
      audioStream.play().catch(err => console.log("Audio playback user gesture block:", err));
      setIsAudioPlaying(true);
    }
  };

  // Clean up and pause the background audio stream if the user closes or refreshes the tab
  useEffect(() => {
    return () => {
      audioStream.pause();
    };
  }, [audioStream]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-6 selection:bg-purple-500/30">
      {/* App Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          StudySprint
        </h1>
        <p className="text-sm text-gray-400 mt-2 tracking-wide">Your Ultimate Aesthetic Focus Dashboard</p>
      </header>

      {/* Main Workspace Layout Grid */}
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* LEFT COLUMN: Lofi Station Widget */}
        <section className="bg-gray-800/60 backdrop-blur-md border border-gray-700 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-between text-center min-h-[240px] transition-all duration-300 hover:border-purple-500/40">
          <h3 className="text-xs font-bold tracking-widest text-purple-400 uppercase flex items-center gap-2">
            🎵 LOFI CAFE STATION
          </h3>
          
          <div className="my-2">
            <p className="text-xl font-semibold text-gray-100">
              {isAudioPlaying ? 'Streaming Live Vibes' : 'Station Paused'}
            </p>
            <p className="text-xs text-gray-400 mt-1.5 font-medium tracking-wide">24/7 Focus Beats</p>
          </div>

          <button
            onClick={toggleLofiPlayback}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isAudioPlaying 
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/40 animate-pulse' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
          >
            {isAudioPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 ml-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            )}
          </button>
        </section>

        {/* RIGHT COLUMN: Focus Placeholder / Timer Space */}
        <section className="bg-gray-800/40 border border-gray-700/60 p-6 rounded-2xl min-h-[240px] flex flex-col justify-center items-center text-center">
          <span className="text-gray-500 text-sm">Your timers and tasks will fit perfectly over here.</span>
        </section>

      </main>
    </div>
  );
}

export default App;
  // Firebase Base Synchronization Engine (Restored!)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        syncUserToFirestore(currentUser, forest.length * customWork + stats.today, streak);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const leaderboardQuery = query(collection(db, 'users'), orderBy('score', 'desc'));
    const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalLeaderboard(usersList);
    }, (error) => console.error(error));
    return () => unsubscribeLeaderboard();
  }, []);

  const syncUserToFirestore = async (currentUser, currentScore, currentStreak) => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        name: currentUser.displayName || 'Anonymous User',
        photoURL: currentUser.photoURL || '',
        score: Number(currentScore),
        streak: Number(currentStreak),
        lastActive: new Date().toISOString()
      }, { merge: true });
    } catch (e) { console.error("Sync Error:", e); }
  };

  useEffect(() => { 
    localStorage.setItem('ss_forest', JSON.stringify(forest)); 
    if (user) syncUserToFirestore(user, forest.length * customWork + stats.today, streak);
  }, [forest]);

  useEffect(() => { localStorage.setItem('ss_todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('ss_notes', notes); }, [notes]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setActiveTab('timer'); } catch (e) { console.error(e); }
  };

  // Clock Countdown Loops
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (seconds === 0) {
          if (minutes === 0) {
            triggerCompletion();
            clearInterval(interval);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else { clearInterval(interval); }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(isBreak ? customBreak : customWork);
    setSeconds(0);
  };

  const applyCustomSettings = (e) => {
    e.preventDefault();
    setMinutes(customWork);
    setSeconds(0);
    setIsActive(false);
    setIsBreak(false);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (fullscreenRef.current.requestFullscreen) fullscreenRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const triggerCompletion = () => {
    setIsActive(false);
    if (!isBreak) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setForest([...forest, { id: Date.now(), subject: selectedSubject, date: new Date().toLocaleDateString() }]);
      setStats(prev => ({ today: prev.today + customWork, week: prev.week + customWork }));
      setStreak(prev => prev + 1);
      setIsBreak(true);
      setMinutes(customBreak);
    } else {
      setIsBreak(false);
      setMinutes(customWork);
    }
  };

  const handleAddSubject = (e) => {
    e.preventDefault();
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setSelectedSubject(newSubject.trim());
      setNewSubject('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#223030] flex flex-col items-center justify-center text-[#EFEFE9]">
        <div className="w-12 h-12 border-4 border-[#959D90]/20 border-t-[#BBA58F] rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold tracking-widest uppercase text-[#BBA58F]">Synchronizing Cozy Lounge...</p>
      </div>
    );
  }

  // 🔐 Full Restored Google Gateway Wall Component 
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ${darkMode ? 'bg-[#223030] text-[#EFEFE9]' : 'bg-[#EFEFE9] text-[#223030]'}`}>
        <div className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#959D90] rounded-xl text-white shadow-sm"><Leaf className="w-5 h-5" /></div>
            <span className="font-serif font-bold text-lg tracking-wide">StudySprint</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl border border-[#959D90]/20">
            {darkMode ? <Sun className="w-4 h-4 text-[#BBA58F]" /> : <Moon className="w-4 h-4 text-[#523D35]" />}
          </button>
        </div>

        <main className="max-w-4xl mx-auto w-full px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center my-auto">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-[#959D90]/20 bg-[#523D35]/20 text-[#BBA58F]">
              <Sparkles className="w-3.5 h-3.5" /> <span>Workspace Workspace Operational</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight">
              Slow down. <br /> Grow your <span className="italic font-semibold text-[#BBA58F]">virtual sanctuary</span>.
            </h1>
            <p className="text-sm leading-relaxed max-w-sm text-[#BBA58F]">
              An intentional cozy ecosystem syncing micro-tasks, collective leaderboards, and personalized soundscapes.
            </p>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl border ${darkMode ? 'bg-[#523D35]/10 border-[#959D90]/20' : 'bg-white border-[#BBA58F]/30'}`}>
            <div className="p-3 bg-[#523D35]/30 text-[#BBA58F] border border-[#959D90]/20 rounded-2xl w-fit mx-auto mb-4">
              <Timer className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif font-bold text-center mb-1">Welcome Home</h2>
            <p className="text-xs text-center text-[#BBA58F] mb-8">Securely sign in with Google to access your global scoreboard lounge.</p>
            <button 
              onClick={handleLogin} 
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 text-sm font-semibold rounded-2xl bg-[#EFEFE9] text-[#223030] hover:bg-[#E8D9CD] transition-colors shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.227C18.29 1.157 15.54 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.853 11.57-11.77 0-.795-.085-1.4-.195-1.945H12.24z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </main>
        <footer className="text-center py-6 text-xs text-[#959D90]">&copy; 2026 StudySprint by Hayl</footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-[#223030] text-[#EFEFE9]' : 'bg-[#EFEFE9] text-[#223030]'}`}>
      
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 ${darkMode ? 'border-[#959D90]/10 bg-[#223030]/90' : 'border-[#BBA58F]/20 bg-[#EFEFE9]/90'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#959D90] rounded-xl text-white shadow-sm"><Leaf className="w-5 h-5" /></div>
            <span className="font-serif font-bold text-xl tracking-wide">StudySprint</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#959D90]/20 bg-[#523D35]/20 text-[#BBA58F]">
              <Flame className="w-4 h-4 fill-current" /> <span>{streak} Day Habit Streak</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#959D90]/20 bg-[#523D35]/20 text-[#BBA58F]">
              <Timer className="w-4 h-4" /> <span>{stats.today}m Gathered Today</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl border border-[#959D90]/20">
              {darkMode ? <Sun className="w-5 h-5 text-[#BBA58F]" /> : <Moon className="w-5 h-5 text-[#523D35]" />}
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-[#959D90]/20">
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#BBA58F]" />
              <button onClick={handleLogout} className="p-2 text-[#959D90] hover:text-[#BBA58F]"><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <nav className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {[
            { id: 'timer', label: 'Focus Hearth', icon: Timer },
            { id: 'forest', label: 'My Sanctuary', icon: Leaf, count: forest.length },
            { id: 'todos', label: 'Intentions', icon: CheckSquare, count: todos.filter(t=>!t.completed).length },
            { id: 'notes', label: 'Notebook', icon: FileText },
            { id: 'leaderboard', label: 'The Lounge', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all whitespace-nowrap min-w-[140px] lg:min-w-0 ${
                  isSelected ? 'bg-[#523D35] text-[#EFEFE9] shadow-md' : 'text-[#BBA58F] hover:bg-[#523D35]/20'
                }`}
              >
                <Icon className="w-4 h-4" /> <span className="flex-1 text-left font-serif">{tab.label}</span>
                {tab.count !== undefined && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#523D35]/10 text-[#523D35]">{tab.count}</span>}
              </button>
            );
          })}
        </nav>

        <section className="lg:col-span-9 space-y-6">
          
          {activeTab === 'timer' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fullscreen Core Screen with Live Tree Ecosystem */}
              <div 
                ref={fullscreenRef}
                className={`md:col-span-2 p-10 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all border ${
                  isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none bg-[#223030] text-[#EFEFE9]' : 'bg-[#523D35]/10 border-[#959D90]/10'
                }`}
              >
                <button onClick={toggleFullscreen} className="absolute top-6 right-6 p-2 text-[#BBA58F] hover:bg-[#523D35]/10">
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                {/* Live Growing Micro-Tree Component */}
                <div className="w-40 h-44 flex flex-col items-center justify-end relative mb-4">
                  <div className="w-24 h-3 bg-[#523D35] rounded-full opacity-60 z-10"></div>
                  <div 
                    style={{ height: `${Math.max(12, focusRatio * 110)}px`, backgroundColor: '#523D35', width: `${Math.max(6, 14 - (focusRatio * 6))}px` }}
                    className="rounded-t-md transition-all duration-1000 relative flex justify-center"
                  >
                    {focusRatio > 0.4 && <div className="absolute -top-3 -left-6 w-8 h-2 bg-[#523D35] rotate-[35deg] rounded-full origin-right"><div className="w-4 h-4 rounded-full bg-[#959D90] absolute -top-2 -left-1"></div></div>}
                    {focusRatio > 0.7 && <div className="absolute -top-6 -right-6 w-8 h-2 bg-[#523D35] -rotate-[35deg] rounded-full origin-left"><div className="w-4 h-4 rounded-full bg-[#959D90] absolute -top-2 -right-1"></div></div>}
                    <div style={{ transform: `scale(${focusRatio * 1.6})` }} className="absolute -top-8 w-10 h-10 rounded-full bg-[#959D90] flex items-center justify-center transition-all duration-1000">🍃</div>
                  </div>
                  <span className="text-[10px] text-[#BBA58F] mt-2 font-mono uppercase tracking-widest">{focusRatio === 0 ? 'Dormant Seed' : focusRatio >= 1 ? 'Fully Grown' : 'Focus Sprouting...'}</span>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-[#BBA58F] uppercase tracking-wider font-semibold">Focusing On:</span>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="text-xs font-semibold rounded-xl px-3 py-1.5 bg-[#223030] border border-[#959D90]/20 text-[#BBA58F] outline-none">
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <h1 className={`font-light tracking-tighter tabular-nums font-serif my-2 ${isFullscreen ? 'text-9xl' : 'text-7xl md:text-8xl'}`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </h1>

                <div className="flex items-center gap-3 mt-2">
                  <button onClick={toggleTimer} className="px-8 py-3.5 rounded-2xl bg-[#523D35] text-white font-semibold flex items-center gap-2 hover:bg-[#223030] transition-all">
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="font-serif text-sm">{isActive ? 'Pause' : 'Begin'}</span>
                  </button>
                  <button onClick={resetTimer} className="p-3.5 rounded-2xl border border-[#959D90]/20 text-[#BBA58F]"><RefreshCw className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Sidebar Settings Panel & Real User Spotify Integration Remote */}
              <div className="space-y-6">
                <div className="p-5 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif font-bold text-xs flex items-center gap-1.5 text-[#BBA58F] uppercase tracking-wide">🎵 Spotify Remote</h3>
                    {spotifyUser && <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">Linked</span>}
                  </div>
                  {!spotifyToken ? (
                    <button onClick={handleSpotifyLogin} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors">Connect Personal Spotify</button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-[#223030]/40 p-2.5 rounded-xl border border-[#959D90]/10">
                        <div className="w-12 h-12 bg-[#523D35] rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {playbackState.albumArt ? <img src={playbackState.albumArt} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-[#BBA58F]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#EFEFE9] truncate">{playbackState.trackName}</p>
                          <p className="text-[10px] text-[#BBA58F] truncate">{playbackState.artistName}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-[#EFEFE9]">
                        <button onClick={() => triggerSpotifyAction('previous', 'POST')} className="p-2 hover:text-[#BBA58F]"><SkipBack className="w-4 h-4" /></button>
                        <button onClick={() => triggerSpotifyAction(playbackState.isPlaying ? 'pause' : 'play', 'PUT')} className="p-3 bg-[#523D35] rounded-full text-white">{playbackState.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                        <button onClick={() => triggerSpotifyAction('next', 'POST')} className="p-2 hover:text-[#BBA58F]"><SkipForward className="w-4 h-4" /></button>
                      </div>
                      <div className="text-center"><button onClick={handleSpotifyLogout} className="text-[10px] text-[#BBA58F] hover:underline">Disconnect Player Account</button></div>
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10">
                  <h3 className="font-serif font-bold text-xs flex items-center gap-2 mb-4 text-[#BBA58F] uppercase"><Settings className="w-3.5 h-3.5" /> Intervals</h3>
                  <form onSubmit={applyCustomSettings} className="space-y-3.5">
                    <div>
                      <label className="text-[10px] text-[#BBA58F] font-semibold block mb-0.5">Focus Duration</label>
                      <input type="number" value={customWork} onChange={e => setCustomWork(Math.max(1, Number(e.target.value)))} className="w-full px-3 py-2 rounded-xl text-xs bg-[#223030]/50 border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                    </div>
                    <button type="submit" className="w-full py-2 rounded-xl bg-[#523D35] text-white font-serif text-xs">Update Configurations</button>
                  </form>
                </div>

                <div className="p-5 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10">
                  <h3 className="font-serif font-bold text-xs flex items-center gap-2 mb-3 text-[#BBA58F] uppercase"><Plus className="w-4 h-4" /> Add Stream</h3>
                  <form onSubmit={handleAddSubject} className="flex gap-2">
                    <input type="text" placeholder="Physics" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="flex-1 px-3 py-2 rounded-xl text-xs bg-[#223030]/50 border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                    <button type="submit" className="p-2 bg-[#959D90] rounded-xl text-white"><Plus className="w-4 h-4" /></button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forest' && (
            <div className="p-6 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-4"><Leaf className="w-5 h-5 text-[#959D90]" /> Mature Canopy Oasis</h2>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {forest.map(tree => (
                  <div key={tree.id} className="p-3 bg-[#223030]/30 border border-[#959D90]/10 rounded-2xl flex flex-col items-center justify-center">
                    <span className="text-3xl mb-1">🌳</span>
                    <span className="text-[10px] text-[#BBA58F] font-mono truncate max-w-full">{tree.subject}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 📝 Fully Restored Tasks / Intentions Tab Panel Content */}
          {activeTab === 'todos' && (
            <div className="p-6 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10 space-y-6">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2"><CheckSquare className="w-5 h-5 text-[#959D90]" /> Daily Intentions</h2>
              <form onSubmit={(e) => { e.preventDefault(); const txt = e.target.elements.todoText.value; if(txt.trim()){setTodos([...todos, {id: Date.now(), text: txt, completed: false}]); e.target.reset();} }} className="flex gap-2">
                <input name="todoText" type="text" placeholder="What is your focus target right now?" className="flex-1 px-4 py-3 rounded-xl text-sm bg-[#223030] border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                <button type="submit" className="px-5 bg-[#523D35] rounded-xl text-white font-serif text-sm">Add Target</button>
              </form>
              <div className="space-y-2">
                {todos.map(todo => (
                  <div key={todo.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#223030]/40 border border-[#959D90]/10">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={todo.completed} onChange={() => setTodos(todos.map(t => t.id === todo.id ? {...t, completed: !t.completed} : t))} className="w-4 h-4 rounded border-[#BBA58F] accent-[#959D90]" />
                      <span className={`text-sm ${todo.completed ? 'line-through text-[#BBA58F]' : 'text-[#EFEFE9]'}`}>{todo.text}</span>
                    </div>
                    <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))} className="text-[#BBA58F] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="p-6 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10 space-y-4">
              <h2 className="text-xl font-serif font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-[#959D90]" /> Session Journal</h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Log session updates here..." className="w-full h-64 p-4 rounded-2xl text-sm bg-[#223030]/30 border border-[#959D90]/10 text-[#EFEFE9] outline-none font-serif resize-none leading-relaxed" />
            </div>
          )}

          {/* 🏆 Fully Restored Firebase Live Lounge Scoreboard Panel Content */}
          {activeTab === 'leaderboard' && (
            <div className="p-6 rounded-3xl border bg-[#523D35]/10 border-[#959D90]/10 space-y-4">
              <div>
                <h2 className="text-xl font-serif font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#959D90]" /> Shared Standings</h2>
                <p className="text-xs text-[#BBA58F]">A quiet gathering space showing collective study rhythms from your teammates.</p>
              </div>
              <div className="divide-y divide-[#BBA58F]/10">
                {globalLeaderboard.map((leader, idx) => {
                  const isCurrentUser = leader.id === user?.uid;
                  return (
                    <div key={leader.id} className={`flex items-center justify-between py-3.5 px-3 rounded-xl ${isCurrentUser ? 'bg-[#523D35]/20 border border-[#959D90]/20' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-[#BBA58F] text-[#223030]' : 'text-[#BBA58F]'}`}>{idx + 1}</span>
                        {leader.photoURL && <img src={leader.photoURL} alt="" className="w-6 h-6 rounded-full border border-[#BBA58F]/30" />}
                        <span className="text-sm font-serif">{leader.name} {isCurrentUser && '(You)'}</span>
                      </div>
                      <div className="flex items-center gap-6 text-xs">
                        <span className="text-[#BBA58F]">{leader.score || 0} mins</span>
                        <span className="text-[#959D90] font-bold">🔥 {leader.streak || 0}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
