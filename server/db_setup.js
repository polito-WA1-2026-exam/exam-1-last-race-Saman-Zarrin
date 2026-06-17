import sqlite3Pkg from 'sqlite3';
import crypto from 'crypto';
import fs from 'fs';

// Initializing verbose mode for SQLite
const sqlite3 = sqlite3Pkg.verbose();

// Ensure fresh start 
const dbFile = './last_race.db';
if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
}

const db = new sqlite3.Database(dbFile);

// Helper function to securely hash passwords
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 32).toString('hex');
    return { salt, hash };
}

db.serialize(() => {
    console.log("Creating database tables...");

    // --- CREATE TABLES ---
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        salt TEXT NOT NULL,
        hash TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
    )`);

    db.run(`CREATE TABLE stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        is_interchange BOOLEAN NOT NULL CHECK (is_interchange IN (0, 1))
    )`);

    db.run(`CREATE TABLE segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_id INTEGER NOT NULL,
        station_a_id INTEGER NOT NULL,
        station_b_id INTEGER NOT NULL,
        FOREIGN KEY(line_id) REFERENCES lines(id),
        FOREIGN KEY(station_a_id) REFERENCES stations(id),
        FOREIGN KEY(station_b_id) REFERENCES stations(id)
    )`);

    db.run(`CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        effect INTEGER NOT NULL CHECK (effect >= -4 AND effect <= 4)
    )`);

    db.run(`CREATE TABLE games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    console.log("Inserting dummy data...");

    // --- INSERT USERS ---
    const users = ['mario', 'luigi', 'peach'];
    const stmtUsers = db.prepare(`INSERT INTO users (username, salt, hash) VALUES (?, ?, ?)`);
    users.forEach(user => {
        const credentials = hashPassword('password1common');
        stmtUsers.run(user, credentials.salt, credentials.hash);
    });
    stmtUsers.finalize();

    // --- INSERT LINES ---
    const lines = ['Red Line', 'Blue Line', 'Green Line', 'Yellow Line'];
    const stmtLines = db.prepare(`INSERT INTO lines (name) VALUES (?)`);
    lines.forEach(line => stmtLines.run(line));
    stmtLines.finalize();

    // --- INSERT STATIONS ---
    const stations = [
        { name: 'Centrale', int: 1 },             // 1 (Red, Blue)
        { name: 'Porta Velaria', int: 1 },        // 2 (Red, Green)
        { name: 'Torre Cinerea', int: 1 },        // 3 (Green, Yellow)
        { name: 'Crocevia del Falco', int: 0 },   // 4
        { name: 'Piazza delle Lanterne', int: 1 },// 5
        { name: 'Fontana Oscura', int: 0 },       // 6
        { name: 'Borgo Sereno', int: 0 },         // 7
        { name: 'Viale dei Mosaici', int: 0 },    // 8
        { name: 'Campo dell Eco', int: 0 },       // 9
        { name: 'Stazione Nord', int: 1 },        // 10
        { name: 'Parco Ovest', int: 1 },          // 11
        { name: 'Fiume Giallo', int: 0 }          // 12
    ];
    const stmtStations = db.prepare(`INSERT INTO stations (name, is_interchange) VALUES (?, ?)`);
    stations.forEach(st => stmtStations.run(st.name, st.int));
    stmtStations.finalize();

    // --- INSERT SEGMENTS ---
    const segments = [
        // Red Line (1)
        [1, 5, 4], // Piazza delle Lanterne <-> Crocevia del Falco
        [1, 4, 1], // Crocevia del Falco <-> Centrale
        [1, 1, 2], // Centrale <-> Porta Velaria
        // Blue Line (2)
        [2, 8, 7], // Viale dei Mosaici <-> Borgo Sereno
        [2, 7, 6], // Borgo Sereno <-> Fontana Oscura
        [2, 6, 1], // Fontana Oscura <-> Centrale
        [2, 5, 8], // Piazza delle Lanterne (Left) to Viale dei Mosaici
        [2, 6, 11], //Fontana Oscura (Middle) to Parco Ovest
        // Green Line (3)
        [3, 2, 3], // Porta Velaria <-> Torre Cinerea
        [3, 3, 9], // Torre Cinerea <-> Campo dell Eco
        [3, 9, 10], //Campo dell Eco (Right) down to Stazione Nord
        // Yellow Line (4)
        [4, 3, 10], // Torre Cinerea <-> Stazione Nord
        [4, 10, 11], // Stazione Nord <-> Parco Ovest
        [4, 11, 12]  // Parco Ovest <-> Fiume Giallo
    ];
    const stmtseg = db.prepare(`INSERT INTO segments (line_id, station_a_id, station_b_id) VALUES (?, ?, ?)`);
    segments.forEach(c => stmtseg.run(c[0], c[1], c[2]));
    stmtseg.finalize();

    // --- INSERT EVENTS ---
    const events = [
        ["Quiet journey", 0],
        ["Wrong platform", -2],
        ["Kind passenger", 1],
        ["Ticket inspected successfully", 2],
        ["Pickpocketed!", -4],
        ["Found a coin on the seat", 1],
        ["Train delayed", -1],
        ["Lucky shortcut", 3],
        ["Found a lost coin purse!", 4]
    ];
    const stmtEvents = db.prepare(`INSERT INTO events (description, effect) VALUES (?, ?)`);
    events.forEach(e => stmtEvents.run(e[0], e[1]));
    stmtEvents.finalize();

    // --- INSERT GAMES ---
    const games = [
        [1, 22], [1, 15], [2, 18], [2, 0]
    ];
    const stmtGames = db.prepare(`INSERT INTO games (user_id, score) VALUES (?, ?)`);
    games.forEach(g => stmtGames.run(g[0], g[1]));
    stmtGames.finalize();

    console.log("Database 'last_race.db' created and populated successfully!");
});

db.close();