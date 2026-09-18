const express = require('express');
const router = express.Router();

/**
 * =========================================================
 * Blog Post Routes (Placeholder Foundation for Days 2 - 5)
 * =========================================================
 * Full CRUD (Create, Read, Update, Delete) and database queries
 * will be implemented in upcoming days.
 */

// 1. GET /posts - View all blog posts (Day 2)
router.get('/', (req, res) => {
  res.send('Day 1 Placeholder: GET /posts will display a list of all blog posts.');
});

// 2. GET /posts/create - Show form to create a new post (Day 3)
// (Placed before /:id so Express matches "/create" rather than treating it as an ID)
router.get('/create', (req, res) => {
  res.send('Day 1 Placeholder: GET /posts/create will show the new post creation form.');
});

// 3. POST /posts - Handle submission of a new post (Day 3)
router.post('/', (req, res) => {
  res.send('Day 1 Placeholder: POST /posts will save a new post to the database.');
});

// 4. GET /posts/:id - View a single blog post by its ID (Day 2)
router.get('/:id', (req, res) => {
  res.send(`Day 1 Placeholder: GET /posts/${req.params.id} will display this individual post.`);
});

// 5. GET /posts/:id/edit - Show the form to edit an existing post (Day 4)
router.get('/:id/edit', (req, res) => {
  res.send(`Day 1 Placeholder: GET /posts/${req.params.id}/edit will display the edit form.`);
});

// 6. POST /posts/:id/edit - Handle updating an existing post (Day 4)
router.post('/:id/edit', (req, res) => {
  res.send(`Day 1 Placeholder: POST /posts/${req.params.id}/edit will update this post in the database.`);
});

// 7. POST /posts/:id/delete - Handle deleting a post (Day 5)
router.post('/:id/delete', (req, res) => {
  res.send(`Day 1 Placeholder: POST /posts/${req.params.id}/delete will remove this post from the database.`);
});

module.exports = router;
