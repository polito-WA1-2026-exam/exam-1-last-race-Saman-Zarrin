import { useState } from 'react';
import { Form, Button, Card, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  // 1. State variables to remember what the user types
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // 2. React Router hook to redirect the user after they log in
  const navigate = useNavigate();

  // 3. The function that runs when they click "Submit"
  const handleSubmit = async (event) => {
    event.preventDefault(); // Stops the page from refreshing
    setErrorMsg(''); // Clear any old errors

    try {
      const response = await axios.post('http://localhost:3001/api/sessions', 
        { username, password },
        { withCredentials: true } 
      );

      console.log("Login successful!", response.data);
      // If successful, send them to the game map!
      navigate('/game'); 

    } catch (err) {
      console.error(err);
      setErrorMsg('Incorrect username or password.');
    }
  };

  return (
    // Container and row classes perfectly center the card on the screen
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card style={{ width: '25rem' }} className="shadow-sm">
        <Card.Body>
          <Card.Title className="text-center mb-4">Welcome to Last Race</Card.Title>
          
          {/* If there is an error message, show a red alert box */}
          {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formUsername">
              <Form.Label>Username</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4" controlId="formPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Log In
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;