import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactCardFlip from 'react-card-flip';
import { Trash2, Plus, LogOut, Zap, Brain, RotateCw, ArrowLeft, ChevronLeft, ChevronRight, Layers, User, Settings, HelpCircle, ChevronDown, X, Library, LayoutGrid, Sparkles, Mail, BookOpen, ArrowRight } from 'lucide-react';
import './App.css';

// --- CUSTOM COMPONENTS ---

const Logo = () => (
  <div className="app-logo">
    <div className="logo-icon">
      <Zap size={24} fill="currentColor" />
    </div>
    <span className="logo-text">FlashAI</span>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NAVIGATION STATE: 'library', 'create', 'study'
  const [view, setView] = useState('library'); 
  
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10); 
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // NEW: Dark Mode State
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [activeModal, setActiveModal] = useState(null);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('next'); // State for animation direction

  // --- DYNAMIC API URL CONFIGURATION ---
  const API_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:5000/api';

  // Apply Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchDecks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: token }
      });
      setDecks(res.data);
    } catch (err) { console.error(err); }
  }, [token, API_URL]);

  useEffect(() => {
    if (token) fetchDecks();
  }, [token, fetchDecks]);

  const handleAuth = async () => {
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    try {
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user)); 
        setToken(res.data.token);
        setUser(res.data.user);
        setView('library');
      } else {
        alert("Success! Please log in.");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Auth failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setDecks([]);
    setSelectedDeck(null);
    setShowDropdown(false);
    setActiveModal(null);
    setView('library');
  };

  const generateDeck = async () => {
    if (!text) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/generate`, { 
        text, 
        count: numCards 
      }, {
        headers: { Authorization: token }
      });
      setText('');
      await fetchDecks();
      setView('library'); // Redirect to library after generation
    } catch (err) { 
      console.error(err);
      alert("Failed to generate"); 
    }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(!window.confirm("Delete this deck?")) return;
    try {
      await axios.delete(`${API_URL}/deck/${id}`, {
        headers: { Authorization: token }
      });
      fetchDecks();
    } catch(err) { alert("Delete failed"); }
  };

  const handleFlip = (idx) => {
    setFlipped(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleNext = () => {
    if (currentCardIndex < selectedDeck.cards.length - 1) {
      setSlideDirection('next');
      // Reset the flip state for the NEW card index before showing it
      setFlipped(prev => ({ ...prev, [currentCardIndex + 1]: false }));
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setSlideDirection('prev');
      // Reset the flip state for the NEW card index before showing it
      setFlipped(prev => ({ ...prev, [currentCardIndex - 1]: false }));
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const openDeck = (deck) => {
    setSelectedDeck(deck);
    setCurrentCardIndex(0);
    setFlipped({});
    setSlideDirection('next');
    setView('study');
  };

  const openModal = (type) => {
    setShowDropdown(false);
    setActiveModal(type);
  };

  // --- MODALS RENDER ---
  const renderModal = () => {
    if (!activeModal) return null;
    let content, title;

    switch (activeModal) {
      case 'profile':
        title = "My Profile";
        content = (
          <div className="profile-view">
            <div className="large-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <h3>{user?.email?.split('@')[0]}</h3>
            <p className="email-text">{user?.email}</p>
            <div className="stats-row">
              <div className="stat-item"><span className="stat-val">{decks.length}</span><span className="stat-label">Decks</span></div>
              <div className="stat-item"><span className="stat-val">Free</span><span className="stat-label">Plan</span></div>
            </div>
          </div>
        );
        break;
      case 'settings':
        title = "Settings";
        content = (
          <div className="settings-view">
            <div className="setting-item"><span>Email Notifications</span><input type="checkbox" defaultChecked /></div>
            <div className="setting-item"><span>Dark Mode</span><input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} /></div>
            <p className="version-text">FlashAI v2.0.0</p>
          </div>
        );
        break;
      case 'help':
        title = "Help & Support";
        content = (
          <div className="help-view">
            <p>Need assistance? Contact our team.</p>
            <div className="contact-box">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <Mail size={18} className="text-blue-600"/>
                <strong>General:</strong>
              </div>
              <a href="mailto:support@flashai.com">support@flashai.com</a>
            </div>
            <div className="contact-box">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <Mail size={18} className="text-blue-600"/>
                <strong>Technical:</strong>
              </div>
              <a href="mailto:tech@flashai.com">tech@flashai.com</a>
            </div>
            <div className="contact-box">
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <BookOpen size={18} className="text-blue-600"/>
                <strong>Docs:</strong>
              </div>
              <a href="#">Read Guide</a>
            </div>
          </div>
        );
        break;
      default: return null;
    }

    return (
      <div className="modal-overlay" onClick={() => setActiveModal(null)}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-icon" onClick={() => setActiveModal(null)}><X size={20} /></button>
          </div>
          <div className="modal-body">{content}</div>
        </div>
      </div>
    );
  };

  // --- VIEW: CREATE PAGE ---
  const renderCreate = () => (
    <div className="page-container fade-in">
      <div className="page-header">
        <h2><Sparkles className="icon-pulse" /> Create New Deck</h2>
        <p>Paste your notes, choose a card count, and let AI do the rest.</p>
      </div>
      
      <div className="create-card-wrapper">
        <textarea 
          placeholder="Paste your lecture notes, article, or topic here..." 
          value={text} 
          onChange={e => setText(e.target.value)} 
        />
        
        <div className="controls-row">
          <div className="slider-container">
            <div className="slider-label">
              <Layers size={16} /> <span>{numCards} Cards</span>
            </div>
            <input 
              type="range" min="1" max="25" 
              value={numCards} onChange={(e) => setNumCards(parseInt(e.target.value))} 
            />
          </div>
          
          <button className="generate-btn" onClick={generateDeck} disabled={loading || !text}>
            {loading ? <RotateCw className="animate-spin" /> : <Zap size={20} fill="currentColor" />}
            {loading ? "Generaing..." : "Generate Deck"}
          </button>
        </div>
      </div>
    </div>
  );

  // --- VIEW: LIBRARY PAGE ---
  const renderLibrary = () => (
    <div className="page-container fade-in">
      <div className="page-header left-align">
        <h2>Your Library</h2>
        <p>{decks.length} Decks Created</p>
      </div>

      {decks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Library size={48} /></div>
          <h3>No decks yet</h3>
          <p>Go to the "Create" tab to generate your first flashcard deck!</p>
          <button className="primary-btn" onClick={() => setView('create')}>Create Deck</button>
        </div>
      ) : (
        <div className="deck-grid">
          {decks.map(deck => (
            <div key={deck._id} className="deck-card" onClick={() => openDeck(deck)}>
              <div className="delete-btn" onClick={(e) => handleDelete(e, deck._id)}><Trash2 size={18}/></div>
              <div className="deck-icon"><Brain size={28}/></div>
              <h3 className="deck-title">{deck.topic}</h3>
              <p className="deck-count">{deck.cards.length} Cards</p>
              <div className="deck-arrow"><ArrowRight size={16} className="rotate-180"/></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- VIEW: STUDY PAGE ---
  const renderStudy = () => (
    <div className="page-container fade-in">
      <div className="study-nav">
         <button className="back-btn" onClick={() => { setSelectedDeck(null); setView('library'); }}>
           <ArrowLeft size={18} /> Back to Library
         </button>
         <h2 className="study-title">{selectedDeck.topic}</h2>
         <div style={{width: '100px'}}></div>
      </div>
      
      {/* FLASHCARD CONTAINER WITH ANIMATION KEY & CLASS */}
      <div className={`single-card-wrapper ${slideDirection}`} key={currentCardIndex}>
          <ReactCardFlip isFlipped={!!flipped[currentCardIndex]} flipDirection="horizontal">
            <div className="flashcard front" onClick={() => handleFlip(currentCardIndex)}>
              <div className="card-content">
                <span className="card-label">Question</span>
                <p>{selectedDeck.cards[currentCardIndex].question}</p>
              </div>
              <span className="tap-hint"><RotateCw size={14}/> Tap to flip</span>
            </div>
            <div className="flashcard back" onClick={() => handleFlip(currentCardIndex)}>
              <div className="card-content">
                <span className="card-label">Answer</span>
                <p>{selectedDeck.cards[currentCardIndex].answer}</p>
              </div>
            </div>
          </ReactCardFlip>
      </div>

      <div className="study-controls">
        <button className="nav-btn" onClick={handlePrev} disabled={currentCardIndex === 0}>
           <ChevronLeft size={24}/>
        </button>
        <span className="page-indicator">{currentCardIndex + 1} / {selectedDeck.cards.length}</span>
        <button className="nav-btn" onClick={handleNext} disabled={currentCardIndex === selectedDeck.cards.length - 1}>
           <ChevronRight size={24}/>
        </button>
      </div>
    </div>
  );

  // --- AUTH SCREEN ---
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
             <div className="big-logo"><Zap size={48} fill="currentColor"/></div>
             <h1>FlashAI</h1>
             <p>Your AI Study Companion</p>
          </div>
          <div className="auth-form-box">
            <h2>{isLogin ? "Welcome Back" : "Get Started"}</h2>
            <div className="input-group">
              <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="input-group">
              <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
            </div>
            <button className="auth-submit-btn" onClick={handleAuth}>{isLogin ? "Login" : "Create Account"}</button>
            <p className="switch-text" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "New to FlashAI? Sign Up" : "Already have an account? Login"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP LAYOUT ---
  return (
    <div className="app-layout">
      {renderModal()}

      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <Logo />
        </div>
        
        <nav className="nav-links">
          <button 
            className={`nav-item ${view === 'library' || view === 'study' ? 'active' : ''}`} 
            onClick={() => setView('library')}
          >
            <LayoutGrid size={20} /> Library
          </button>
          <button 
            className={`nav-item ${view === 'create' ? 'active' : ''}`} 
            onClick={() => setView('create')}
          >
            <Plus size={20} /> Create
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
             <div className="user-avatar-small">
               {user?.email?.charAt(0).toUpperCase()}
             </div>
             <div className="user-info">
               <span className="user-name">{user?.email?.split('@')[0]}</span>
               <span className="user-role">FlashAI v2.0</span>
             </div>
             <ChevronDown size={14} className="user-chevron"/>
          </div>
          
          {showDropdown && (
            <div className="user-dropdown">
               <div className="dropdown-item" onClick={() => openModal('profile')}><User size={16}/> Profile</div>
               <div className="dropdown-item" onClick={() => openModal('settings')}><Settings size={16}/> Settings</div>
               <div className="dropdown-item" onClick={() => openModal('help')}><HelpCircle size={16}/> Help</div>
               <div className="dropdown-divider"></div>
               <div className="dropdown-item danger" onClick={handleLogout}><LogOut size={16}/> Logout</div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* MOBILE HEADER - VISIBLE ONLY ON MOBILE */}
        <div className="mobile-top-bar">
           <Logo />
        </div>

        {view === 'library' && renderLibrary()}
        {view === 'create' && renderCreate()}
        {view === 'study' && renderStudy()}
      </main>
    </div>
  );
}

export default App;