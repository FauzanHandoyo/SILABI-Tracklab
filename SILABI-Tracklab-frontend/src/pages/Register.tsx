import React from 'react';
import RegisterForm from '../components/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl border border-gray-100">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold text-blue-700">Create an account</h2>
          <p className="text-gray-500 text-sm mt-1">Register to manage laboratory assets</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;