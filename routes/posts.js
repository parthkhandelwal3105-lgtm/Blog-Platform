const express = require('express');
const router = express.Router();
const { db, isConfigured, serverTimestamp } = require('../config/firebase');

// Allowed categories for validation
const VALID_CATEGORIES = ['Technology', 'Programming', 'Education', 'Travel', 'Lifestyle', 'Other'];

/**
 * =========================================================
 * Blog Post Routes
 * =========================================================
 * Architecture:
 * Client (Browser) -> Express Router -> Firebase Admin SDK -> Cloud Firestore
 */

// Helper: Format Date consistently (e.g. "September 29, 2026")
function formatDate(date) {
  if (!date) return 'Recently published';
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (err) {
    return 'Recently published';
  }
}

// Helper: Safely generate short content preview for blog cards (max 130 characters)
function createPreview(content, maxLength = 130) {
  if (!content) return '';
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  const cleanCut = lastSpace > maxLength * 0.7 ? slice.slice(0, lastSpace) : slice;
  return cleanCut + '...';
}

// =========================================================
// 1. GET /posts - View all blog posts (Day 4)
// =========================================================
router.get('/', async (req, res) => {
  // If Firebase is not configured with valid credentials, render a friendly warning
  if (!db || !isConfigured) {
    return res.render('index', {
      posts: [],
      error: 'Firebase is not yet configured. Please set your credentials in the .env file.',
    });
  }

  try {
    // Query the "posts" collection in Firestore
    // Try to sort by createdAt descending (newest first)
    let snapshot;
    try {
      snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
    } catch (orderError) {
      // If ordering fails (e.g. some docs lack createdAt timestamp), retrieve all without order
      console.warn('⚠️ [Firestore Warning] orderBy createdAt failed, fetching all posts:', orderError.message);
      snapshot = await db.collection('posts').get();
    }

    // Convert Firestore DocumentSnapshots into an array of plain JavaScript objects
    const posts = snapshot.docs.map((doc) => {
      const data = doc.data();
      let createdAt = null;
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate();
      } else if (data.createdAt) {
        createdAt = new Date(data.createdAt);
        if (isNaN(createdAt.getTime())) createdAt = null;
      }

      return {
        id: doc.id, // Firestore automatic unique document ID
        title: data.title || 'Untitled',
        content: data.content || '',
        preview: createPreview(data.content || '', 130),
        author: data.author || 'Anonymous',
        category: data.category || 'General',
        createdAt,
        formattedDate: formatDate(createdAt),
        updatedAt: data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate() : null,
      };
    });

    // Sort descending by date (newest first) to ensure older docs without createdAt don't crash
    posts.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : 0;
      const timeB = b.createdAt ? b.createdAt.getTime() : 0;
      return timeB - timeA;
    });

    // Render views/index.ejs with the retrieved posts
    res.render('index', {
      posts,
      error: null,
    });
  } catch (error) {
    console.error('❌ [Firestore Error] Failed to fetch posts:', error.message);
    res.status(500).render('index', {
      posts: [],
      error: 'Failed to retrieve blog posts from Cloud Firestore.',
    });
  }
});

// =========================================================
// 2. GET /posts/create - Show form to create a new blog post (Day 3)
// =========================================================
router.get('/create', (req, res) => {
  res.render('create', {
    error: null,
    formData: {},
    categories: VALID_CATEGORIES,
  });
});

// =========================================================
// 3. POST /posts - Handle submission of a new post to Firestore (Day 3)
// =========================================================
router.post('/', async (req, res) => {
  // 1. Receive and trim submitted data
  const title = req.body.title ? req.body.title.trim() : '';
  const author = req.body.author ? req.body.author.trim() : '';
  const category = req.body.category ? req.body.category.trim() : '';
  const content = req.body.content ? req.body.content.trim() : '';

  const formData = { title, author, category, content };

  // 2. Server-Side Validation: Ensure all fields are filled
  if (!title || !author || !category || !content) {
    return res.status(400).render('create', {
      error: 'Please fill in all required fields.',
      formData,
      categories: VALID_CATEGORIES,
    });
  }

  // 3. Server-Side Validation: Ensure valid category selection
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).render('create', {
      error: 'Please select a valid category from the list.',
      formData,
      categories: VALID_CATEGORIES,
    });
  }

  // 4. Verify Firestore connection
  if (!db || !isConfigured) {
    return res.status(503).render('create', {
      error: 'Cloud Firestore is not yet configured. Please set your credentials in .env.',
      formData,
      categories: VALID_CATEGORIES,
    });
  }

  try {
    // 5. Construct Firestore document payload with server timestamps
    const postPayload = {
      title,
      author,
      category,
      content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 6. Save the new post to the existing "posts" collection
    const docRef = await db.collection('posts').add(postPayload);
    console.log(`✅ [Firestore] New blog post created with ID: ${docRef.id} ("${title}")`);

    // 7. Redirect to homepage after successful post creation
    res.redirect('/');
  } catch (error) {
    console.error('❌ [Firestore Error] Failed to save blog post:', error.message);
    res.status(500).render('create', {
      error: 'An error occurred while publishing your post. Please try again.',
      formData,
      categories: VALID_CATEGORIES,
    });
  }
});

