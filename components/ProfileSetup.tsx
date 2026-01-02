import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Moon, Sun } from 'lucide-react';
import { createOrUpdateUser, getUserById, getUserByEmail, getUserByUsername } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const AVATARS = [
  'anxiety-inside-out.svg',
  'disgust-inside-out.svg',
  'embarrassment-inside-out.svg',
  'ennui-inside-out.svg',
  'envy-inside-out.svg',
  'fear-inside-out.svg',
  'inside-out-anger.svg',
  'joy-inside-out.svg',
  'sadness-inside-out.svg',
];
const DEFAULT_SKILLS = ['JavaScript','TypeScript','React','Node.js','Python','Django','Machine Learning','Data Structures','Algorithms','CSS','HTML','SQL','NoSQL'];
const DEFAULT_INTERESTS = ['Web Development','AI/ML','Mobile','Gaming','Design','Photography','Basketball','Music','Robotics','Open Source'];

interface ProfileSetupProps {
  onRegister: () => void;
  onSwitchToLogin: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export function ProfileSetup({ onRegister, onSwitchToLogin, isDarkMode, toggleDarkMode }: ProfileSetupProps) {
  interface RegisterForm {
    name: string;
    email: string;
    orbiiid?: string;
    gender: string;
    skills: string[];
    interests: string[];
  lmsUsername: string;
  lmsPassword: string;
    instagram: string;
    phone: string;
    age?: number | null;
  major?: string;
  year?: number | null;
  }

  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    orbiiid: '',
    gender: '',
    skills: [],
    interests: [],
    lmsUsername: '',
    lmsPassword: '',
    instagram: '',
    phone: '',
    age: null,
  });
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [skillQuery, setSkillQuery] = useState('');
  const [interestQuery, setInterestQuery] = useState('');
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [suggestedInterests, setSuggestedInterests] = useState<string[]>([]);
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [orbiiidChecking, setOrbiiidChecking] = useState(false);
  const [orbiiidInUse, setOrbiiidInUse] = useState(false);

  function extractMajor(email: string): string {
  if (!email) return '';

  const localPart = email.split('@')[0]; // "durijohnson24bcs66"

  const matches = localPart.match(/[a-z]{2,4}(?=\d{2,})/gi); 
  // allow 2–4 letters (covers bcs, ece, bcd, etc.)

  return matches ? matches[matches.length - 1].toLowerCase() : '';
}
  function extractYear(email: string): number | null {
  if (!email) return null;
  const localPart = email.split('@')[0]; // "odurijohnson24bcs66"
  const match = localPart.match(/(\d{2})(?=[a-z]{3}\d{2,})/i);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  // Assuming admission years are >= 2000, so prefix with 20
  return 2000 + year;
}
  function extractRoll(email: string): string | null {
  if (!email) return null;
  const localPart = email.split('@')[0]; // "odurijohnson24bcs66"
  const match = localPart.match(/(\d{2})([a-z]{3})(\d{2,})/i);
  if (!match) return null;

  const year = 2000 + parseInt(match[1], 10);
  const major = match[2].toUpperCase();
  const roll = match[3].padStart(4, "0");

  return `${year}${major}${roll}`;
}

  const generateUsername = () => {
    const email = formData.email;
    
  const localPart = email.split('@')[0]; // "durijohnson24bcs66"

  // Remove the trailing digits + branch code (like 24bcs66)
  const nameOnly = localPart.replace(/\d+[a-z]+\d+$/i, '');

  return nameOnly.toLowerCase();
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.endsWith('@iiitkottayam.ac.in');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const newErrors: Record<string, string> = {};

      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.email) {
        newErrors.email = 'College email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid college email (@iiitkottayam.ac.in)';
      }
      if (!formData.gender) newErrors.gender = 'Gender is required';
      if (formData.age === null || formData.age === undefined ) {
        newErrors.age = 'Age is required';
      } else if (typeof formData.age === 'number') {
        if (formData.age < 15 || formData.age > 30) {
          newErrors.age = 'Age must be between 15 and 30';
        }
      } else {
        const parsed = Number(formData.age as any);
        if (Number.isNaN(parsed) || parsed < 15 || parsed > 30) {
          newErrors.age = 'Age must be a number between 15 and 30';
        }
      }
      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        if (orbiiidInUse) {
          setErrors(prev => ({ ...prev, orbiiid: 'That OrbIIID is already in use' }));
          return;
        }
        setStep(2);
        if (!selectedAvatar) {
          setSelectedAvatar(AVATARS[Math.floor(Math.random()*AVATARS.length)]);
        }
      }
    } else {
      // Step 2 - validate skills/interests and LMS format, then save
      const newErrors: Record<string, string> = {};
      if (formData.skills.length < 3) newErrors.skills = 'Please select at least 3 skills';
      if (formData.interests.length < 3) newErrors.interests = 'Please select at least 3 interests';
      // LMS integration is considered enabled only if password is provided
      if (formData.lmsPassword) {
        const lmsRegex = /^\d{4}[A-Z]{3}\d{4}$/i;
        const computed = formData.lmsUsername || extractRoll(formData.email) || '';
        if (!computed || !lmsRegex.test(computed)) newErrors.lmsUsername = 'LMS username should match format e.g. 2024BCS0066';
      }

      setErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const current = auth.currentUser;
        if (!current) {
          setErrors({ general: 'Authentication required. Please sign in again.' });
          return;
        }

        // Final uniqueness check for OrbIIID before saving (server-side check)
        const normalizedOrb = (formData.orbiiid || '').toString().trim().toLowerCase();
        if (normalizedOrb) {
          try {
            const existing = await getUserByUsername(normalizedOrb);
            if (existing && existing.id !== current.uid) {
              setErrors(prev => ({ ...prev, orbiiid: 'That OrbIIID is already in use' }));
              return;
            }
          } catch (err) {
            // non-fatal — allow save but log
            console.warn('OrbIIID uniqueness check failed', err);
          }
        }

        const computedRoll = extractRoll(formData.email) ?? null;
        // derive roll number and batch from the roll string (e.g. 2024BCS0066)
        // batch rule: remainder = rollNumber % 4; batch = `B${remainder+1}` where remainder 0 -> B1, 1 -> B2, etc.
        let derivedRollString: string | null = null;
        let derivedBatch: string | null = null;
        const rollSource = (formData.lmsUsername || computedRoll || '') as string;
        const rollMatch = rollSource.match(/(\d{4})([A-Z]{3})(\d+)/i);
        if (rollMatch) {
          const rollNumStr = rollMatch[3];
          const rollNum = parseInt(rollNumStr, 10);
          const rem = rollNum % 4;
          const batchNum = rem + 1; // rem 0 => B1
          derivedBatch = `B${batchNum}`;
          // keep roll as zero-padded 4+ digit string (as in LMS username)
          derivedRollString = rollNumStr.padStart(4, '0');
        }

        const payload: any = {
          uid: current.uid,
          name: formData.name,
          email: formData.email,
          orbiiid: (normalizedOrb && normalizedOrb.length > 0) ? normalizedOrb : generateUsername().toLowerCase(),
          age: formData.age || null,
          gender: formData.gender,
          avatar: selectedAvatar,
          skills: formData.skills,
          major: extractMajor(formData.email), // ✅ major will now be "bcs"
          interests: formData.interests,
          // Only include LMS info if the user provided a password (explicitly enabled)
          lms: formData.lmsPassword ? { username: (formData.lmsUsername || computedRoll), password: formData.lmsPassword, connected: true } : { connected: false },
          instagram: formData.instagram || null,
          phone: formData.phone || null,
          year: extractYear(formData.email),
          // include derived roll and batch if available
          ...(derivedRollString ? { roll: derivedRollString } : {}),
          ...(derivedBatch ? { batch: derivedBatch } : {}),
          createdAt: new Date().toISOString(),

        };

        createOrUpdateUser(current.uid, payload).then(()=>{
          onRegister();
        }).catch(err=>{
          console.error(err);
          setErrors({ general: 'Failed to save profile. Try again.' });
        });
      }
    }
  };

  const handleInputChange = (field: keyof RegisterForm, value: string) => {
    // normalize orbiiid input to lowercase/trim when the orbiiid field is changed
    if (field === 'orbiiid') {
      const normalized = value.toLowerCase().trim();
      setFormData(prev => ({ ...prev, [field]: normalized } as RegisterForm));
    } else {
      setFormData(prev => ({ ...prev, [field]: value } as RegisterForm));
    }
    // If the user edits the OrbIIID, reset the 'in use' state so the UI updates immediately
    if (field === 'orbiiid') {
      setOrbiiidInUse(false);
    }
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const addSkill = (s: string) => {
    if (!s) return;
    setFormData(prev=>{
      if (prev.skills.includes(s)) return prev;
      return { ...prev, skills: [...prev.skills, s] };
    });
    setSkillQuery('');
  };
  const removeSkill = (s: string) => {
    setFormData(prev=>({ ...prev, skills: prev.skills.filter((x:string)=>x!==s) }));
  };
  const addInterest = (s: string) => {
    if (!s) return;
    setFormData(prev=>{
      if (prev.interests.includes(s)) return prev;
      return { ...prev, interests: [...prev.interests, s] };
    });
    setInterestQuery('');
  };
  const removeInterest = (s: string) => {
    setFormData(prev=>({ ...prev, interests: prev.interests.filter((x:string)=>x!==s) }));
  };

  useEffect(()=>{
    const current = auth.currentUser;
    (async () => {
      try {
        if (!current) return;
        // Prefill from auth if empty
        if (current?.email && !formData.email) {
          setFormData(prev=>({ ...prev, email: current.email as string }));
        }
        if (current?.displayName && !formData.name) {
          setFormData(prev=>({ ...prev, name: current.displayName as string }));
        }

        // If a Firestore profile exists, load it so this component becomes an edit form
        const byId = await getUserById(current.uid);
        let profile: any = byId;
        if (!profile && current.email) {
          profile = await getUserByEmail(current.email);
        }
        if (profile) {
          // Map Firestore fields into form
          setFormData(prev => ({
            ...prev,
            name: profile.name || prev.name || '',
            email: profile.email || prev.email || '',
            orbiiid: profile.orbiiid || prev.orbiiid || '',
            gender: profile.gender || prev.gender || '',
            skills: Array.isArray(profile.skills) ? profile.skills : prev.skills,
            interests: Array.isArray(profile.interests) ? profile.interests : prev.interests,
            lmsUsername: profile.lms?.username || prev.lmsUsername || '',
            lmsPassword: profile.lms?.password || prev.lmsPassword || '',
            instagram: profile.instagram || prev.instagram || '',
            phone: profile.phone || prev.phone || '',
            age: profile.age ?? prev.age,
            major: profile.major ?? prev.major,
            year: profile.year ?? prev.year,
            // roll removed (LMS username and roll are the same)
          } as RegisterForm));
          setSelectedAvatar(profile.avatar || null);
        }
      } catch (err) {
        // ignore prefilling errors
        console.error('prefill error', err);
      }
    })();
    // set orbiiid from email local-part if not set: strip from first digit onward
    if (current?.email && !formData.orbiiid) {
      (async () => {
        try {
          const local = (current.email as string).split('@')[0]; // e.g. "odurijohnson24bcs66"
          // remove everything from the first digit onward
          const nameOnly = local.replace(/\d.*$/, ''); // -> "odurijohnson"
          // ensure uniqueness: if exists, append a numeric suffix
          let candidate = nameOnly;
          let suffix = 0;
          // lazy-import to avoid cycle at module-eval time
          const { getUserByUsername } = await import('@/lib/firestore');
          while (true) {
            // check whether candidate exists
            // eslint-disable-next-line no-await-in-loop
            const existing = await getUserByUsername(candidate.toLowerCase());
            if (!existing) break;
            suffix += 1;
            candidate = `${nameOnly}${suffix}`;
            // be defensive: stop after 100 attempts
            if (suffix > 100) break;
          }
          setFormData(prev => ({ ...prev, orbiiid: candidate.toLowerCase() }));
        } catch (err) {
          // on any error, fallback to a simple nameOnly derivation
          const local = (current.email as string).split('@')[0];
          const nameOnly = local.replace(/\d.*$/, '');
          setFormData(prev => ({ ...prev, orbiiid: nameOnly.toLowerCase() }));
        }
      })();
    }


    // load skills/interests suggestion lists
    fetch('/data/skills.txt').then(r=>r.text()).then(t=>{
      setSuggestedSkills(t.split('\n').map(s=>s.trim()).filter(Boolean));
    }).catch(()=>{});
    fetch('/data/interests.txt').then(r=>r.text()).then(t=>{
      setSuggestedInterests(t.split('\n').map(s=>s.trim()).filter(Boolean));
    }).catch(()=>{});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // Debounced check for OrbIIID uniqueness
  useEffect(() => {
    let mounted = true;
    let timer: number | null = null;
    const runCheck = async () => {
      const val = (formData.orbiiid || '').trim();
      if (!val) {
        setOrbiiidInUse(false);
        setOrbiiidChecking(false);
        // clear orbiiid error if user cleared input
        setErrors(prev => ({ ...prev, orbiiid: '' }));
        return;
      }
      setOrbiiidChecking(true);
      try {
        const existing = await getUserByUsername(val);
        const current = auth.currentUser;
        if (!existing) {
          if (mounted) {
            setOrbiiidInUse(false);
            setErrors(prev => ({ ...prev, orbiiid: '' }));
          }
        } else {
          const existingUid = existing.id as string | undefined;
          if (current && existingUid === current.uid) {
            if (mounted) {
              setOrbiiidInUse(false);
              setErrors(prev => ({ ...prev, orbiiid: '' }));
            }
          } else {
            if (mounted) {
              setOrbiiidInUse(true);
              setErrors(prev => ({ ...prev, orbiiid: 'That OrbIIID is already in use' }));
            }
          }
        }
      } catch (err) {
        if (mounted) {
          setOrbiiidInUse(false);
          setErrors(prev => ({ ...prev, orbiiid: '' }));
        }
      } finally {
        if (mounted) setOrbiiidChecking(false);
      }
    };

    // debounce 500ms
    timer = window.setTimeout(runCheck, 500);
    return () => { mounted = false; if (timer) clearTimeout(timer); };
  }, [formData.orbiiid]);

    const [showLmsInfo, setShowLmsInfo] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Join ORBIIIT</h1>
          <p className="text-muted-foreground">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Step {step} of 2: {step === 1 ? 'Basic Information' : 'Profile Setup'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <Alert variant="destructive">
                        <AlertDescription>{errors.name}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">College Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.name@college.edu"
                      value={formData.email}
                      readOnly
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && (
                      <Alert variant="destructive">
                        <AlertDescription>{errors.email}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orbiiid">Preferred OrbIIID</Label>
                    <Input
                      id="orbiiid"
                      placeholder="custom OrbIIID"
                      value={formData.orbiiid}
                      onChange={(e) => handleInputChange('orbiiid', e.target.value)}
                      aria-invalid={orbiiidInUse}
                      autoComplete="off"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {formData.orbiiid
                        ? `Your OrbIIID will be: ${formData.orbiiid}`
                        : `Your OrbIIID will be: ${generateUsername()}`}
                    </div>
                    {orbiiidChecking && <p className="text-sm text-muted-foreground">Checking availability...</p>}

                    {errors.orbiiid && <Alert variant="destructive"><AlertDescription>{errors.orbiiid}</AlertDescription></Alert>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min={15}
                      max={30}
                      placeholder="Your age"
                      value={formData.age ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const n = val === '' ? null : Number(val);
                        setFormData(prev => ({ ...prev, age: n } as RegisterForm));
                        if (errors.age) setErrors(prev => ({ ...prev, age: '' }));
                      }}
                      className={errors.age ? 'border-destructive' : ''}
                    />
                    {errors.age && (
                      <Alert variant="destructive">
                        <AlertDescription>{errors.age}</AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className={errors.gender ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <Alert variant="destructive">
                        <AlertDescription>{errors.gender}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (select or add)</Label>
                    <div className="flex gap-2 flex-wrap">
                      {(formData.skills as string[]).map(s => (
                        <button key={s} type="button" className="px-2 py-1 bg-primary/10 rounded" onClick={()=>removeSkill(s)}>
                          {s} ×
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input value={skillQuery} onChange={e=>setSkillQuery(e.target.value)} placeholder="Search or add skill" />
                      <Button onClick={()=>addSkill(skillQuery)}>Add</Button>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {(suggestedSkills.length ? suggestedSkills : DEFAULT_SKILLS).filter(s=>s.toLowerCase().includes(skillQuery.toLowerCase())).slice(0,8).map(s=> (
                        <button key={s} type="button" className="px-2 py-1 border rounded" onClick={()=>addSkill(s)}>{s}</button>
                      ))}
                    </div>
                    {errors.skills && <Alert variant="destructive"><AlertDescription>{errors.skills}</AlertDescription></Alert>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests (select or add)</Label>
                    <div className="flex gap-2 flex-wrap">
                      {(formData.interests as string[]).map(s => (
                        <button key={s} type="button" className="px-2 py-1 bg-primary/10 rounded" onClick={()=>removeInterest(s)}>
                          {s} ×
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input value={interestQuery} onChange={e=>setInterestQuery(e.target.value)} placeholder="Search or add interest" />
                      <Button onClick={()=>addInterest(interestQuery)}>Add</Button>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {(suggestedInterests.length ? suggestedInterests : DEFAULT_INTERESTS).filter(s=>s.toLowerCase().includes(interestQuery.toLowerCase())).slice(0,8).map(s=> (
                        <button key={s} type="button" className="px-2 py-1 border rounded" onClick={()=>addInterest(s)}>{s}</button>
                      ))}
                    </div>
                    {errors.interests && <Alert variant="destructive"><AlertDescription>{errors.interests}</AlertDescription></Alert>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">LMS Integration (Optional)</h3>
                      <button
                        type="button"
                        className="text-sm text-muted-foreground"
                        onClick={() => setShowLmsInfo(true)}
                      >
                        ? Info
                      </button>
                      {showLmsInfo && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                          <div className="bg-white dark:bg-background rounded-lg shadow-lg p-6 max-w-sm w-full">
                            <h4 className="font-semibold mb-2">LMS Integration Info</h4>
                            <p className="text-sm mb-4">
                              Enter your LMS username and password to connect your IIIT Kottayam LMS account. This is optional and helps us personalize your experience.
                            </p>
                            <div className="flex justify-end">
                              <Button size="sm" onClick={() => setShowLmsInfo(false)}>
                                Close
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lmsUsername">LMS Username (read-only)</Label>
                      <Input
                        id="lmsUsername"
                        placeholder="2024BCS0066"
                        value={formData.lmsUsername || extractRoll(formData.email) || ''}
                        readOnly
                      />
                      {errors.lmsUsername && <Alert variant="destructive"><AlertDescription>{errors.lmsUsername}</AlertDescription></Alert>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lmsPassword">LMS Password</Label>
                      <Input
                        id="lmsPassword"
                        type="password"
                        placeholder="Your LMS password"
                        value={formData.lmsPassword}
                        onChange={(e) => handleInputChange('lmsPassword', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium">Social Links (Optional)</h3>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        placeholder="@username"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Choose Profile Orbiiie (Avatar)</Label>
                    <div className="flex gap-2">
                      {AVATARS.map(a=> (
                        <button
                          key={a}
                          type="button"
                          onClick={()=>setSelectedAvatar(a)}
                          className={`p-1 border rounded transform transition-all duration-150 ${selectedAvatar===a? 'scale-105 ring-2 ring-primary':'hover:scale-105'} `}
                          aria-pressed={selectedAvatar===a}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/avatars/${a}`} alt={a} className="h-12 w-12 object-cover rounded" />
                        </button>
                      ))}
                    </div>
                    {formData.name && (
                      <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Your OrbIIID: <span className="font-medium">{formData.orbiiid || generateUsername()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" disabled={orbiiidChecking || orbiiidInUse}>
                {step === 1 ? 'Continue' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                Back
              </Button>
            )}
            
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default ProfileSetup;
