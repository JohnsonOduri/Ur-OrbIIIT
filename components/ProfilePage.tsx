import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Settings,
  Edit,
  LogOut,
  Moon,
  Sun,
  Mail,
  Phone,
  Instagram,
  BookOpen,
  Code,
  Heart
} from 'lucide-react';
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { getUserById, getUserByEmail } from '@/lib/firestore';




import { useDarkMode } from "@/context/DarkModeContext";
import { auth } from '@/lib/firebase';
import { createOrUpdateUser } from '@/lib/firestore';

export type ProfilePageProps = {
  onLogout?: () => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
};

export function ProfilePage(props: ProfilePageProps) {
  const { onLogout, isDarkMode: isDarkModeProp, toggleDarkMode: toggleDarkModeProp } = props;
  const darkModeHook = useDarkMode();
  const isDarkMode = isDarkModeProp ?? darkModeHook.isDarkMode;
  const toggleDarkMode = toggleDarkModeProp ?? darkModeHook.toggleDarkMode;
  const [lmsEnabled, setLmsEnabled] = useState(true);
  const [showLmsModal, setShowLmsModal] = useState(false);
  const [lmsPasswordInput, setLmsPasswordInput] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [lmsError, setLmsError] = useState<string | null>(null);
  const { logout } = useAuthContext();
  const router = useRouter();
  const { user } = useAuthContext();

  const [userProfile, setUserProfile] = useState<any | null>(null);

 function displayMajor(major: string): string {
  if (!major) return "Unknown Major";

  switch (major.toLowerCase()) {
    case "bcs":
      return "Computer Science Engineering (Core)";
    case "bcd":
      return "Artificial Intelligence and Data Science";
    case "bcy":
      return "Computer Science (Cyber Security)";
    case "ece":
      return "Electronics and Communication Engineering";
    default:
      return "Unknown Major";
  }
}




  useEffect(() => {
    // sync initial LMS enabled state from profile
    if (userProfile) {
      setLmsEnabled(Boolean((userProfile as any)?.lms?.connected));
    }
  }, [userProfile]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        // Prefer lookup by UID, fallback to email
        const byId = await getUserById(user.uid);
        let profile = byId;
        if (!profile && user.email) {
          profile = await getUserByEmail(user.email);
        }
        if (!profile) {
          // redirect to profile-setup if profile missing
          router.push('/profile-setup');
          return;
        }
        if (mounted) setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    })();
    return () => { mounted = false };
  }, [user, router]);

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20 bg-primary">
              {userProfile?.avatar ? (
                // show selected avatar image if available
                // avatars are stored in public/avatars
                // use img inside Avatar for consistent sizing
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/avatars/${userProfile.avatar}`} alt="avatar" className="h-20 w-20 object-cover rounded" />
              ) : (
                <AvatarFallback className="text-xl text-primary-foreground">
                  {userProfile ? (userProfile.name || userProfile.displayName || '').split(' ').map((n:any) => n?.[0] || '').join('') : ''}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold">{userProfile ? (userProfile.name || userProfile.displayName) : 'Profile'}</h1>
              <p className="text-muted-foreground">{userProfile?.username || ''}</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                {userProfile?.bio || ''}
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <span>{userProfile?.year || ''}</span>
                <span>{displayMajor(userProfile?.major) || ''}</span>
                <span>{userProfile?.orbiiid || ''}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/profile-setup')}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4" />
            <CardTitle className="text-lg">Skills</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(userProfile?.skills ?? []).map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <CardTitle className="text-lg">Interests</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(userProfile?.interests ?? []).map((interest: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{userProfile?.email ?? ''}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{userProfile?.phone ?? ''}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Instagram className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{userProfile?.instagram ?? ''}</span>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <Label htmlFor="dark-mode">Dark Mode</Label>
            </div>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onChange={toggleDarkMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <Label htmlFor="lms-integration">LMS Integration</Label>
            </div>
            <Switch
              id="lms-integration"
                checked={lmsEnabled}
                onChange={async (e) => {
                  const next = e.target.checked;
                  // If enabling, open modal to collect password if none
                  if (next) {
                    // prefill password field if one exists
                    setLmsPasswordInput((userProfile as any)?.lms?.password || '');
                    setLmsError(null);
                    setShowLmsModal(true);
                  } else {
                    // disable LMS: persist connected=false
                    try {
                      if (!user) {
                        setLmsError('Not authenticated');
                        return;
                      }
                      await createOrUpdateUser(user.uid, { lms: { ...(userProfile?.lms || {}), connected: false } });
                      setLmsEnabled(false);
                      // update local profile state
                      setUserProfile((prev: any) => prev ? { ...prev, lms: { ...(prev as any).lms, connected: false } } : prev);
                      setLmsError(null);
                    } catch (err: any) {
                      console.error('Failed to disable LMS', err);
                      setLmsError(String(err));
                    }
                  }
                }}
            />
            
          </div>
          {/* Edit / Enable button */}
            <div className="ml-3">
              {lmsEnabled ? (
                <Button size="sm" variant="outline" onClick={() => { setLmsPasswordInput((userProfile as any)?.lms?.password || ''); setShowLmsModal(true); setLmsError(null); }}>
                  Edit Password
                </Button>
              ) : (
                <Button size="sm" onClick={() => { setLmsPasswordInput((userProfile as any)?.lms?.password || ''); setShowLmsModal(true); setLmsError(null); }}>
                  Enable LMS
                </Button>
              )}
            </div>
        </CardContent>
      </Card>

        {/* LMS Password Modal */}
        {showLmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-background rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h4 className="font-semibold mb-2">Connect LMS</h4>
              <p className="text-sm mb-4">Enter your LMS password to connect. Username will be your roll: <span className="font-medium">{(userProfile?.lms?.username) || (userProfile?.email || '').split('@')[0]}</span></p>
              <input type="password" placeholder="LMS Password" value={lmsPasswordInput} onChange={(e) => setLmsPasswordInput(e.target.value)} className="w-full rounded border px-3 py-2 dark:bg-input" />
              {lmsError && <p className="text-xs text-destructive mt-2">{lmsError}</p>}
              <div className="flex items-center gap-3 mt-3">
                {savingPassword && <div className="h-2 bg-slate-200 rounded flex-1" />}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowLmsModal(false)}>Cancel</Button>
                <Button onClick={async () => {
                  if (!user) {
                    setLmsError('Not authenticated');
                    return;
                  }
                  if (!lmsPasswordInput) {
                    setLmsError('Please enter your LMS password');
                    return;
                  }
                  setSavingPassword(true);
                  try {
                    const username = (userProfile as any)?.lms?.username || (userProfile?.email || '').split('@')[0];
                    // validate credentials with LMS API
                    const res = await fetch('/api/lms/fetch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password: lmsPasswordInput }) });
                    if (res.status === 401) {
                      setLmsError('LMS credentials invalid. Please enter correct password.');
                      setSavingPassword(false);
                      return;
                    }
                    if (!res.ok) {
                      const body = await res.json().catch(() => ({}));
                      setLmsError(body?.error || 'Failed to validate LMS credentials');
                      setSavingPassword(false);
                      return;
                    }
                    // credentials valid -> save to Firestore
                    await createOrUpdateUser(user.uid, { lms: { username, password: lmsPasswordInput, connected: true } });
                    // update local state
                    setUserProfile((prev: any) => prev ? { ...prev, lms: { ...(prev as any).lms, username, password: lmsPasswordInput, connected: true } } : prev);
                    setLmsEnabled(true);
                    setLmsError(null);
                    setShowLmsModal(false);
                  } catch (err: any) {
                    console.error('Failed to save LMS credentials', err);
                    setLmsError(String(err));
                  } finally {
                    setSavingPassword(false);
                  }
                }}>{savingPassword ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          </div>
        )}

      

      {/* Logout */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}