// =========================================================
// 4. TEMPORARY TEST ROUTE (Day 2 Helper)
// GET /posts/seed-test - Inserts a sample blog post into Firestore
// =========================================================
router.get('/seed-test', async (req, res) => {
  if (!db || !isConfigured) {
    return res.status(500).send(
      '❌ Firebase is not configured. Please fill in your .env credentials before testing.'
    );
  }

  try {
    const postsCollection = db.collection('posts');

    // Prevent duplicate test posts: Check if "My First Blog" already exists
    const existingPostQuery = await postsCollection.where('title', '==', 'My First Blog').get();

    if (!existingPostQuery.empty) {
      const existingDoc = existingPostQuery.docs[0];
      return res.send(`
        <h2>ℹ️ Test Post Already Exists!</h2>
        <p>A test post with the title "<strong>My First Blog</strong>" already exists in Firestore.</p>
        <p><strong>Document ID:</strong> <code>${existingDoc.id}</code></p>
        <p><a href="/posts">👉 Click here to view posts on the homepage</a></p>
      `);
    }

    // Insert the test post document into the "posts" collection
    const testPostData = {
      title: 'My First Blog',
      content: 'This is my first blog post.',
      author: 'Parth',
      category: 'Technology',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await postsCollection.add(testPostData);

    console.log(`✅ [Firestore] Created sample test post with ID: ${docRef.id}`);

    res.send(`
      <h2>🎉 Success! Test Post Created in Cloud Firestore</h2>
      <p>A sample document was successfully saved to the <strong>posts</strong> collection.</p>
      <ul>
        <li><strong>Document ID:</strong> <code>${docRef.id}</code></li>
        <li><strong>Title:</strong> My First Blog</li>
        <li><strong>Author:</strong> Parth</li>
        <li><strong>Category:</strong> Technology</li>
      </ul>
      <p><a href="/posts">👉 Click here to view posts on the homepage</a></p>
      <hr>
      <small>Note: This is a temporary route for Day 2. You can remove <code>/seed-test</code> after testing.</small>
    `);
  } catch (error) {
    console.error('❌ [Firestore Error] Failed to create test post:', error.message);
    res.status(500).send(`❌ Failed to insert test document: ${error.message}`);
  }
});

// =========================================================
// FUTURE DAY PLACEHOLDERS (To be implemented in Days 4 - 5)
// =========================================================

// =========================================================
// 5. GET /posts/:id - View an individual post by its Firestore document ID (Day 4)
// =========================================================
router.get('/:id', async (req, res) => {
  const postId = req.params.id;

  // Handle case where Firebase is not configured with credentials
  if (!db || !isConfigured) {
    return res.status(503).render('404', {
      title: 'Database Unavailable',
      message: 'Firebase is not yet configured. Please set your credentials in the .env file.',
    });
  }

  // Basic check for empty or non-string ID parameter
  if (!postId || typeof postId !== 'string' || postId.trim() === '') {
    return res.status(404).render('404', {
      title: 'Post Not Found',
      message: 'Blog post not found.',
    });
  }

  try {
    // 1. Retrieve the document from the "posts" collection by Firestore document ID
    const docRef = db.collection('posts').doc(postId);
    const docSnap = await docRef.get();

    // 2. Check whether the document exists in Cloud Firestore
    if (!docSnap.exists) {
      return res.status(404).render('404', {
        title: 'Post Not Found',
        message: 'Blog post not found.',
      });
    }

    // 3. Extract and safely format data
    const data = docSnap.data();
    let createdAt = null;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      createdAt = data.createdAt.toDate();
    } else if (data.createdAt) {
      createdAt = new Date(data.createdAt);
      if (isNaN(createdAt.getTime())) createdAt = null;
    }

    const post = {
      id: docSnap.id, // Firestore document ID
      title: data.title || 'Untitled',
      author: data.author || 'Anonymous',
      category: data.category || 'General',
      content: data.content || '',
      createdAt,
      formattedDate: formatDate(createdAt),
      updatedAt: data.updatedAt && data.updatedAt.toDate ? data.updatedAt.toDate() : null,
    };

    // 4. Render views/post.ejs with the blog post data
    res.render('post', {
      post,
      error: null,
    });
  } catch (error) {
    console.error(`❌ [Firestore Error] Failed to fetch post with ID "${postId}":`, error.message);
    res.status(404).render('404', {
      title: 'Post Not Found',
      message: 'Blog post not found.',
    });
  }
});

// GET /posts/:id/edit - Show form to edit an existing post
// (Will be implemented in Day 4: Edit Post Form)
router.get('/:id/edit', (req, res) => {
  res.send(`Placeholder: GET /posts/${req.params.id}/edit will display the edit form (Scheduled for Day 4).`);
});

// POST /posts/:id/edit - Handle updating a post in Firestore
// (Will be implemented in Day 4: Updating Posts in Database)
router.post('/:id/edit', (req, res) => {
  res.send(`Placeholder: POST /posts/${req.params.id}/edit will update this post in Firestore (Scheduled for Day 4).`);
});

// POST /posts/:id/delete - Handle deleting a post from Firestore
// (Will be implemented in Day 5: Deleting Posts)
router.post('/:id/delete', (req, res) => {
  res.send(`Placeholder: POST /posts/${req.params.id}/delete will delete this post from Firestore (Scheduled for Day 5).`);
});

module.exports = router;
