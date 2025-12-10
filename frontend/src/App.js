import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ClubList from './pages/ClubList';
import AdminPanel from './pages/AdminPanel';
import CreateClubApplication from './pages/CreateClubApplication';
import MyApplications from './pages/MyApplications';
import Notifications from './pages/Notifications';
import ClubAdminDashboard from './pages/ClubAdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/clubs" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/clubs"
                element={
                  <PrivateRoute>
                    <ClubList />
                  </PrivateRoute>
                }
              />

              <Route
                path="/events"
                element={
                  <PrivateRoute>
                    <div className="placeholder-page">
                      <h2>Etkinlikler</h2>
                      <p>Etkinlikler sayfası yakında eklenecek...</p>
                    </div>
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <div className="placeholder-page">
                      <h2>Profil</h2>
                      <p>Profil sayfası yakında eklenecek...</p>
                    </div>
                  </PrivateRoute>
                }
              />

              <Route
                path="/club-manager"
                element={
                  <PrivateRoute roles={['club_admin']}>
                    <ClubAdminDashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <Notifications />
                  </PrivateRoute>
                }
              />

              <Route
                path="/create-club-application"
                element={
                  <PrivateRoute>
                    <CreateClubApplication />
                  </PrivateRoute>
                }
              />

              <Route
                path="/my-applications"
                element={
                  <PrivateRoute>
                    <MyApplications />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <PrivateRoute roles={['sks_admin']}>
                    <AdminPanel />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/clubs" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
