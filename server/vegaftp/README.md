# vegaftp

This is a Node.js FTP server for accepting FTP uploads from VegaChess. It uses MongoDB for user management and supports environment configuration.

## Setup Instructions

### 1. Clone the repository
```sh
git clone <your-repo-url>
cd server/vegaftp
```

### 2. Install dependencies
```sh
npm install
```

### 3. Configure environment variables
Create a `.env` file in the `server/vegaftp` directory. See `.env.sample` for an example.

### 4. Add FTP users
Edit `data/users.json` to add users. See `data/users.sample.json` for the format.

### 5. Import users to MongoDB
```sh
npm run app-init
```

### 6. Start the FTP server
```sh
npm start
```

## Scripts
- `npm run app-init`: Import users from `data/users.json` into MongoDB.
- `npm start`: Start the FTP server.
- `npm run dev`: Start the server with nodemon for development.

## File Samples

### .env.sample
```
MONGODB_URI=mongodb://localhost:27017/vegaftp
FTP_PORT=2121
FTP_HOST=0.0.0.0
```

### data/users.sample.json
```
[
  {
    "username": "admin",
    "password": "admin1234"
  },
  {
    "username": "user1",
    "password": "user1pass"
  }
]
```
