import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import SleepAnalysis from './pages/SleepAnalysis';
import History from './pages/History';
import SetGoal from './pages/SetGoal';

import './styles/global.css';
import './styles/navbar.css';
import './styles/prediction.css';
import './styles/responsive.css';
import './styles/chat.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Standalone Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Application Pages with Single Shared Navbar */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/*
              Combined Sleep Analysis page — accessible from all three previous
              entry points so that existing links (navbar, footer, dashboard,
              chatbot) continue to work without any changes.
            */}
            <Route
              path="/predict"
              element={
                <ProtectedRoute>
                  <SleepAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/predict/sleep-quality"
              element={
                <ProtectedRoute>
                  <SleepAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/predict/sleep-disorder"
              element={
                <ProtectedRoute>
                  <SleepAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prediction/:assessmentId"
              element={
                <ProtectedRoute>
                  <SleepAnalysis />
                </ProtectedRoute>
              }
            />

            <Route
              path="/set-goal"
              element={
                <ProtectedRoute>
                  <SetGoal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/*"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
