import React, { useState, useEffect, useRef } from 'react';
import {
  Timer, Leaf, CheckSquare, Flame, Moon, Sun, Plus,
  Trash2, Award, FileText, Settings, Play, Pause, RefreshCw, LogOut, Maximize2, Minimize2,
  Music
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
  const [leaderboardError, setLeaderboardError] = useState(null);

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
  const [stats, setStats] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('ss_stats')) || {};
    return { today: saved.today || 0, week: saved.week || 0, total: saved.total || 0 };
  });

  // Lofi Audio Stream Controls
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef(null);
  if (!audioRef.current) {
    audioRef.current = new Audio('https://stream.zeno.fm/0r0xa792kwzuv'); // Continuous 24/7 Lofi Cafe Stream
  }

  const toggleLofiPlayback = () => {
    const audioStream = audioRef.current;
    if (isAudioPlaying) {
      audioStream.pause();
      setIsAudioPlaying(false);
    } else {
      audioStream.play().catch(err => console.log('Audio playback user gesture block:', err));
      setIsAudioPlaying(true);
    }
  };

  // Clean up and pause the background audio stream if the user closes or refreshes the tab
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Real-Time Canvas Tree Growth Scaling Formula
  const totalSessionSeconds = (isBreak ? customBreak : customWork) * 60;
  const currentSecondsLeft = (minutes * 60) + seconds;
  const focusRatio = isActive || currentSecondsLeft < totalSessionSeconds
    ? ((totalSessionSeconds - currentSecondsLeft) / totalSessionSeconds)
    : 0;

  // Firebase Sync Engine
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        syncUserToFirestore(currentUser, stats.total, streak);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const leaderboardQuery = query(collection(db, 'users'), orderBy('score', 'desc'));
    const unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalLeaderboard(usersList);
      setLeaderboardError(null);
    }, (error) => {
      console.error(error);
      setLeaderboardError(error.message || 'Could not load the leaderboard.');
    });
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
    } catch (e) { console.error('Sync Error:', e); }
  };

  useEffect(() => {
    localStorage.setItem('ss_forest', JSON.stringify(forest));
    if (user) syncUserToFirestore(user, stats.total, streak);
  }, [forest]);

  useEffect(() => { localStorage.setItem('ss_todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('ss_notes', notes); }, [notes]);
  useEffect(() => { localStorage.setItem('ss_streak', String(streak)); }, [streak]);
  useEffect(() => { localStorage.setItem('ss_stats', JSON.stringify(stats)); }, [stats]);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setActiveTab('timer'); } catch (e) { console.error(e); }
  };

  // Clock Countdown Loop
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
    } else {
      clearInterval(interval);
    }
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
      setStats(prev => ({ today: prev.today + customWork, week: prev.week + customWork, total: prev.total + customWork }));
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

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ${darkMode ? 'bg-[#223030] text-[#EFEFE9]' : 'bg-[#EFEFE9] text-[#223030]'}`}>
        <div className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#959D90] rounded-lg text-white shadow-sm"><Leaf className="w-5 h-5" /></div>
            <span className="font-serif font-bold text-lg tracking-wide">StudySprint</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg border border-[#959D90]/20">
            {darkMode ? <Sun className="w-4 h-4 text-[#BBA58F]" /> : <Moon className="w-4 h-4 text-[#523D35]" />}
          </button>
        </div>

        <main className="max-w-4xl mx-auto w-full px-6 py-12 grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12 md:gap-8 items-center my-auto">
          <div className="space-y-5 text-center md:text-left">
            <p className="text-xs font-mono uppercase tracking-widest text-[#959D90]">A timer, a notebook, a small forest</p>
            <h1 className="text-4xl md:text-5xl font-serif font-normal tracking-tight leading-tight">
              Sit down. Focus for a bit. <span className="italic font-semibold text-[#BBA58F]">Watch something grow.</span>
            </h1>
            <p className="text-sm leading-relaxed max-w-sm text-[#BBA58F] md:mx-0 mx-auto">
              Pomodoro timer, a running list of tasks, a notes page, and a quiet leaderboard if you want to compare notes with anyone else using it.
            </p>
          </div>

          <div className={`p-7 md:mt-6 rounded-2xl shadow-xl border ${darkMode ? 'bg-[#523D35]/10 border-[#959D90]/20' : 'bg-white border-[#BBA58F]/30'}`}>
            <Timer className="w-6 h-6 text-[#BBA58F] mb-4" />
            <h2 className="text-lg font-serif font-bold mb-1">Sign in to start</h2>
            <p className="text-xs text-[#BBA58F] mb-6 leading-relaxed">Your sessions, streak, and forest are saved to your account.</p>
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 text-sm font-semibold rounded-xl bg-[#EFEFE9] text-[#223030] hover:bg-[#E8D9CD] transition-colors shadow-md"
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

          <div className="hidden md:flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-[#BBA58F]">
              <Flame className="w-4 h-4 fill-current text-[#959D90]" /> <span>{streak}-day streak</span>
            </div>
            <span className="text-[#959D90]/30">·</span>
            <div className="flex items-center gap-1.5 text-[#BBA58F]">
              <span>{stats.today}m today</span>
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

        <nav className="lg:col-span-3 flex lg:flex-col gap-0.5 overflow-x-auto pb-2 lg:pb-0">
          {[
            { id: 'timer', label: 'Timer', icon: Timer },
            { id: 'forest', label: 'Forest', icon: Leaf, count: forest.length },
            { id: 'todos', label: 'Tasks', icon: CheckSquare, count: todos.filter(t => !t.completed).length },
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'leaderboard', label: 'Leaderboard', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 font-medium text-sm transition-all whitespace-nowrap min-w-[120px] lg:min-w-0 border-l-2 ${
                  isSelected ? 'border-[#959D90] text-[#EFEFE9] bg-[#523D35]/15' : 'border-transparent text-[#BBA58F] hover:bg-[#523D35]/10'
                }`}
              >
                <Icon className="w-4 h-4" /> <span className="flex-1 text-left">{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && <span className="text-[10px] text-[#959D90]">{tab.count}</span>}
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
                className={`md:col-span-2 p-10 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all border ${
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
                  <span className="text-[10px] text-[#BBA58F] mt-2">{focusRatio === 0 ? 'Not started' : focusRatio >= 1 ? 'Grown' : 'Growing...'}</span>
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-[#BBA58F]">Working on</span>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="text-xs font-semibold rounded-xl px-3 py-1.5 bg-[#223030] border border-[#959D90]/20 text-[#BBA58F] outline-none">
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <h1 className={`font-light tracking-tighter tabular-nums font-serif my-2 ${isFullscreen ? 'text-9xl' : 'text-7xl md:text-8xl'}`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </h1>

                <div className="flex items-center gap-3 mt-2">
                  <button onClick={toggleTimer} className="px-8 py-3 rounded-xl bg-[#523D35] text-white font-semibold flex items-center gap-2 hover:bg-[#223030] transition-all">
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="text-sm">{isActive ? 'Pause' : 'Start'}</span>
                  </button>
                  <button onClick={resetTimer} className="p-3 rounded-xl border border-[#959D90]/20 text-[#BBA58F]"><RefreshCw className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Sidebar: Lofi Player + Settings */}
              <div className="space-y-5">
                <div className="p-5 rounded-xl border bg-[#523D35]/10 border-[#959D90]/10 flex items-center gap-4">
                  <button
                    onClick={toggleLofiPlayback}
                    className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isAudioPlaying ? 'bg-[#959D90] text-white' : 'bg-[#223030]/50 text-[#BBA58F] hover:bg-[#223030]/70'
                    }`}
                  >
                    {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-[#EFEFE9] flex items-center gap-1.5"><Music className="w-3 h-3 text-[#BBA58F]" /> Lofi station</p>
                    <p className="text-[11px] text-[#BBA58F] mt-0.5">{isAudioPlaying ? 'Playing' : 'Paused'}</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border bg-[#523D35]/10 border-[#959D90]/10">
                  <h3 className="font-semibold text-xs flex items-center gap-2 mb-4 text-[#BBA58F]"><Settings className="w-3.5 h-3.5" /> Timer length</h3>
                  <form onSubmit={applyCustomSettings} className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[#BBA58F] font-semibold block mb-0.5">Focus (minutes)</label>
                      <input type="number" value={customWork} onChange={e => setCustomWork(Math.max(1, Number(e.target.value)))} className="w-full px-3 py-2 rounded-lg text-xs bg-[#223030]/50 border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#BBA58F] font-semibold block mb-0.5">Break (minutes)</label>
                      <input type="number" value={customBreak} onChange={e => setCustomBreak(Math.max(1, Number(e.target.value)))} className="w-full px-3 py-2 rounded-lg text-xs bg-[#223030]/50 border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                    </div>
                    <button type="submit" className="w-full py-2 rounded-lg bg-[#523D35] text-white text-xs font-semibold">Save</button>
                  </form>
                </div>

                <div className="p-5 rounded-xl border bg-[#523D35]/10 border-[#959D90]/10">
                  <h3 className="font-semibold text-xs flex items-center gap-2 mb-3 text-[#BBA58F]">Add a subject</h3>
                  <form onSubmit={handleAddSubject} className="flex gap-2">
                    <input type="text" placeholder="Physics" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-xs bg-[#223030]/50 border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                    <button type="submit" className="p-2 bg-[#959D90] rounded-lg text-white"><Plus className="w-4 h-4" /></button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forest' && (
            <div className="p-6 rounded-2xl border bg-[#523D35]/10 border-[#959D90]/10">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2 mb-1"><Leaf className="w-5 h-5 text-[#959D90]" /> Your forest</h2>
              <p className="text-xs text-[#BBA58F] mb-4">One tree per finished session.</p>
              {forest.length === 0 ? (
                <p className="text-xs text-[#BBA58F]">Nothing planted yet — finish a focus session to grow your first tree.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {forest.map(tree => (
                    <div key={tree.id} className="p-3 bg-[#223030]/30 border border-[#959D90]/10 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-3xl mb-1">🌳</span>
                      <span className="text-[10px] text-[#BBA58F] truncate max-w-full">{tree.subject}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'todos' && (
            <div className="p-6 rounded-2xl border bg-[#523D35]/10 border-[#959D90]/10 space-y-5">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2"><CheckSquare className="w-5 h-5 text-[#959D90]" /> Tasks</h2>
              <form onSubmit={(e) => { e.preventDefault(); const txt = e.target.elements.todoText.value; if (txt.trim()) { setTodos([...todos, { id: Date.now(), text: txt, completed: false }]); e.target.reset(); } }} className="flex gap-2">
                <input name="todoText" type="text" placeholder="Add a task" className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-[#223030] border border-[#959D90]/20 text-[#EFEFE9] outline-none" />
                <button type="submit" className="px-5 bg-[#523D35] rounded-lg text-white text-sm font-semibold">Add</button>
              </form>
              {todos.length === 0 ? (
                <p className="text-xs text-[#BBA58F]">No tasks yet.</p>
              ) : (
                <div className="space-y-2">
                  {todos.map(todo => (
                    <div key={todo.id} className="flex items-center justify-between p-3 rounded-lg bg-[#223030]/40 border border-[#959D90]/10">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={todo.completed} onChange={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))} className="w-4 h-4 rounded border-[#BBA58F] accent-[#959D90]" />
                        <span className={`text-sm ${todo.completed ? 'line-through text-[#BBA58F]' : 'text-[#EFEFE9]'}`}>{todo.text}</span>
                      </div>
                      <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))} className="text-[#BBA58F] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="p-6 rounded-2xl border bg-[#523D35]/10 border-[#959D90]/10 space-y-3">
              <h2 className="text-lg font-serif font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-[#959D90]" /> Notes</h2>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Write whatever's useful here." className="w-full h-64 p-4 rounded-xl text-sm bg-[#223030]/30 border border-[#959D90]/10 text-[#EFEFE9] outline-none resize-none leading-relaxed" />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="p-6 rounded-2xl border bg-[#523D35]/10 border-[#959D90]/10 space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold flex items-center gap-2"><Award className="w-5 h-5 text-[#959D90]" /> Leaderboard</h2>
                <p className="text-xs text-[#BBA58F]">Ranked by total focus minutes.</p>
              </div>
              <div className="divide-y divide-[#BBA58F]/10">
                {leaderboardError && (
                  <p className="text-xs text-red-400 py-3">Couldn't load this: {leaderboardError}</p>
                )}
                {!leaderboardError && globalLeaderboard.length === 0 && (
                  <p className="text-xs text-[#BBA58F] py-3">Nobody's logged a session yet.</p>
                )}
                {globalLeaderboard.map((leader, idx) => {
                  const isCurrentUser = leader.id === user?.uid;
                  return (
                    <div key={leader.id} className={`flex items-center justify-between py-3 px-3 rounded-lg ${isCurrentUser ? 'bg-[#523D35]/20 border border-[#959D90]/20' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-[#BBA58F] text-[#223030]' : 'text-[#BBA58F]'}`}>{idx + 1}</span>
                        {leader.photoURL && <img src={leader.photoURL} alt="" className="w-6 h-6 rounded-full border border-[#BBA58F]/30" />}
                        <span className="text-sm">{leader.name} {isCurrentUser && '(you)'}</span>
                      </div>
                      <div className="flex items-center gap-6 text-xs">
                        <span className="text-[#BBA58F]">{leader.score || 0}m</span>
                        <span className="text-[#959D90] font-bold">🔥 {leader.streak || 0}</span>
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
