require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// NEW SDK IMPORT
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_123"; 

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// --- DATA MODELS ---

// User Model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// Flashcard Set Model (Linked to User)
const FlashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: String,
  createdAt: { type: Date, default: Date.now },
  cards: [{ question: String, answer: String }]
});
const FlashcardSet = mongoose.model('FlashcardSet', FlashcardSchema);

// --- MIDDLEWARE (Security Guard) ---
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: "Access Denied" });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Attaches user ID to the request
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  
  try {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = await User.create({ email, password: hashedPassword });
    res.json(newUser);
  } catch (err) {
    if (err.code === 11000) {
        res.status(400).json({ error: "Email already exists" });
    } else {
        res.status(400).json({ error: "Registration failed" });
    }
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ error: "Invalid password" });

  // Create Token
  const token = jwt.sign({ _id: user._id }, JWT_SECRET);
  res.header('Authorization', token).json({ token });
});

// --- APP ROUTES (Protected) ---

// Initialize New AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Generate Deck (Needs Token)
app.post('/api/generate', authMiddleware, async (req, res) => {
  const { text } = req.body;
  try {
    // UPDATED PROMPT: Request 10 cards
    const prompt = `Create 10 study flashcards (question and answer) based on: "${text}". Return ONLY raw JSON array. Format: [{"question": "...", "answer": "..."}]`;
    
    // NEW SDK USAGE
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const aiResponseText = result.text;
    const jsonString = aiResponseText.replace(/```json|```/g, '').trim();
    const cards = JSON.parse(jsonString);

    // Save with User ID
    const newSet = await FlashcardSet.create({
      userId: req.user._id,
      topic: text.substring(0, 30) + "...",
      cards: cards
    });

    res.json(newSet);
  } catch (error) {
    console.error("Final Generation Error:", error);
    res.status(500).json({ error: "Generation Failed. Try again later." });
  }
});

// Get User's Decks (Needs Token)
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const sets = await FlashcardSet.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(sets);
});

// DELETE Deck (New Route)
app.delete('/api/deck/:id', authMiddleware, async (req, res) => {
  try {
    await FlashcardSet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Deck deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
