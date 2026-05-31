import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Page Imports
import Home from './pages/Home';
import Detail from './pages/Detail';
import Login from './pages/Login';
import Register from './pages/Register';
import Editor from './pages/Editor';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#f7f9fb] flex flex-col selection:bg-blue-150 selection:text-blue-900">
          {/* Main Top Navigation Header */}
          <Header />
          
          {/* Core Content Box with layout boundaries */}
          <main className="flex-grow flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/posts/:id" element={<Detail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/editor"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editor/:id"
                element={
                  <ProtectedRoute>
                    <Editor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/categories"
                element={
                  <AdminRoute>
                    <Categories />
                  </AdminRoute>
                }
              />
              <Route
                path="/tags"
                element={
                  <AdminRoute>
                    <Tags />
                  </AdminRoute>
                }
              />
              
              {/* Fallback Catch */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>

          {/* Bottom Footer block */}
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
