import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

const Home = React.lazy(() => import('./pages/Home'));
const Detail = React.lazy(() => import('./pages/Detail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Editor = React.lazy(() => import('./pages/Editor'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Tags = React.lazy(() => import('./pages/Tags'));
const Profile = React.lazy(() => import('./pages/Profile'));

function PageLoader() {
  return (
    <div className="flex-grow flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-200 border-t-blue-700" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#f7f9fb] flex flex-col selection:bg-blue-150 selection:text-blue-900">
            <Header />

            <main className="flex-grow flex flex-col">
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="*" element={<Home />} />
                </Routes>
              </Suspense>
            </main>

            <Footer />
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
