# Inspect Web App

A comprehensive inspection management web application built with React, TypeScript, and Node.js.

## Demo Mode

For deployment and demonstration purposes, the application includes a **demo mode** that allows any user to login with any password. This is perfect for showcasing the app without requiring user registration.

### Demo Mode Features
- **Auto User Creation**: If a username doesn't exist, it's automatically created when logging in
- **Any Password Accepted**: Users can login with any password combination
- **No Security Restrictions**: Perfect for demos, testing, and deployment showcases

### Demo Mode Usage
Simply enter any username and any password on the login page. The system will:
1. Check if the user exists
2. If not, automatically create the user account
3. Generate a JWT token and log the user in
4. Display a success message

Example: Username "demo", Password "123" → User created and logged in successfully!

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite for build tooling
- React Router for navigation
- IndexedDB for local storage
- Lucide React for icons

### Backend
- Node.js with Express.js
- TypeScript
- SQLite database
- JWT authentication
- bcrypt for password hashing

## Project Structure

```
inspect/
+-- src/                    # Frontend source code
�   +-- components/         # React components
�   +-- context/           # React context providers
�   +-- pages/             # Page components
�   +-- services/          # API and database services
�   +-- utils/             # Utility functions
+-- server/                # Backend API
�   +-- src/
�   �   +-- routes/        # API route handlers
�   �   +-- db.ts          # Database configuration
�   �   +-- index.ts       # Server entry point
�   +-- README.md          # Backend documentation
+-- public/                # Static assets
+-- package.json           # Frontend dependencies
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/piyushtyagi056-source/Inspect_web_app.git
   cd inspect
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```
   The backend will run on http://localhost:3000

2. In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5174

### Building for Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Build the backend:
   ```bash
   cd server
   npm run build
   npm start
   ```

## Deployment

The application is ready for deployment with demo mode enabled. Anyone can login with any username/password combination.

### Deployment Steps

1. **Build both frontend and backend** as described above
2. **Deploy the backend** to your server (runs on port 3000)
3. **Deploy the frontend** static files to your web server
4. **Configure CORS** if needed for cross-origin requests
5. **Demo mode is active** - no additional configuration needed!

### Demo Mode Benefits for Deployment
- **No user management required**
- **Instant access for demonstrations**
- **No database setup complexity**
- **Perfect for showcases and testing**

The app will automatically create user accounts on first login and accept any password.


Detailed API documentation can be found in the `server/README.md` file in the server directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
### Testing the Application

1. **Frontend**: Open http://localhost:5175 in your browser
2. **Backend API**: The API is running at http://localhost:3000
3. **Demo Login**: Use any username and any password to login (demo mode enabled)

### Demo Mode Testing

The application is configured in **demo mode** where:
- Any username/password combination allows login
- New users are automatically created on first login
- No registration required

**Try these examples:**
- Username: "demo", Password: "123"
- Username: "test", Password: "any"
- Username: "user1", Password: "password"

All will successfully create accounts and log users in!

### Features to Test

- **Registration/Login**: Create a new account or login with existing credentials
- **Create Inspections**: Add new inspections with photos and location data
- **View Inspections**: See all your saved inspections
- **Offline Support**: The app works offline and syncs when the backend is available

### API Testing

You can test the API endpoints directly:

**Demo Login (any username/password works):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"123"}'
```

**Register a new user (optional in demo mode):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"password123"}'
```

**Get inspections (requires auth token):**
```bash
curl -X GET http://localhost:3000/api/inspections \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
## API Documentation
> Detailed API documentation can be found in the `server/README.md` file in the server directory.
  
  ## Contributing
  
  1. Fork the repository
  2. Create a feature branch
  3. Make your changes
  4. Test thoroughly
  5. Submit a pull request
  
  ## License
