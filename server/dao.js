import sqlite3Pkg from 'sqlite3';
import crypto from 'crypto';

// Connect to the database we built in Phase 1
const sqlite3 = sqlite3Pkg.verbose();
const db = new sqlite3.Database('./last_race.db', (err) => {
  if (err) throw err;
});

// ==========================================
// 1. AUTHENTICATION FUNCTIONS (For Passport)
// ==========================================

// Used by Passport's serialize/deserialize to remember the user
export const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(null); // User not found
      } else {
        // We only return the safe data. NEVER return the hash or salt!
        resolve({ id: row.id, username: row.username });
      }
    });
  });
};

// Used by Passport's LocalStrategy to verify login credentials
export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else if (row === undefined) {
        resolve(false); // Username does not exist
      } else {
        // 1. Extract the salt from the database
        const savedSalt = row.salt;
        const savedHash = row.hash;

        // 2. Hash the password the user just typed using the saved salt
        const hashedPassword = crypto.scryptSync(password, savedSalt, 32).toString('hex');

        // 3. Securely compare the two hashes
        const passwordsMatch = crypto.timingSafeEqual(
            Buffer.from(savedHash, 'hex'),
            Buffer.from(hashedPassword, 'hex')
        );

        if (passwordsMatch) {
          resolve({ id: row.id, username: row.username }); // Success!
        } else {
          resolve(false); // Wrong password
        }
      }
    });
  });
};
// ==========================================
// 2. GAME DATA FUNCTIONS (For the React API)
// ==========================================
export const getEvents = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM events';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
// Fetch all stations to draw the map on the frontend
export const getStations = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM stations';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
// Get all segments with actual station names!
export const getSegments = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        s1.name AS station_a, 
        s2.name AS station_b 
      FROM segments c
      JOIN stations s1 ON c.station_a_id = s1.id
      JOIN stations s2 ON c.station_b_id = s2.id
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
export const saveGame = (userId, score) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO games (user_id, score) VALUES (?, ?)';
    db.run(sql, [userId, score], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
};
// Get the highest score for each user for the leaderboard
export const getRankings = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT users.username, MAX(games.score) as best_score 
      FROM games 
      JOIN users ON games.user_id = users.id 
      GROUP BY users.id 
      ORDER BY best_score DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};