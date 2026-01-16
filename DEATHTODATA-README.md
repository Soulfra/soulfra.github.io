# DeathToData - Complete Backend System

## What You've Built

A full-stack privacy-first email collection and messaging system for DeathToData.

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Static HTML + JavaScript)                     │
│  - Landing page with email signup                        │
│  - User dashboard with messages and feed                 │
└───────────────┬─────────────────────────────────────────┘
                │
                ↓ API Calls
┌───────────────────────────────────────────────────────────┐
│  Backend API (Express.js on port 5051)                    │
│  - POST /api/signup - Email collection                    │
│  - GET /api/messages/:email - Fetch messages              │
│  - GET /api/feed - Internal feed                          │
│  - POST /api/messages/:id/read - Mark as read             │
└───────────────┬───────────────────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────────────────┐
│  Database (SQLite local / PostgreSQL production)          │
│  - users                                                   │
│  - messages                                                │
│  - waitlist                                                │
│  - internal_feed                                           │
│  - analytics_events                                        │
└───────────────────────────────────────────────────────────┘
```

## Running the System Locally

### Prerequisites
- Node.js installed
- Python 3 for static file server

### Step 1: Start the API Backend
```bash
node api/deathtodata-backend.js
```
You should see:
```
🚀 DeathToData API running on http://localhost:5051
📊 Database: SQLite
✅ Connected to SQLite database: ...
```

### Step 2: Start the Static File Server
In a separate terminal:
```bash
python3 -m http.server 8000
```

### Step 3: Test the System
1. **Visit landing page**: http://localhost:8000/deathtodata/
2. **Sign up with an email**: Fill in the form and click "Join Waitlist"
3. **Visit dashboard**: http://localhost:8000/deathtodata/dashboard.html
4. **Login**: Enter your email to see your welcome message
5. **Check internal feed**: See announcements and guides

## Files Created

### Backend Files
- `config/sqliteClient.js` - SQLite database client
- `api/deathtodata-backend.js` - Express API server
- `db/schema.sql` - Database schema
- `deathtodata.db` - SQLite database (auto-created)
- `.env.example` - Environment configuration template

### Frontend Files
- `deathtodata/index.html` - Landing page with signup form (modified)
- `deathtodata/dashboard.html` - User dashboard (created)

### Documentation
- `DEATHTODATA-BACKEND-SUMMARY.md` - Full implementation guide
- `DEATHTODATA-README.md` - This file

## API Endpoints

### POST /api/signup
Sign up new user and add to waitlist.

**Request:**
```json
{
  "email": "user@example.com",
  "source": "landing-page"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome! Check your dashboard at /dashboard.html",
  "userId": 1
}
```

### GET /api/messages/:email
Get all messages for a user.

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "subject": "Welcome to DeathToData!",
    "body": "Thanks for joining...",
    "created_at": "2026-01-13T17:52:39.000Z",
    "read": 0
  }
]
```

### GET /api/feed
Get internal feed items.

**Response:**
```json
[
  {
    "id": 1,
    "author": "DeathToData Team",
    "title": "Welcome to DeathToData",
    "content": "Your privacy-first search engine...",
    "category": "announcement",
    "created_at": "2026-01-13T17:52:39.000Z"
  }
]
```

### POST /api/messages/:id/read
Mark a message as read.

**Response:**
```json
{
  "success": true
}
```

## Database Schema

### users
- `id` - Auto-increment primary key
- `email` - Unique email address
- `name` - Optional user name
- `created_at` - Signup timestamp
- `last_login` - Last login timestamp
- `is_active` - Account status

### messages
- `id` - Auto-increment primary key
- `user_id` - Foreign key to users
- `subject` - Message subject
- `body` - Message content
- `created_at` - Message timestamp
- `read` - Read status (0/1)

### waitlist
- `id` - Auto-increment primary key
- `email` - Unique email address
- `source` - Where they signed up from
- `referrer` - Optional referrer
- `created_at` - Signup timestamp

