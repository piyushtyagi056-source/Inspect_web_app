# Inspect Backend

This is the backend API for the Inspect web application.

## Setup

1. Install dependencies:
   npm install

2. Run in development mode:
   npm run dev

3. Build for production:
   npm run build
   npm start

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Inspections
- GET /api/inspections - Get user inspections (requires auth)
- POST /api/inspections - Create new inspection (requires auth)
- DELETE /api/inspections/:id - Delete inspection (requires auth)

## Database

Uses SQLite database (inspect.db) with tables:
- users: id, username, password
- inspections: id, username, date, description, location_lat, location_lng, location_address, photos

