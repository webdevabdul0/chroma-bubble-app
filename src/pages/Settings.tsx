
import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { currentTheme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [passwordNew, setPasswordNew] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  const colorOptions = [
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Green', value: 'green' },
    { name: 'Pink', value: 'pink' },
    { name: 'Orange', value: 'orange' }
  ];
  
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulating update
    setTimeout(() => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }, 500);
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordNew !== passwordConfirm) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulating password change
    setTimeout(() => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      
      setPasswordCurrent('');
      setPasswordNew('');
      setPasswordConfirm('');
    }, 500);
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8 text-gradient-primary animate-fade-in">Settings</h1>
        
        <div className="space-y-8">
          {/* Account Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="bg-card rounded-lg p-6 border border-border glass-morphism">
              <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
                <div className="bg-secondary rounded-full w-24 h-24 flex items-center justify-center mb-4 md:mb-0 md:mr-6 relative overflow-hidden">
                  <span className="text-3xl text-primary">
                    {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary/20"></div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{name}</h3>
                  <p className="text-muted-foreground">{email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      Owner
                    </span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-secondary border-secondary"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-secondary"
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed.
                  </p>
                </div>
                
                <Button type="submit">
                  Update Profile
                </Button>
              </form>
            </div>
          </section>
          
          {/* Theme Customization */}
          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-semibold mb-4">Theme Customization</h2>
            <div className="bg-card rounded-lg p-6 border border-border glass-morphism">
              <p className="mb-4 text-muted-foreground">
                Choose a primary color for the application interface.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as any)}
                    className={`relative flex items-center justify-center rounded-lg border p-4 h-20 transition-all ${
                      currentTheme === option.value 
                        ? 'border-primary ring-2 ring-primary/30' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full theme-${option.value} bg-primary`}></div>
                    <span className="absolute bottom-2 text-xs font-medium">
                      {option.name}
                    </span>
                    {currentTheme === option.value && (
                      <span className="absolute top-2 right-2 text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
          
          {/* Security Section */}
          <section className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-semibold mb-4">Security</h2>
            <div className="bg-card rounded-lg p-6 border border-border glass-morphism">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password-current" className="text-sm font-medium">
                    Current Password
                  </label>
                  <Input
                    id="password-current"
                    type="password"
                    value={passwordCurrent}
                    onChange={(e) => setPasswordCurrent(e.target.value)}
                    className="bg-secondary border-secondary"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password-new" className="text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="password-new"
                    type="password"
                    value={passwordNew}
                    onChange={(e) => setPasswordNew(e.target.value)}
                    className="bg-secondary border-secondary"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password-confirm" className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <Input
                    id="password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="bg-secondary border-secondary"
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={!passwordCurrent || !passwordNew || !passwordConfirm}
                >
                  Change Password
                </Button>
              </form>
            </div>
          </section>
          
          {/* Danger Zone */}
          <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
            <div className="bg-card rounded-lg p-6 border border-destructive/20 glass-morphism">
              <h3 className="font-medium mb-2">Delete account</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data.
                This action cannot be undone.
              </p>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
