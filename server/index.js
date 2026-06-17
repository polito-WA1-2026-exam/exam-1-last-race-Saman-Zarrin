// imports
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import * as dao from './dao.js';

// init express
const app = express();
const port = 3001;

// --- HELPER FUNCTION: Calculate Node Distances ---
// This uses Breadth-First Search (BFS) to find the shortest path distances in our metro graph
function getDistances(graph, startNode) {
  let distances = { [startNode]: 0 };
  let queue = [startNode];

  while (queue.length > 0) {
    let current = queue.shift();
    let currentDist = distances[current];

    if (graph[current]) {
      for (let neighbor of graph[current]) {
        if (distances[neighbor] === undefined) {
          distances[neighbor] = currentDist + 1;
          queue.push(neighbor);
        }
      }
    }
  }
  return distances;
}

// --- 1. MIDDLEWARE ---
// Parsing incoming JSON payloads
app.use(express.json());

// Configuring CORS for React compatibility
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true, // CRITICAL: Allows session cookies
};
app.use(cors(corsOptions));

// --- 2. PASSPORT & SESSION CONFIGURATION ---
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  try {
    const user = await dao.getUser(username, password);
    if (!user) {
      return callback(null, false, { message: 'Incorrect username or password.' });
    }
    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
}));

passport.serializeUser((user, callback) => {
  callback(null, user.id);
});

passport.deserializeUser(async (id, callback) => {
  try {
    const user = await dao.getUserById(id);
    callback(null, user);
  } catch (err) {
    callback(err);
  }
});

// Initialize Express Session
app.use(session({
  secret: 'last_race_exam_super_secret_key',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.authenticate('session'));

// --- 3. API ROUTES ---
app.get('/api/test', (req, res) => {
  res.json({ message: "Server is running perfectly with ES Modules!" });
});

// --- AUTHENTICATION ROUTES ---

// 1. Login
app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  res.status(201).json(req.user);
});

// 2. Check if currently logged in
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// 3. Logout
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// --- GAME ROUTES ---

// 4. Get the Metro Map (Stations)
app.get('/api/stations', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'You must be logged in to view the map.' });
    }
    const stations = await dao.getStations();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: `Database error: ${err}` });
  }
});

// 5. Get the Segments (The Map Graph)
app.get('/api/segments', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'You must be logged in to view routes.' });
    }
    const segments = await dao.getSegments();
    res.json(segments);
  } catch (err) {
    res.status(500).json({ error: `Database error: ${err}` });
  }
});

// 6. Setup Game (Random Start and Target with distance >= 3)
app.get('/api/game/setup', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'You must be logged in to play.' });
    }

    const stations = await dao.getStations();
    const segments = await dao.getSegments();

    // Build the Graph
    const graph = {};
    stations.forEach(st => graph[st.name] = []);
    segments.forEach(conn => {
      if (graph[conn.station_a]) graph[conn.station_a].push(conn.station_b);
      if (graph[conn.station_b]) graph[conn.station_b].push(conn.station_a);
    });

    let startStation;
    let targetStation;
    let validTargets = [];

    // Shuffle stations and find a pair that meets the 3-segment rule
    const shuffledStations = [...stations].sort(() => 0.5 - Math.random());

    for (let start of shuffledStations) {
      startStation = start.name;
      const distances = getDistances(graph, startStation);

      // Filter targets that are exactly 3 or more segments away
      validTargets = Object.keys(distances).filter(station => distances[station] >= 3);

      if (validTargets.length > 0) {
        break; // We found a valid starting station with available long-distance targets!
      }
    }

    if (validTargets.length === 0) {
      return res.status(500).json({ error: "Network too small to enforce 3-segment distance." });
    }

    // Pick a random valid target from our filtered list
    targetStation = validTargets[Math.floor(Math.random() * validTargets.length)];

    res.json({ 
      startStation: startStation, 
      targetStation: targetStation 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate game setup.' });
  }
});

// 7. Get the Events
app.get('/api/events', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'You must be logged in.' });
    }
    const events = await dao.getEvents(); 
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: `Database error: ${err}` });
  }
});
// 8. Get the Leaderboard Rankings
app.get('/api/rankings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'You must be logged in to view rankings.' });
    }
    const rankings = await dao.getRankings();
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: `Database error: ${err}` });
  }
});
// 9. Save the Final Game Score
app.post('/api/games', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = req.user.id;
    const { score } = req.body;
    
    await dao.saveGame(userId, score);
    res.status(201).json({ message: 'Game saved successfully!' });
  } catch (err) {
    res.status(500).json({ error: `Database error: ${err}` });
  }
});
// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});