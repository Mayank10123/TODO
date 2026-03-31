import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword, error, clearError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  React.useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err) {
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black px-4">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800 text-center">
            <div className="mb-4 flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-400 mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
            <Link to="/login" className="w-full">
              <Button className="w-full bg-white text-black hover:bg-gray-200">Back to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tabbie</h1>
          <p className="text-gray-500 text-sm">Your Personal Task Companion</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-2">Reset Password</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-zinc-800 border border-zinc-700 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-600 absolute left-3 top-3" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-black border-zinc-700 text-white placeholder:text-gray-600 focus:border-gray-600"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Reset Button */}
            <Button
              type="submit"
              className="w-full mt-6 bg-white text-black hover:bg-gray-200"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
          </div>

          {/* Back to Login */}
          <Link to="/login">
            <Button variant="outline" className="w-full bg-black border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:text-white">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
