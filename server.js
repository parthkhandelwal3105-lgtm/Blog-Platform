// ==========================================
// BlogSpace - Server Setup
// ==========================================

require('dotenv').config();
const express = require('express');
const path = require('path');

// Initialize Firebase configuration & Firestore connection
// (All Firebase Admin SDK initialization is cleanly abstracted in config/firebase.js)
const { isConfigured } = require('./config/firebase');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Express Configuration & Middleware
// ==========================================

// 1. Template Engine: Configure Express to use EJS for rendering HTML views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Static Files: Serve stylesheets, client scripts, and images from "public"
app.use(express.static(path.join(__dirname, 'public')));

// 3. Body Parser: Parses incoming URL-encoded form data (needed for POST forms)
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes
// ==========================================

// Posts Router: Contains GET /posts, GET /posts/:id, GET /posts/create, POST /posts, etc.
const postsRouter = require('./routes/posts');
app.use('/posts', postsRouter);

// Home Route: GET / retrieves all blog posts directly from Firestore via postsRouter
app.get('/', (req, res, next) => {
  req.url = '/';
  postsRouter(req, res, next);
});

// Shortcut Route: /create renders the create blog post form
app.get('/create', (req, res, next) => {
  req.url = '/create';
  postsRouter(req, res, next);
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 BlogSpace Server is running!`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`📅 Day 4: Read & View Blog Posts`);
  console.log(`💾 Database Status: ${isConfigured ? '🟢 Connected to Cloud Firestore' : '🟡 Awaiting Firebase Credentials in .env'}`);
  console.log(`===========================================`);
});
