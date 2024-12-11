import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import { Navigation } from './components/Navigation';
import { UniversityDashboard } from './components/university/UniversityDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { ViewerDashboard } from './components/viewer/ViewerDashboard';
import './styles/Dashboard.css';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/university" element={<UniversityDashboard />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/viewer" element={<ViewerDashboard />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
      </Router>
    </Web3Provider>
  );
}

function Home() {
  return (
    <div className="home">
      <h1>Welcome to Education Certificate System</h1>
      <p>Choose your role to continue</p>
    </div>
  );
}

export default App; 