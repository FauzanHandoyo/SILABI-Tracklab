import React from 'react';
import Dashboard from '../components/Dashboard';

const Login = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-gray-100">
                <div className="flex flex-col items-center mb-4">
                    <h2 className="text-3xl font-bold text-blue-700">Silabi TrackLab</h2>
                </div>
                <Dashboard />
            </div>
        </div>
    );
};

export default Login;