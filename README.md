# Chess Platform

A full-featured chess platform inspired by Lichess, built with React, Node.js, and TypeScript.

## Features

- Real-time multiplayer chess gameplay
- User authentication system
- Rating system
- Game history
- Multiple time controls
- Basic chess analysis tools
- Chat functionality

## Technology Stack

### Frontend
- React.js
- TypeScript
- Socket.IO Client
- chess.js
- react-chessboard
- Material-UI

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- PostgreSQL
- TypeORM

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd chess-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm run install-all
\`\`\`

3. Set up environment variables:
Create a .env file in the server directory with the following variables:
\`\`\`
DATABASE_URL=postgresql://user:password@localhost:5432/chess_db
JWT_SECRET=your_jwt_secret
PORT=3000
\`\`\`

4. Start the development servers:
\`\`\`bash
npm run dev
\`\`\`

The frontend will be available at http://localhost:3000
The backend will be available at http://localhost:3001

## Project Structure

\`\`\`
/chess-platform
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Utility functions
├── server/              # Backend Node.js application
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utility functions
└── README.md
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.