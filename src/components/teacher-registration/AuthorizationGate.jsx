import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Key, AlertCircle } from 'lucide-react';

const AuthorizationGate = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validateInviteCode = async () => {
    setIsValidating(true);
    setError('');

    try {
      // TODO: Implement actual API call
      // const response = await fetch('/api/validate-invite', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ inviteCode })
      // });

      // Mock validation logic
      if (inviteCode === 'TEACHER2024') {
        // Valid code - proceed to registration
        window.location.href = '/teacher-registration?authorized=true';
      } else {
        setError('Invalid invite code. Please check your code and try again.');
      }
    } catch (error) {
      setError('An error occurred while validating the invite code.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      validateInviteCode();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Teacher Registration</CardTitle>
          <p className="text-gray-600 mt-2">
            Teacher registration is by invitation only. Please enter your invite code to continue.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter your invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="pl-10"
                  disabled={isValidating}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={!inviteCode.trim() || isValidating}
            >
              {isValidating ? 'Validating...' : 'Continue to Registration'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an invite code?{' '}
              <a href="/contact" className="text-blue-600 hover:text-blue-500">
                Contact us
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthorizationGate;