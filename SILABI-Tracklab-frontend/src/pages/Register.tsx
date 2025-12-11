import React from 'react';
import RegisterForm from '../components/RegisterForm';

const Register: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#000000' }}>
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl shadow-2xl" style={{ 
        backgroundColor: '#1D2B53',
        border: '2px solid #5F574F'
      }}>
        <div className="flex flex-col items-center mb-4">
          <h2 className="text-3xl font-bold" style={{ color: '#29ADFF' }}>
            Silabi TrackLab
          </h2>
          <p className="text-sm mt-1" style={{ color: '#83769C' }}>
            Create your account
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;