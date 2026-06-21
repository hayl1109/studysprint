import React, { useState, useEffect } from 'react';
import { 
  Timer, Leaf, CheckSquare, BarChart2, Flame, Moon, Sun, Plus, 
  Trash2, Award, FileText, Settings, Play, Pause, RefreshCw, LogIn, LogOut, Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);

  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('timer');
  
  const [customWork, setCustomWork] = useState(25);
  const [customBreak, setCustomBreak] = useState(5);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  const [subjects, setSubjects] = useState(['Coding', 'Math', 'Reading', 'Design']);
  const [selectedSubject, setSelectedSubject] = useState('Coding');
  const [newSubject, setNewSubject] = useState('');

  const [forest, setForest] = useState(() => JSON.parse(localStorage.getItem('ss_forest')) || []);
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('ss_todos')) || []);
  const [notes, setNotes] = useState(() => localStorage.getItem('ss_notes') || '');
  const [streak, setStreak] = useState(() => Number(localStorage.getItem('ss_streak')) || 0);
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem('ss_stats')) || { today: 0, week: 0 });

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
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGlobalLeaderboard(usersList);
    }, (error) => {
      console.error("Firestore Leaderboard error:", error);
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
    } catch (e) {
      console.error("Error writing document to Firestore: ", e);
    }
  };

  useEffect(() => { 
    localStorage.setItem('ss_forest', JSON.stringify(forest)); 
    if (user) syncUserToFirestore(user, forest.length * customWork + stats.today, streak);
  }, [forest]);

  useEffect(() => { localStorage.setItem('ss_todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('ss_notes', notes); }, [notes]);
  
  useEffect(() => { 
    localStorage.setItem('ss_streak', streak.toString()); 
    if (user) syncUserToFirestore(user, forest.length * customWork + stats.today, streak);
  }, [streak]);

  useEffect(() => { 
    localStorage.setItem('ss_stats', JSON.stringify(stats)); 
    if (user) syncUserToFirestore(user, forest.length * customWork + stats.today, streak);
  }, [stats]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication Error Details:", error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setActiveTab('timer');
    } catch (error) {
      console.error("Signout Error Details:", error.message);
    }
  };

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

  const addTodo = (text) => {
    if (!text.trim()) return;
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(t => t.id !== id));
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
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Loading StudySprint Engine...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-between transition-colors duration-500 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="max-w-7xl mx-auto w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="font-black text-sm tracking-wider">STUDYSPRINT</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border transition-all ${darkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-100'}`}>
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center my-auto">
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              <span>Global Firestore Synced</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Focus harder. <br />
              Grow your <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">virtual forest</span>.
            </h1>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm mx-auto md:mx-0">
              An elegant, gamified focus manager using the Pomodoro technique to build healthy habits, visual metrics, and task backlogs.
            </p>
          </div>

          <div className={`p-8 rounded-3xl shadow-2xl flex flex-col text-center border transition-all ${darkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-100'}`}>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit mx-auto mb-4 border border-emerald-500/20">
              <Timer className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-1">Create your Account</h2>
            <p className="text-xs text-slate-400 mb-8">Sign in with Google to enter the synchronized global workspace.</p>

            <button 
              onClick={handleLogin} 
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 text-sm font-bold bg-white text-slate-900 rounded-xl shadow-xl hover:bg-slate-100 transition-all border border-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.227C18.29 1.157 15.54 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.853 11.57-11.77 0-.795-.085-1.4-.195-1.945H12.24z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </main>

        <footer className="text-center py-6 text-xs text-slate-500 max-w-7xl mx-auto w-full border-t border-slate-900/40">
          &copy; 2026 StudySprint by Hayl
        </footer>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      <header className={`border-b backdrop-blur-md sticky top-0 z-50 ${darkMode ? 'border-slate-800 bg-[#0f172a]/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-wider bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">STUDYSPRINT</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-4 h-4 fill-current" />
              <span>{streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Timer className="w-4 h-4" />
              <span>{stats.today}m Focused Today</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-xl border transition-all ${darkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-100'}`}>
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-emerald-500 shadow-md" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-bold uppercase">{user.displayName?.charAt(0) || 'U'}</div>
              )}
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 rounded-xl transition-colors" title="Sign Out">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <nav className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {[
            { id: 'timer', label: 'Focus Zone', icon: Timer },
            { id: 'forest', label: 'My Forest', icon: Leaf, count: forest.length },
            { id: 'todos', label: 'Tasks', icon: CheckSquare, count: todos.filter(t=>!t.completed).length },
            { id: 'notes', label: 'Scratchpad', icon: FileText },
            { id: 'leaderboard', label: 'Leaderboard', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap min-w-[140px] lg:min-w-0 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' 
                    : darkMode ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-500/20 text-slate-400'}`}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        <section className="lg:col-span-9 space-y-6">
          
          {activeTab === 'timer' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`md:col-span-2 p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all shadow-xl ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
                {isBreak && (
                  <span className="absolute top-4 px-4 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-400 tracking-widest uppercase">Break Time</span>
                )}
                
                <div className="mb-6 flex items-center gap-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Targeting:</span>
                  <select 
                    value={selectedSubject} 
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className={`text-sm font-semibold rounded-lg px-2.5 py-1 border outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-100 border-slate-200 text-emerald-600'}`}
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <h1 className="text-7xl md:text-8xl font-black tracking-tighter tabular-nums font-mono mb-8 bg-gradient-to-b from-current to-slate-500 bg-clip-text text-transparent">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </h1>

                <div className="flex items-center gap-4">
                  <button onClick={toggleTimer} className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold flex items-center gap-2 hover:opacity-90 shadow-xl shadow-emerald-500/20 transition-all">
                    {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    <span>{isActive ? 'Pause' : 'Start Focus'}</span>
                  </button>
                  <button onClick={resetTimer} className={`p-3.5 rounded-2xl border transition-all ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`}>
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className={`p-6 rounded-3xl shadow-md ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
                  <h3 className="font-bold text-base flex items-center gap-2 mb-4"><Settings className="w-4 h-4 text-emerald-400" /> Custom Engine</h3>
                  <form onSubmit={applyCustomSettings} className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">Work Interval (min)</label>
                      <input type="number" value={customWork} onChange={e => setCustomWork(Math.max(1, Number(e.target.value)))} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-semibold block mb-1">Break Interval (min)</label>
                      <input type="number" value={customBreak} onChange={e => setCustomBreak(Math.max(1, Number(e.target.value)))} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                    </div>
                    <button type="submit" className="w-full py-2 rounded-xl bg-slate-500/10 border border-slate-500/20 text-xs font-bold tracking-wide uppercase hover:bg-emerald-500 hover:text-white transition-all">Apply Setup</button>
                  </form>
                </div>

                <div className={`p-6 rounded-3xl shadow-md ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
                  <h3 className="font-bold text-base flex items-center gap-2 mb-3"><Plus className="w-4 h-4 text-emerald-400" /> New Subject</h3>
                  <form onSubmit={handleAddSubject} className="flex gap-2">
                    <input type="text" placeholder="e.g. Physics" value={newSubject} onChange={e => setNewSubject(e.target.value)} className={`flex-1 px-3 py-2 rounded-xl text-sm border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                    <button type="submit" className="p-2 bg-emerald-500 rounded-xl text-white hover:bg-emerald-600"><Plus className="w-5 h-5" /></button>
                  </form>
                </div>

                <div className={`p-4 rounded-3xl shadow-md overflow-hidden ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
                  <h3 className="font-bold text-xs flex items-center gap-2 mb-3 text-slate-400 uppercase tracking-wider">
                    📻 Lofi Cafe Radio
                  </h3>
                  <iframe 
                    src="https://www.lofi.cafe/" 
                    className="w-full h-[300px] rounded-2xl border-0 shadow-inner"
                    title="Lofi Cafe Player"
                    allow="autoplay"
                  ></iframe>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'forest' && (
            <div className={`p-6 rounded-3xl shadow-xl ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-400" /> Pomodoro Canopy</h2>
                  <p className="text-xs text-slate-400">Every completed focus block plants a permanent visual tree metric.</p>
                </div>
                <span className="text-sm font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">{forest.length} Trees Grown</span>
              </div>

              {forest.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-2xl">
                  <Leaf className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Your ecosystem is clear. Grow your first tree using focus modules!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                  {forest.map(tree => (
                    <div key={tree.id} className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 group relative hover:scale-110 transition-all ${darkMode ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
                      <span className="text-2xl animate-bounce">🌿</span>
                      <span className="text-[10px] font-bold truncate max-w-full text-slate-400">{tree.subject}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'todos' && (
            <div className={`p-6 rounded-3xl shadow-xl space-y-6 ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2"><CheckSquare className="w-5 h-5 text-emerald-400" /> Focus Roadmap</h2>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); addTodo(e.target.elements.todoText.value); e.target.reset(); }} className="flex gap-2">
                <input name="todoText" type="text" placeholder="Add an objective task..." className={`flex-1 px-4 py-3 rounded-xl text-sm border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`} />
                <button type="submit" className="px-5 bg-emerald-500 rounded-xl text-white font-bold text-sm hover:bg-emerald-600 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
              </form>
              <div className="space-y-2">
                {todos.map(todo => (
                  <div key={todo.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="w-4 h-4 rounded text-emerald-500 accent-emerald-500" />
                      <span className={`text-sm ${todo.completed ? 'line-through text-slate-500' : ''}`}>{todo.text}</span>
                    </div>
                    <button onClick={() => deleteTodo(todo.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className={`p-6 rounded-3xl shadow-xl space-y-4 ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
              <h2 className="text-xl font-extrabold flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-400" /> Work Scratchpad</h2>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Type active session parameters or briefs here..." 
                className={`w-full h-64 p-4 rounded-2xl text-sm border outline-none font-mono resize-none leading-relaxed ${darkMode ? 'bg-slate-800/50 border-slate-700 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className={`p-6 rounded-3xl shadow-xl space-y-4 ${darkMode ? 'bg-slate-900/50 border border-slate-800' : 'bg-white border border-slate-100'}`}>
              <div>
                <h2 className="text-xl font-extrabold flex items-center gap-2"><Award className="w-5 h-5 text-emerald-400" /> Global Standings</h2>
                <p className="text-xs text-slate-400">Real-time scoreboard powered by Cloud Firestore. Compete with teammates live!</p>
              </div>

              <div className="divide-y divide-slate-800/60">
                {globalLeaderboard.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">Awaiting database connection streams...</div>
                ) : (
                  globalLeaderboard.map((leader, idx) => {
                    const isCurrentUser = leader.id === user?.uid;
                    return (
                      <div key={leader.id} className={`flex items-center justify-between py-3.5 px-2 rounded-xl transition-all ${isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
                        <div className="flex items-center gap-4">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-900' : 'text-slate-400'}`}>
                            {idx + 1}
                          </span>
                          {leader.photoURL && (
                            <img src={leader.photoURL} alt="" className="w-6 h-6 rounded-full border border-slate-700" />
                          )}
                          <span className={`text-sm font-semibold ${isCurrentUser ? 'text-emerald-400' : ''}`}>
                            {leader.name} {isCurrentUser && '(You)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="font-mono text-slate-400">{leader.score || 0} mins</span>
                          <span className="text-orange-400 font-bold text-xs">🔥 {leader.streak || 0}d</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}