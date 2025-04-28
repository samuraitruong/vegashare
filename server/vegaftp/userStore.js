import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const usersFile = path.resolve(__dirname, "data/users.json");

export function getUsers() {
  return JSON.parse(fs.readFileSync(usersFile, "utf-8"));
}

export function getUser(username) {
  const users = getUsers();
  return users[username];
}

export function addUser(username, password, root) {
  const users = getUsers();
  users[username] = { password, root };
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}
