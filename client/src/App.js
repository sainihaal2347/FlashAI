import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactCardFlip from 'react-card-flip';
import { Trash2, Plus, LogOut, Zap, Brain, RotateCw, ArrowLeft, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [text, setText] = useState('');
  const [numCards, setNumCards] = useState(10); 
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [flipped, setFlipped] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const fetchDecks = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/dashboard', {
        headers: { Authorization: token }
      });
      setDecks(res.data);
    } catch (err) { console.error(err); }
  }, [token]);

  useEffect(() => {
    if (token) fetchDecks();
  }, [token, fetchDecks]);

  const handleAuth = async () => {
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await axios.post(`http://localhost:5000${endpoint}`, { email, password });
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
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
    setToken(null);
    setDecks([]);
    setSelectedDeck(null);
  };

  const generateDeck = async () => {
    if (!text) return;
    setLoading(true);
    try {
      // DEBUG: Log what we are sending
      console.log("Sending to server:", { text: text.substring(0, 20) + "...", count: numCards });
      
      await axios.post('http://localhost:5000/api/generate', { 
        text, 
        count: numCards // IMPORTANT: This must match the backend variable
      }, {
        headers: { Authorization: token }
      });
      setText('');
      await fetchDecks();
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
      await axios.delete(`http://localhost:5000/api/deck/${id}`, {
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
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const openDeck = (deck) => {
    setSelectedDeck(deck);
    setCurrentCardIndex(0);
    setFlipped({}); 
  };

  // --- AUTH SCREEN ---
  if (!token) {
    return (
      <div className="container">
        <div className="header">
           <h1><Zap style={{display:'inline', verticalAlign:'middle'}} size={40}/> FlashAI</h1>
           <p>Your AI Study Companion</p>
        </div>
        <div className="auth-box">
          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <input className="auth-input" placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input className="auth-input" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button className="auth-btn" onClick={handleAuth}>{isLogin ? "Login" : "Sign Up"}</button>
          <p className="switch-text" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "New here? Create account" : "Have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD SCREEN ---
  return (
    <div className="container">
      <div className="top-bar">
         <div className="header" style={{margin:0, textAlign:'left'}}>
            <h1>FlashAI</h1>
         </div>
         <button className="logout-btn" onClick={handleLogout}><LogOut size={16}/> Logout</button>
      </div>

      {!selectedDeck ? (
        <>
          <div className="input-section">
            <h2 style={{marginTop:0, display:'flex', alignItems:'center', gap:'10px'}}>
              <Brain className="text-blue-600"/> Generate New Deck
            </h2>
            <textarea placeholder="Paste your lecture notes, article, or topic here..." value={text} onChange={e => setText(e.target.value)} />
            
            <div className="card-count-control">
              <Layers size={20} />
              <span>Generate {numCards} Cards</span>
              <input 
                type="range" 
                min="1" 
                max="25" 
                value={numCards} 
                onChange={(e) => setNumCards(parseInt(e.target.value))} 
              />
            </div>

            <button className="action-btn" onClick={generateDeck} disabled={loading}>
              {loading ? <RotateCw className="animate-spin"/> : <Plus size={20}/>}
              {loading ? "Generating..." : "Create Flashcards"}
            </button>
          </div>

          <h3 style={{color:'#64748b'}}>Your Library ({decks.length})</h3>
          <div className="deck-grid">
            {decks.map(deck => (
              <div key={deck._id} className="deck-card" onClick={() => openDeck(deck)}>
                <div className="delete-btn" onClick={(e) => handleDelete(e, deck._id)}>
                  <Trash2 size={18}/>
                </div>
                <div className="deck-icon"><Zap size={24}/></div>
                <h3 className="deck-title">{deck.topic}</h3>
                <p className="deck-count">{deck.cards.length} Cards</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="study-header">
             <button className="back-btn" onClick={() => setSelectedDeck(null)}>
               <ArrowLeft size={16} style={{verticalAlign:'middle'}}/> Back to Dashboard
             </button>
             <h2 style={{margin:0, fontSize:'1.2rem', maxWidth:'50%', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{selectedDeck.topic}</h2>
             <div style={{width:'100px'}}></div>
          </div>
          
          <div className="single-card-wrapper" key={currentCardIndex}>
              <ReactCardFlip isFlipped={!!flipped[currentCardIndex]} flipDirection="horizontal">
                <div className="flashcard front" onClick={() => handleFlip(currentCardIndex)}>
                  <span className="card-label">Question</span>
                  <p>{selectedDeck.cards[currentCardIndex].question}</p>
                  <span className="tap-hint"><RotateCw size={14}/> Tap to flip</span>
                </div>
                <div className="flashcard back" onClick={() => handleFlip(currentCardIndex)}>
                  <span className="card-label">Answer</span>
                  <p>{selectedDeck.cards[currentCardIndex].answer}</p>
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
        </>
      )}
    </div>
  );
}

export default App;