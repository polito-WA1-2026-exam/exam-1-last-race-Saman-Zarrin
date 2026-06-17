import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Login from './components/Login';
import Game from './components/Game';
import Welcome from './components/Welcome';
import Ranking from './components/Ranking';
function App() {
  return (
    <BrowserRouter>
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Welcome />} />          
          <Route path="/login" element={<Login />} />
          <Route path="/game" element={<Game />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="*" element={<h2>404: Page not found</h2>} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;

