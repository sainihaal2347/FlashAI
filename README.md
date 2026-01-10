# ⚡ FlashAI - AI-Powered Study Assistant

![FlashAI Demo](https://img.shields.io/badge/Status-Active-success)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue)
![AI Powered](https://img.shields.io/badge/AI-Gemini%202.5-orange)

**FlashAI** is a modern, full-stack web application that leverages Generative AI to revolutionize how students study. By integrating **Google's Gemini 2.5 Flash model**, the app instantly transforms raw lecture notes, articles, or text into structured, interactive flashcards.

Designed with a focus on **User Experience (UX)**, it features a glassmorphic UI, dark mode, secure authentication, and a spaced-repetition-style study mode.

## 🚀 Features

### 🧠 **AI-Powered Generation**
* **Smart Parsing:** Uses Google Gemini 2.5 Flash to break down complex text into atomic question-answer pairs.
* **Customizable Output:** Users can select exactly how many cards they want (1-25) using a dynamic slider.
* **Context Awareness:** Automatically generates variations (True/False, Fill-in-the-blank) if the source text is short.

### 🎨 **Modern UI/UX**
* **Glassmorphism Design:** Premium look with translucent cards and blurred backdrops.
* **Dark Mode:** Fully persistent dark theme toggle for late-night study sessions.
* **Interactive Animations:** Smooth 3D card flips and slide transitions during study mode.
* **Responsive Layout:** Works seamlessly on desktop and mobile devices.

### 🔐 **Secure & Robust**
* **User Authentication:** Secure Signup/Login using **JWT (JSON Web Tokens)** and **BCrypt** password hashing.
* **Data Persistence:** All decks and user data are stored securely in **MongoDB Atlas**.
* **Session Management:** Auto-login and secure logout functionality.

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js (v19)** | Component-based UI with Hooks & Context API. |
| **Styling** | **CSS3** | Custom animations, gradients, and responsive flexbox/grid layouts. |
| **Backend** | **Node.js & Express** | RESTful API architecture handling AI requests and DB operations. |
| **Database** | **MongoDB (Atlas)** | NoSQL database for storing User profiles and Flashcard decks. |
| **AI Engine** | **Google GenAI SDK** | Integration with Gemini 2.5 Flash model. |
| **Auth** | **JWT & BCrypt** | Stateless authentication and encryption. |

## ⚙️ Installation & Setup

Follow these steps to run the project locally.

### 1. Prerequisites
* Node.js (v18 or higher)
* MongoDB Atlas Account (Free Tier)
* Google AI Studio API Key

### 2. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/FlashAI.git](https://github.com/YOUR_USERNAME/FlashAI.git)
cd FlashAI
