# Blog Project Highlights

## Project Positioning

This project is a full-stack blog system built with React, TypeScript, Vite, Node.js, Express, MongoDB, and JWT-based authentication. It covers article publishing, draft management, image upload, search, reading analytics, and role-based access control.

## Resume Version

### Short Version

- Built a full-stack blog system with React, TypeScript, Express, and MongoDB, supporting article publishing, draft management, image upload, and JWT authentication.
- Refactored article permission boundaries to separate public posts from private drafts, reducing the risk of unpublished content exposure.
- Implemented article search with fuzzy matching and pinyin-friendly retrieval, and added reading statistics for published posts.
- Optimized frontend performance with route-level lazy loading and Vite chunk splitting to reduce initial bundle pressure.

### Medium Version

- Designed and developed a full-stack blog platform using React + TypeScript on the frontend and Node.js + Express + MongoDB on the backend, covering authentication, article CRUD, draft autosave, and image upload workflows.
- Reworked article access control by distinguishing public content, drafts, and author/admin permissions, and introduced optional authentication for mixed public/private article detail access.
- Delivered a usable search experience by implementing fuzzy search across titles, descriptions, categories, tags, and article content, with support for pinyin-friendly matching for Chinese queries.
- Added article reading statistics through model expansion and public detail read counting, then surfaced the metric in article cards and detail views.
- Improved frontend engineering quality by replacing full-page refresh navigation with SPA routing, cleaning lint/type issues, and applying route-level lazy loading plus Vite manual chunk splitting.

## Interview Talking Points

### Product Thinking

- Why search matters more than decorative features in a content product.
- Why reading analytics improves product completeness with relatively low implementation cost.

### Backend Engineering

- How article draft access was restricted to author/admin only.
- Why unpublished content requests return 404 instead of 403.
- Why reading count increments only happen for published articles.

### Frontend Engineering

- Why route-level lazy loading was chosen for editor-heavy pages.
- How build output was analyzed and split by dependency domain instead of only by route.
- Why API logic and UI side effects were separated during refactor.

## Suggested Project Description

Built and iteratively refactored a full-stack blog platform for personal publishing and content management. The project includes user authentication, article CRUD, draft autosave, image upload, fuzzy search with pinyin-friendly matching, reading analytics, and role-based permission control. I also improved frontend maintainability and performance through route-level lazy loading, bundle splitting, and TypeScript/lint cleanup.
