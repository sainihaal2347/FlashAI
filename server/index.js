require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
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
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const FlashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: String,
  createdAt: { type: Date, default: Date.now },
  cards: [{ question: String, answer: String }]
});
const FlashcardSet = mongoose.model('FlashcardSet', FlashcardSchema);

// --- MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ error: "Access Denied" });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid Token" });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await User.create({ email, password: hashedPassword });
    res.json(newUser);
  } catch (err) {
    if (err.code === 11000) res.status(400).json({ error: "Email already exists" });
    else res.status(400).json({ error: "Registration failed" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ error: "Invalid password" });
  
  const token = jwt.sign({ _id: user._id }, JWT_SECRET);
  // Send back token AND user info
  res.header('Authorization', token).json({ 
    token, 
    user: { id: user._id, email: user.email } 
  });
});

// --- APP ROUTES ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/generate', authMiddleware, async (req, res) => {
  const { text, count } = req.body;
  const cardCount = parseInt(count) || 10;
  
  console.log(`[DEBUG] User requested ${cardCount} cards.`);

  try {
    // 1. Robust Prompt Strategy (Universal JSON)
    const prompt = `
      You are a strict JSON generator.
      Task: Generate exactly ${cardCount} study flashcards based on the text below.
      
      CRITICAL INSTRUCTIONS:
      1. Output MUST be a raw JSON array.
      2. Do NOT use Markdown code blocks (no \`\`\`json).
      3. Use exactly this format: [{"question": "...", "answer": "..."}]
      4. If the text is short, create True/False questions or separate facts to reach exactly ${cardCount} items.
      5. Do not include any introductory or concluding text. Just the array.

      Text: "${text.substring(0, 15000)}"
    `;

    // 2. Call AI
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    // 3. Robust Parsing
    let responseText = result.text;
    if (!responseText) throw new Error("No response from AI");

    // Clean up if AI adds markdown despite instructions
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find brackets to isolate JSON
    const firstBracket = responseText.indexOf('[');
    const lastBracket = responseText.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        responseText = responseText.substring(firstBracket, lastBracket + 1);
    }

    let cards = JSON.parse(responseText);
    
    // 4. Force Count Limit
    if (cards.length > cardCount) cards = cards.slice(0, cardCount);
    
    console.log(`[DEBUG] Successfully generated ${cards.length} cards.`);

    const newSet = await FlashcardSet.create({
      userId: req.user._id,
      topic: text.substring(0, 30) + "...",
      cards: cards
    });

    res.json(newSet);
  } catch (error) {
    console.error("Generation Error:", error);
    res.status(500).json({ error: "AI Error: " + error.message });
  }
});

app.get('/api/dashboard', authMiddleware, async (req, res) => {
  const sets = await FlashcardSet.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(sets);
});

app.delete('/api/deck/:id', authMiddleware, async (req, res) => {
  try {
    await FlashcardSet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: "Deck deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// --- DEPLOYMENT SETUP (SERVE REACT APP) ---
// Serve static files from the React app build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// FIXED: Use regex /.*/ instead of string '*' to avoid router crash
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// FIXED: Use dynamic PORT for Render deployment and bind to 0.0.0.0
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
