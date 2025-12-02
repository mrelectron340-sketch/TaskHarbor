// no need to import React in modern JSX runtime
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import Disputes from './pages/Disputes';
import Profile from './pages/Profile';
import WalletTransactions from './pages/WalletTransactions';
import Settings from './pages/Settings';
import About from './pages/About';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/create" element={<CreateJob />} />
            <Route path="/jobs/:jobId" element={<JobDetail />} />
            <Route path="/jobs/:jobId/submit" element={<JobDetail />} />
            <Route path="/dashboard/client" element={<ClientDashboard />} />
            <Route path="/dashboard/freelancer" element={<FreelancerDashboard />} />
            <Route path="/disputes" element={<Disputes />} />
            <Route path="/disputes/:disputeId" element={<Disputes />} />
            <Route path="/profile/:address" element={<Profile />} />
            <Route path="/wallet/transactions" element={<WalletTransactions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  );
}

export default App;
