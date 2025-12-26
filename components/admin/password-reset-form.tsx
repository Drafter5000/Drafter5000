'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkPasswordRequirements, getPasswordRequirementsList } from '@/lib/password-validation';

export function PasswordResetForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requirements = checkPasswordRequirements(formData.new_password);
  const requirementsList = getPasswordRequirementsList();

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (formData.new_password !== formData.confirm_password) {
      setError('New password and confirmation do not match');
      return;
    }

    const allRequirementsMet = Object.values(requirements).every(Boolean);
    if (!allRequirementsMet) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess(true);
      setFormData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your admin account password. Make sure to use a strong password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-700">
              <Check className="h-4 w-4" />
              <AlertDescription>Password updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.current_password}
                onChange={e => handleChange('current_password', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.new_password}
                onChange={e => handleChange('new_password', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Password Requirements */}
            {formData.new_password && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                <ul className="text-xs space-y-1">
                  <li
                    className={requirements.minLength ? 'text-green-600' : 'text-muted-foreground'}
                  >
                    {requirements.minLength ? '✓' : '○'} {requirementsList[0]}
                  </li>
                  <li
                    className={
                      requirements.hasUppercase ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    {requirements.hasUppercase ? '✓' : '○'} {requirementsList[1]}
                  </li>
                  <li
                    className={
                      requirements.hasLowercase ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    {requirements.hasLowercase ? '✓' : '○'} {requirementsList[2]}
                  </li>
                  <li
                    className={requirements.hasNumber ? 'text-green-600' : 'text-muted-foreground'}
                  >
                    {requirements.hasNumber ? '✓' : '○'} {requirementsList[3]}
                  </li>
                  <li
                    className={
                      requirements.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'
                    }
                  >
                    {requirements.hasSpecialChar ? '✓' : '○'} {requirementsList[4]}
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={e => handleChange('confirm_password', e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {formData.confirm_password && formData.new_password !== formData.confirm_password && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={
              loading ||
              !formData.current_password ||
              !formData.new_password ||
              !formData.confirm_password
            }
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
