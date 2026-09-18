// ==========================================
// BlogSpace - Day 1 Server Setup
// ==========================================

const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Database Connection (SQLite)
// ==========================================
// We connect to the SQLite database located at database/blog.db.
// better-sqlite3 opens the file, or creates it if it doesn't exist.
const dbPath = path.join(__dirname, 'database', 'blog.db');
const db = new Database(dbPath);
console.log(`[Database] SQLite connected at: ${dbPath}`);

// ==========================================
// Express Configuration & Middleware
// ==========================================

// 1. Template Engine: Configure Express to use EJS for rendering HTML views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Static Files: Serve stylesheets, client scripts, and images from "public"
app.use(express.static(path.join(__dirname, 'public')));

// 3. Body Parser: Parses incoming URL-encoded form data (needed for future POST forms)
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes
// ==========================================

// Home Route: Render the Day 1 welcome page
app.get('/', (req, res) => {
  res.render('index');
});

// Posts Router: Mount our placeholder routes for future CRUD operations
const postsRouter = require('./routes/posts');
app.use('/posts', postsRouter);

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`===========================================`);
  console.log(`🚀 BlogSpace Server is running!`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`📅 Day 1 Foundation: Project Setup Complete`);
  console.log(`===========================================`);
});
