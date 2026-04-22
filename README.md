# Inspect Web App

A comprehensive inspection management web application built with React, TypeScript, and Node.js.

## Features

- **User Authentication**: Secure login and registration system
- **Inspection Management**: Create, view, and delete inspections
- **Photo Capture**: Take photos with location data during inspections
- **Offline Support**: Works offline with local storage fallback
- **Responsive Design**: Mobile-friendly interface

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
¦   +-- components/         # React components
¦   +-- context/           # React context providers
¦   +-- pages/             # Page components
¦   +-- services/          # API and database services
¦   +-- utils/             # Utility functions
+-- server/                # Backend API
¦   +-- src/
¦   ¦   +-- routes/        # API route handlers
¦   ¦   +-- db.ts          # Database configuration
¦   ¦   +-- index.ts       # Server entry point
¦   +-- README.md          # Backend documentation
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
   The frontend will run on http://localhost:5173

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

## API Documentation

Detailed API documentation can be found in the [server/README.md](server/README.md) file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
