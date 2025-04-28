import FtpSrv from "ftp-srv";
import { MongoClient } from "mongodb";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";
import chokidar from "chokidar";
import { exec } from "child_process";
import { startFtpUsersWatcher } from "./ftpFileMonitor.js";
dotenv.config();

// Required to resolve paths with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB connection setup
const mongoUri = process.env.MONGO_URI; // Loaded from .env
const dbName = process.env.MONGO_DB; // Loaded from .env
const client = new MongoClient(mongoUri);

async function getUserFromDb(username) {
  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCollection = db.collection("users"); // Replace with your collection name
    return await usersCollection.findOne({ username });
  } catch (err) {
    console.error("Error fetching user from MongoDB:", err);
    throw new Error("Database error");
  }
}

const ftpServer = new FtpSrv({
  url: "ftp://0.0.0.0:21",
  anonymous: false,
  pasv_url: "localhost", // or your public IP if connecting externally
  pasv_min: 1024,
  pasv_max: 1048,
});

// ftpServer.on("client-error", (err) => {
//   console.error("Client error:", err);
// });

// Define any missing commands or extend functionality here
ftpServer.on("command", (cmd, args, socket) => {
  // Custom handling of FTP commands here
  console.log(`Received FTP command: ${cmd} ${args}`);
});

ftpServer.on("login", async ({ username, password }, resolve, reject) => {
  try {
    const user = await getUserFromDb(username);
    if (user && user.password === password) {
      const userRoot = path.resolve(__dirname, "..", user.root);

      // Ensure the user's root folder exists
      try {
        await fs.mkdir(userRoot, { recursive: true });
      } catch (err) {
        console.error(`Failed to create user folder for ${username}:`, err);
        return reject(new Error("Server error creating user folder"));
      }

      return resolve({ root: userRoot });
    }
    return reject(new Error("Invalid credentials"));
  } catch (err) {
    console.error("Error during login:", err);
    return reject(new Error("Server error during login"));
  }
});

const STORAGE_LOCATION = process.env.STORAGE_LOCATION || path.resolve(__dirname, "../../storage");
const GIT_REPO = process.env.GIT_REPO;
const GIT_PAT = process.env.GIT_PAT;
const FTP_USERS_DIR = path.resolve(__dirname, "../ftp-users");

// Ensure STORAGE_LOCATION exists and is a git repo
async function setupStorageGit() {
  try {
    await fs.mkdir(STORAGE_LOCATION, { recursive: true });
    // Check if .git exists
    try {
      await fs.access(path.join(STORAGE_LOCATION, ".git"));
      console.log("[Storage] Git repo already initialized.");
    } catch {
      // Init and set remote
      await new Promise((res, rej) => exec(`git init`, { cwd: STORAGE_LOCATION }, (e) => e ? rej(e) : res()));
      if (GIT_REPO && GIT_PAT) {
        // Set remote with PAT
        const url = GIT_REPO.replace('https://', `https://${GIT_PAT}@`);
        await new Promise((res, rej) => exec(`git remote add origin ${url}`, { cwd: STORAGE_LOCATION }, (e) => e ? rej(e) : res()));
        console.log("[Storage] Git remote set.");
      }
      console.log("[Storage] Git repo initialized.");
    }
  } catch (err) {
    console.error("[Storage] Setup error:", err);
  }
}

// Debounce commit/push
let debounceTimer = null;
function debounceGitSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      await new Promise((res, rej) => exec(`git add .`, { cwd: STORAGE_LOCATION }, (e) => e ? rej(e) : res()));
      await new Promise((res, rej) => exec(`git commit -m "Auto sync from FTP upload"`, { cwd: STORAGE_LOCATION }, (e) => e ? rej(e) : res()));
      if (GIT_REPO && GIT_PAT) {
        await new Promise((res, rej) => exec(`git push origin master`, { cwd: STORAGE_LOCATION }, (e, stdout, stderr) => {
          if (e) {
            console.error("[Git] Push error:", stderr);
            rej(e);
          } else {
            console.log("[Git] Pushed to remote.");
            res();
          }
        }));
      }
      console.log("[Git] Synced changes.");
    } catch (err) {
      console.error("[Git] Sync error:", err);
    }
  }, 10000); // 10s debounce
}

ftpServer.listen().then(() => {
  console.log("FTP Server running on ftp://0.0.0.0:21");
  startFtpUsersWatcher();
});
