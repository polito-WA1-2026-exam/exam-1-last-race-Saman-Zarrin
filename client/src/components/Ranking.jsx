import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Ranking() {
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/rankings', { withCredentials: true });
        setRankings(res.data);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to load the leaderboard. Make sure you are logged in!');
        setIsLoading(false);
      }
    };
    fetchRankings();
  }, []);

  return (
    <Container className="mt-5 mb-5">
      <Card className="shadow-lg border-0 rounded-lg">
        <Card.Header className="bg-warning text-dark text-center py-4">
          <h2 className="fw-bold mb-0">🏆 Last Race Leaderboard 🏆</h2>
        </Card.Header>
        
        <Card.Body className="p-4 bg-light">
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
          
          {isLoading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="warning" />
            </div>
          ) : (
            <>
              <Table striped bordered hover responsive className="bg-white shadow-sm mb-4">
                <thead className="table-dark">
                  <tr>
                    <th>Rank</th>
                    <th>Subway Surfer (User)</th>
                    <th>Highest Coin Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">No games played yet!</td>
                    </tr>
                  ) : (
                    rankings.map((rank, index) => (
                      <tr key={index}>
                        <td className="fw-bold">{index + 1}</td>
                        <td>{rank.username}</td>
                        <td className="text-success fw-bold">{rank.best_score} Coins</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              
              <div className="text-center">
                <Button variant="primary" size="lg" onClick={() => navigate('/game')}>
                  Back to the Game
                </Button>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Ranking;