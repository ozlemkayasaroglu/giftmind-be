# GiftMind Backend

Backend API for the GiftMind application built with Node.js and Express.

## Features

- Express.js server
- CORS enabled
- JSON body parsing
- MongoDB integration with Mongoose
- Environment variable configuration
- Basic health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB installation)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ozlemkayasaroglu/giftmind-be.git
   cd giftmind-be
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Set your MongoDB Atlas connection string
   - Adjust the port if needed
   
   **⚠️ SECURITY WARNING:** Never commit your `.env` file or expose your actual database credentials in any public repository!
   
   **Example MongoDB Atlas URI format:**
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/?retryWrites=true&w=majority&appName=your-app-name
   ```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint (includes database connection status)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB Atlas connection string
- `NODE_ENV` - Environment (development/production)

## Project Structure

```
giftmind-be/
├── models/           # MongoDB schemas and models
│   └── User.js       # User model example
├── index.js          # Main server file
├── package.json      # Dependencies and scripts
├── .env              # Environment variables (not in repo)
├── .env.example      # Environment variables template
├── .gitignore        # Git ignore rules
└── README.md         # Project documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
