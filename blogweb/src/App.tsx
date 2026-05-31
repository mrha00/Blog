import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Header from './components/Header';
import Footer from './components/Footer';
import PageBackdrop from './components/PageBackdrop';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

const Home = React.lazy(() => import('./pages/Home'));
const Detail = React.lazy(() => import('./pages/Detail'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Editor = React.lazy(() => import('./pages/Editor'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Tags = React.lazy(() => import('./pages/Tags'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Settings = React.lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="flex flex-grow items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-200 border-t-blue-700 dark:border-slate-600 dark:border-t-blue-400" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="relative flex min-h-screen flex-col">
            <PageBackdrop />
            <Header />

            <main className="relative z-0 flex flex-grow flex-col">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/posts/:id" element={<Detail />} />
                  <Route path="/users/:id" element={<UserProfile />} />
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
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
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
    </ThemeProvider>
  );
}
