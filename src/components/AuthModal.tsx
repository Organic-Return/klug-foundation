'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface AuthModalProps {
  onClose?: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error } = await signUp(email, password, { name });
        if (error) {
          setError(error.message);
        } else {
          setSuccess(true);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-sothebys-blue)] mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Please check your inbox and click the link to verify your account.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setMode('login');
            }}
            className="text-[var(--color-gold)] hover:underline font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[var(--color-sothebys-blue)]">
          {mode === 'register' ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-600 mt-2">
          {mode === 'register'
            ? 'Register to view exclusive off-market listings'
            : 'Sign in to access off-market listings'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent"
              placeholder="John Doe"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--color-gold)] text-white font-semibold py-3 px-4 rounded-md hover:bg-transparent hover:text-[var(--color-gold)] border-2 border-[var(--color-gold)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[var(--color-gold)] hover:underline font-medium"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-[var(--color-gold)] hover:underline font-medium"
              >
                Register
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
