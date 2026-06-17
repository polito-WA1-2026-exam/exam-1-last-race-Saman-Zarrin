import { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Alert, Spinner, Button, ProgressBar, Badge, ListGroup } from 'react-bootstrap';
import axios from 'axios';
import MetroMap from './MetroMap';
import { useNavigate } from 'react-router-dom'; 
function Game() {
  // 1. Data State
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [stations, setStations] = useState([]);
  const [segments, setSegments] = useState([]);
  const [metroMap, setMetroMap] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [gameSaved, setGameSaved] = useState(false);
  // 2. Game Phase State (1 = Setup, 2 = Planning, 3 = Execution)
  const [phase, setPhase] = useState(1);
  const [phase1TimeLeft, setPhase1TimeLeft] = useState(10);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds for Planning Phase
  const [events, setEvents] = useState([]);
  const [coins, setCoins] = useState(20);
  const [executionLog, setExecutionLog] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  // 3. Mission & Route State
  const [startStation, setStartStation] = useState('');
  const [targetStation, setTargetStation] = useState('');
  
  // These hold the user's route-building choices
  const [availableSegments, setAvailableSegments] = useState([]);
  const [plannedRoute, setPlannedRoute] = useState([]);

  // --- EFFECT 0: Protect the Route ---
  // --- EFFECT: Protect the Route ---
  useEffect(() => {
    const verifyUser = async () => {
      try {
        // Ask the server who is currently logged in
        await axios.get('http://localhost:3001/api/sessions/current', { withCredentials: true });
        
        // If we get here, the server said YES. Stop loading and let them play!
        setIsAuthChecking(false);
      } catch (err) {
        // If the server says NO (401 Unauthorized), kick them back to the login page
        console.error("Not authenticated, redirecting...");
        navigate('/login');
      }
    };

    verifyUser();
  }, [navigate]);

  // --- EFFECT 1: Fetch ALL Data on Mount ---
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const [stationsRes, segmentsRes, setupRes, eventsRes] = await Promise.all([
          axios.get('http://localhost:3001/api/stations', { withCredentials: true }),
          axios.get('http://localhost:3001/api/segments', { withCredentials: true }),
          axios.get('http://localhost:3001/api/game/setup', { withCredentials: true }),
          axios.get('http://localhost:3001/api/events', { withCredentials: true }) 
        ]);
        
        const stationsData = stationsRes.data;
        const segmentsData = segmentsRes.data;
        const setupData = setupRes.data;

        setStations(stationsData);
        setSegments(segmentsData);
        setAvailableSegments(segmentsData); 
        
        setStartStation(setupData.startStation);
        setTargetStation(setupData.targetStation);
        setEvents(eventsRes.data);
        // Build the graph for Phase 1 visualization
        const graph = {};
        stationsData.forEach(st => graph[st.name] = []);
        segmentsData.forEach(conn => {
          if (graph[conn.station_a]) graph[conn.station_a].push(conn.station_b);
          if (graph[conn.station_b]) graph[conn.station_b].push(conn.station_a);
        });

        setMetroMap(graph); 
        setIsLoading(false);

      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load metro data. Ensure you are logged in.');
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, []);

  // --- EFFECT: Phase 1 Timer (10 Seconds) ---
  useEffect(() => {
    if (phase === 1 && phase1TimeLeft > 0) {
      const timerId = setTimeout(() => setPhase1TimeLeft(phase1TimeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (phase === 1 && phase1TimeLeft === 0) {
      startPlanning(); // Auto-start Phase 2!
    }
  }, [phase, phase1TimeLeft]);

  // --- EFFECT 2: Phase 2 Timer (90 Seconds) ---
  useEffect(() => {
    if (phase === 2 && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (phase === 2 && timeLeft === 0) {
      submitRoute();
    }
  }, [phase, timeLeft]);

  // --- ROUTE BUILDER LOGIC ---
  const startPlanning = () => setPhase(2);

  const addSegment = (segment) => {
    setAvailableSegments(availableSegments.filter(s => 
      !(s.station_a === segment.station_a && s.station_b === segment.station_b)
    ));
    setPlannedRoute([...plannedRoute, segment]);
  };

  const removeSegment = (segment) => {
    setPlannedRoute(plannedRoute.filter(s => 
      !(s.station_a === segment.station_a && s.station_b === segment.station_b)
    ));
    setAvailableSegments([...availableSegments, segment]);
  };

  // --- ROUTE VALIDATION & EXECUTION LOGIC ---
  const submitRoute = () => {
    setPhase(3);
    
    // 1. Validate the Route
    let isValid = true;
    let currentLoc = startStation;
    
    if (plannedRoute.length === 0) isValid = false;

    // Check if the chain connects perfectly from Start to Target
    for (let i = 0; i < plannedRoute.length; i++) {
      const seg = plannedRoute[i];
      if (seg.station_a === currentLoc) {
        currentLoc = seg.station_b;
      } else if (seg.station_b === currentLoc) {
        currentLoc = seg.station_a;
      } else {
        isValid = false; // The chain is broken!
        break;
      }
    }

    if (currentLoc !== targetStation) isValid = false;

    // 2. Handle Outcome
    if (!isValid) {
      setCoins(0);
      setExecutionLog([{ type: 'danger', text: 'INVALID ROUTE! You got lost in the metro and lost all your coins.' }]);
    } else {
      setExecutionLog([{ type: 'info', text: 'Route validated. Boarding the train...' }]);
      setIsExecuting(true); // Start the step-by-step engine
    }
  };

  // --- EFFECT 3: The Step-by-Step Event Engine ---
  useEffect(() => {
    if (isExecuting && currentStepIndex < plannedRoute.length) {
      
      const timerId = setTimeout(() => {
        const currentSegment = plannedRoute[currentStepIndex];
        
        //After 4 stations, negative events are much more likely!
        let eventPool = events;
        if (currentStepIndex >= 4) {
          // Filter to heavily favor negative events or duplicate them in the pool
          const badEvents = events.filter(e => e.effect < 0);
          eventPool = [...events, ...badEvents, ...badEvents]; 
        }

        // Pick a random event
        const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
        
        // Calculate new coins (cannot go below 0)
        const newCoinTotal = Math.max(0, coins + randomEvent.effect);
        setCoins(newCoinTotal);

        // Add to the visual log
        const logMessage = {
          type: randomEvent.effect >= 0 ? 'success' : 'warning',
          text: `Traveled through ${currentSegment.station_a} ↔ ${currentSegment.station_b}. ${randomEvent.description} (${randomEvent.effect > 0 ? '+' : ''}${randomEvent.effect} coins)`
        };
        
        setExecutionLog(prev => [...prev, logMessage]);
        setCurrentStepIndex(prev => prev + 1);
        
      }, 2000); // Wait 2 seconds between each step for suspense!

      return () => clearTimeout(timerId);

    } else if (isExecuting && currentStepIndex === plannedRoute.length) {
      // The journey is complete!
      setIsExecuting(false);
      setExecutionLog(prev => [...prev, { type: 'primary', text: `Journey Complete! Final Score: ${coins} coins.` }]);
    }
  }, [isExecuting, currentStepIndex, plannedRoute, events, coins]);
  useEffect(() => {
    // Check if Phase 3 is over (Execution finished OR player went bankrupt)
    const isGameOver = phase === 3 && !isExecuting && (executionLog.length > 0 || coins === 0);
    
    if (isGameOver && !gameSaved) {
      axios.post('http://localhost:3001/api/games', { score: coins }, { withCredentials: true })
        .then(() => setGameSaved(true))
        .catch(err => console.error("Failed to save score:", err));
    }
  }, [phase, isExecuting, executionLog, coins, gameSaved]);
  if (isAuthChecking) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <h3 className="mt-3">Checking credentials...</h3>
      </Container>
    );
  }
  return (
    <Container className="mt-5 mb-5">
      <h2 className="mb-4 text-center text-primary">Last Race</h2>
      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {isLoading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {/* ========================================== */}
          {/* PHASE 1: SETUP (Full Map Visible)          */}
          {/* ========================================== */}
          {phase === 1 && (
            <div>
              <Card className="text-center mb-4 border-info shadow-sm">
                <Card.Body>
                  <Card.Title className="fs-3 fw-bold">Phase 1: Setup</Card.Title>
                  
                  {/* The 10-second timer */}
                  <h4 className="text-danger mt-3">{phase1TimeLeft} Seconds to Memorize!</h4>
                  <ProgressBar variant="danger" now={(phase1TimeLeft / 10) * 100} className="mb-4" />
                  
                  <p className="text-muted">Study the map below. The lines will disappear in Phase 2!</p>
                  <Button variant="primary" size="lg" onClick={startPlanning}>
                    I'm Ready. Start Phase 2 Now
                  </Button>
                </Card.Body>
              </Card>

              {/* The Visual Map (Lines ON) */}
              <MetroMap showLines={true} />
            </div>
          )}

          {/* ========================================== */}
          {/* PHASE 2: PLANNING (90 Second Route Builder) */}
          {/* ========================================== */}
          {phase === 2 && (
            <div className="planning-phase">
              <Card className="text-center mb-4 border-warning shadow-sm">
                <Card.Body>
                  <Card.Title className="text-warning fs-3 fw-bold">Phase 2: Planning</Card.Title>
                  <Card.Text className="fs-5 mb-1">
                    Route: <Badge bg="success">{startStation}</Badge> ➔ <Badge bg="danger">{targetStation}</Badge>
                  </Card.Text>
                  <h4 className="mt-3 text-danger">{timeLeft} Seconds Remaining</h4>
                  <ProgressBar variant="warning" now={(timeLeft / 90) * 100} className="mb-4" />
                </Card.Body>
              </Card>
              {/* The Visual Map (Lines OFF) */}
              <MetroMap showLines={false} plannedSegments={plannedRoute} />
              <Row>
                {/* Left Column: Available Segments */}
                <Col md={6}>
                  <h4 className="text-center">Available Segments</h4>
                  <ListGroup className="shadow-sm" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {availableSegments.map((seg) => (
                      <ListGroup.Item 
                        key={`${seg.station_a}-${seg.station_b}`} 
                        action 
                        onClick={() => addSegment(seg)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        {seg.station_a} ↔ {seg.station_b}
                        <Badge bg="secondary">+</Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Col>

                {/* Right Column: Your Planned Route */}
                <Col md={6}>
                  <h4 className="text-center">Your Planned Route</h4>
                  <ListGroup className="shadow-sm mb-4" style={{ minHeight: '150px' }}>
                    {plannedRoute.length === 0 ? (
                      <ListGroup.Item className="text-muted text-center">Click segments on the left to build your route.</ListGroup.Item>
                    ) : (
                      plannedRoute.map((seg, index) => (
                        <ListGroup.Item 
                          key={`${seg.station_a}-${seg.station_b}`} 
                          variant="info"
                          action
                          onClick={() => removeSegment(seg)}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <span><strong>{index + 1}.</strong> {seg.station_a} ↔ {seg.station_b}</span>
                          <Badge bg="danger">x</Badge>
                        </ListGroup.Item>
                      ))
                    )}
                  </ListGroup>

                  <Button variant="success" size="lg" className="w-100 shadow" onClick={submitRoute}>
                    Submit Route Now
                  </Button>
                </Col>
              </Row>
            </div>
          )}
          {/* ========================================== */}
          {/* PHASE 3: EXECUTION                       */}
          {/* ========================================== */}
          {phase === 3 && (
            <Card className="shadow-sm border-0 bg-light">
              <Card.Header className="bg-dark text-white text-center py-3">
                <h3 className="mb-0">Phase 3: Execution</h3>
              </Card.Header>
              <Card.Body className="p-4">
                
                <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
                  <h4 className="mb-0">Purse: <Badge bg="warning" text="dark" className="fs-4">{coins} Coins</Badge></h4>
                  <h4 className="mb-0">Destination: <Badge bg="danger">{targetStation}</Badge></h4>
                </div>

                <h5 className="mb-3 border-bottom pb-2">Travel Log</h5>
                <ListGroup className="mb-4">
                  {executionLog.map((log, index) => (
                    <ListGroup.Item key={index} variant={log.type} className="fw-bold">
                      {log.text}
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                {/* Show "Play Again" only if execution is completely finished or the route was invalid */}
                {(!isExecuting && (executionLog.length > 0 || coins === 0)) && (
                  <div className="text-center mt-4 border-top pt-4">
                    <h2 className={coins > 0 ? 'text-success' : 'text-danger'}>
                      Game Over. Final Score: {coins}
                    </h2>
                    
                    <div className="d-flex justify-content-center gap-3 mt-4">
                      <Button variant="primary" size="lg" className="px-4" onClick={() => window.location.reload()}>
                        Play Again
                      </Button>
                      
                      <Button variant="info" size="lg" className="px-4 text-white fw-bold shadow-sm" onClick={() => navigate('/ranking')}>
                        View Leaderboard 🏆
                      </Button>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </Container>
  );
}

export default Game;