### internal_feed
- `id` - Auto-increment primary key
- `author` - Author name
- `title` - Feed item title
- `content` - Feed item content
- `category` - Category tag
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### analytics_events
- `id` - Auto-increment primary key
- `event_type` - Type of event
- `user_id` - Optional user ID
- `metadata` - JSON metadata
- `ip_address` - Client IP
- `user_agent` - Client user agent
- `created_at` - Event timestamp

## Environment Detection

The system automatically switches between local and production:

**Local (SQLite):**
- API detects `NODE_ENV !== 'production'`
- Uses SQLite database at `./deathtodata.db`
- Frontend connects to `http://localhost:5051`

**Production (PostgreSQL):**
- Set `NODE_ENV=production`
- Uses `DATABASE_URL` from environment
- Frontend connects to `https://api.deathtodata.com`

## Deployment to Production

### Option 1: Railway.app (Recommended)
1. Push code to GitHub
2. Create new project on Railway
3. Connect GitHub repo
4. Add PostgreSQL service
5. Set environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` (auto-set by Railway)
6. Deploy!

### Option 2: Render.com
1. Create Web Service
2. Connect GitHub repo
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

### Database Migration
When deploying to production with PostgreSQL:
1. Update `db/schema.sql` to use PostgreSQL syntax (replace AUTOINCREMENT with SERIAL)
2. Run migrations on production database
3. Seed initial data for internal_feed table

## Testing Checklist

- [ ] Email signup creates user in database
- [ ] Email signup creates welcome message
- [ ] Dashboard displays user messages
- [ ] Dashboard displays internal feed
- [ ] Messages can be marked as read
- [ ] Duplicate email shows error
- [ ] Invalid email shows error
- [ ] Dashboard login works
- [ ] Dashboard logout works

## Security Notes

1. **Email-based authentication** - Simple email login (no passwords)
2. **CORS enabled** - Configure for production domain
3. **Input validation** - Email format validation
4. **No tracking** - No cookies, no profiling
5. **Local storage** - Email stored in localStorage for session

## Next Steps

### Enhance the System
1. Add email verification (magic links)
2. Add rate limiting (express-rate-limit)
3. Add admin panel for sending messages
4. Add analytics dashboard
5. Add RSS feed for internal updates
6. Add search functionality

### Deploy to Production
1. Set up GitHub repo
2. Deploy to Railway or Render
3. Configure custom domain (deathtodata.com)
4. Set up HTTPS
5. Update DNS records
6. Test production deployment

## Troubleshooting

### API not starting?
- Check if port 5051 is available: `lsof -i :5051`
- Check Node.js version: `node --version`
- Reinstall dependencies: `npm install`

### Database errors?
- Verify database exists: `ls deathtodata.db`
- Recreate database: `rm deathtodata.db && sqlite3 deathtodata.db < db/schema.sql`
- Check schema: `sqlite3 deathtodata.db ".schema"`

### Frontend not connecting to API?
- Check browser console for errors
- Verify API is running on port 5051
- Check CORS configuration
- Verify API_URL in JavaScript

## Architecture Benefits

✅ **Works offline** - SQLite for local development
✅ **Production-ready** - PostgreSQL for scale
✅ **No API costs** - Self-hosted backend
✅ **Privacy-first** - No external tracking
✅ **Fast deployment** - Static frontend + API backend
✅ **Easy testing** - Everything runs locally

## File Structure

```
soulfra.github.io/
├── api/
│   └── deathtodata-backend.js     # Express API server
├── config/
│   ├── sqliteClient.js            # SQLite client
│   └── postgresClient.js          # PostgreSQL client
├── db/
│   └── schema.sql                 # Database schema
├── deathtodata/
│   ├── index.html                 # Landing page with signup
│   └── dashboard.html             # User dashboard
├── deathtodata.db                 # SQLite database
├── .env.example                   # Environment template
├── DEATHTODATA-BACKEND-SUMMARY.md # Full guide
└── DEATHTODATA-README.md          # This file
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review `DEATHTODATA-BACKEND-SUMMARY.md`
3. Test with curl: `curl http://localhost:5051/api/feed`

---

**Built with privacy in mind. No tracking, no profiling, no surveillance.**
