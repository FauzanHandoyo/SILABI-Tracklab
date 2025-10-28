import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import DashboardPage from './pages/Dashboard'
import AssetsPage from './pages/Assets'
import HistoryPage from './pages/History'
import NotificationsPage from './pages/Notifications'
import Navigation from './components/Navigation'

const App: React.FC = () => {
    const location = useLocation()
    const hideNavPaths = ['/login', '/register']
    const showNavigation = !hideNavPaths.includes(location.pathname)

    return (
        <div className="min-h-screen bg-gray-100">
            {showNavigation && <Navigation />}
            <main className="container mx-auto px-4 py-8">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/assets" element={<AssetsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="*" element={
                        <div className="text-center py-12">
                            <h2 className="text-2xl font-bold text-gray-800">404 - Page Not Found</h2>
                            <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
                        </div>
                    } />
                </Routes>
            </main>
        </div>
    )
}

export default App