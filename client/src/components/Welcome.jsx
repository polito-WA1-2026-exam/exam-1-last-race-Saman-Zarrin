import React from 'react';
import { Container, Card, Button, Row, Col, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // 1. Imported the navigation hook

function Welcome() { 
  const navigate = useNavigate(); // 3. Initialized the hook

  return (
    <Container className="mt-5 mb-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg border-0 rounded-lg">
            
            {/* Header */}
            <Card.Header className="bg-dark text-white text-center py-5">
              <h1 className="fw-bold display-4 mb-2">Last Race 🚇</h1>
              <p className="lead mb-0 text-info">An Underground Routing Challenge</p>
            </Card.Header>

            {/* Content Body */}
            <Card.Body className="p-5 bg-light">
              <h3 className="mb-4 text-center border-bottom pb-3">How to Play</h3>
              
              <ListGroup variant="flush" className="mb-5 shadow-sm rounded">
                <ListGroup.Item className="p-4">
                  <h5><Badge bg="info" className="me-2">Phase 1</Badge> Setup</h5>
                  <p className="mb-0 text-muted">You will be assigned a random start and destination station. You have exactly <strong>10 seconds</strong> to memorize the full subway map before the lights go out.</p>
                </ListGroup.Item>
                
                <ListGroup.Item className="p-4">
                  <h5><Badge bg="warning" text="dark" className="me-2">Phase 2</Badge> Planning</h5>
                  <p className="mb-0 text-muted">The map goes blind! You have <strong>90 seconds</strong> to mentally reconstruct the network and build a valid, connected route segment by segment.</p>
                </ListGroup.Item>
                
                <ListGroup.Item className="p-4">
                  <h5><Badge bg="danger" className="me-2">Phase 3</Badge> Execution</h5>
                  <p className="mb-0 text-muted">Board the train with <strong>20 coins</strong>. Travel your route step-by-step. Random events will help or hurt your coin total. If your route is broken, you lose everything!</p>
                </ListGroup.Item>
              </ListGroup>

              {/* Call to Action */}
              <div className="d-grid gap-2 col-md-8 mx-auto mt-4">
                <h5 className="text-center text-muted mb-3">Ready to test your memory?</h5>
                <Button variant="primary" size="lg" className="py-3 shadow rounded-pill fw-bold" onClick={() => navigate('/login')}>
                  Login to Play Now
                </Button>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Welcome;