import fs from "fs";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const usersFile = new URL("./data/users.json", import.meta.url);
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

async function upsertUsers() {
  const usersRaw = fs.readFileSync(usersFile, "utf-8");
  const users = JSON.parse(usersRaw);
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("users");
    for (const [username, userData] of Object.entries(users)) {
      await collection.updateOne(
        { username },
        { $set: { ...userData, username } },
        { upsert: true }
      );
      console.log(`Upserted user: ${username}`);
    }
    console.log("User import complete.");

    // List all users with partially masked passwords in a table format
    const tableData = Object.entries(users).map(([username, userData]) => {
      const password = userData.password || '';
      let maskedPassword = '';
      if (password.length > 4) {
        maskedPassword = password.slice(0, 4) + '*'.repeat(password.length - 4);
      } else {
        maskedPassword = password;
      }
      return {
        username,
        password: maskedPassword
      };
    });
    console.log("Imported users:");
    console.table(tableData);
  } catch (err) {
    console.error("Error importing users:", err);
  } finally {
    await client.close();
  }
}

upsertUsers();
