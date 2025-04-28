import path from "path";
import fs from "fs/promises";
import chokidar from "chokidar";
import { exec } from "child_process";
import dotenv from "dotenv";
dotenv.config();

const STORAGE_LOCATION = process.env.STORAGE_LOCATION;
const GIT_REPO = process.env.GIT_REPO;
const GIT_PAT = process.env.GIT_PAT;
const FTP_USERS_DIR = process.env.FTP_USERS_DIR;

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
      await new Promise((res, rej) => exec(`git commit -m \"Auto sync from FTP upload\"`, { cwd: STORAGE_LOCATION }, (e) => e ? rej(e) : res()));
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

async function handleFileEvent(filePath, eventType) {
  try {
    const relPath = path.relative(FTP_USERS_DIR, filePath);
    const destPath = path.join(STORAGE_LOCATION, relPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(filePath, destPath);
    console.log(`[Watcher] ${eventType} - Copied ${filePath} to ${destPath}`);
    debounceGitSync();
  } catch (err) {
    console.error(`[Watcher] Error handling ${eventType} for ${filePath}:`, err);
  }
}

export async function startFtpUsersWatcher() {
  await setupStorageGit();
  chokidar.watch(FTP_USERS_DIR, { ignoreInitial: true, persistent: true })
    .on('add', async (filePath) => {
      await handleFileEvent(filePath, 'add');
    })
    .on('change', async (filePath) => {
      await handleFileEvent(filePath, 'change');
    });
  console.log(`[Watcher] Watching FTP uploads in ${FTP_USERS_DIR}`);
}
