import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Clock, 
  ChefHat, 
  Star as StarIcon
} from 'lucide-react';
import { addOrUpdateMessRating, getAggregatedRatingsForDay } from "../lib/firestore";
import { auth } from "../lib/firebase";
import { Button } from "./ui/button";
import { Plus, ScanLine } from "lucide-react";
import { useRouter } from 'next/navigation';


interface MealPlan {
  meal: string;
  time: string;
  items: string[];
  price?: number;
}

interface DayMenu {
  day: string;
  date?: string;
  meals: MealPlan[];
  special?: string;
}
const userEmail = auth?.currentUser?.email || null;
const isAdmin = userEmail === "odurijohnson24bcs66@iiitkottayam.ac.in";

export function MessPage() {
  const [selectedDay, setSelectedDay] = useState('today');
  const [schedule, setSchedule] = useState<DayMenu[] | null>(null);
  const [aggregates, setAggregates] = useState<Record<string, { avg: number; count: number }>>({});
  const [localRatings, setLocalRatings] = useState<Record<string, number>>({}); // key = `${DAY}::${MEAL}`
  const [nowMeal, setNowMeal] = useState<string>('CLOSED');
  const router = useRouter();

  useEffect(() => {
    // load schedule JSON from public folder
    fetch('/data/mess_schedule.json')
      .then(res => res.json())
      .then((data: any[]) => {
        const parsed: DayMenu[] = data.map(d => {
          const day = d.DAY || 'UNKNOWN';
          const meals: MealPlan[] = [];
          Object.keys(d).forEach(k => {
            if (k === 'DAY') return;
            const m = k; // like "BREAKFAST (7:00 AM - 9:45 AM)"
            const match = m.match(/^([^\(]+)\s*(?:\((.+)\))?$/);
            const mealName = match ? match[1].trim() : m;
            const time = match && match[2] ? match[2].trim() : '';
            const items = Array.isArray(d[k]) ? d[k] : [];
            meals.push({ meal: mealName, time, items });
          });
          // keep order Breakfast/Lunch/Snacks/Dinner by common names
          const order = ['BREAKFAST','LUNCH','SNACKS','DINNER'];
          meals.sort((a,b)=>{
            const ai = order.findIndex(x => a.meal.toUpperCase().includes(x));
            const bi = order.findIndex(x => b.meal.toUpperCase().includes(x));
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          });
          return { day, meals };
        });
        setSchedule(parsed);
      })
      .catch(()=>setSchedule([]));
  }, []);

  useEffect(() => {
    // preload today's aggregates if schedule loaded
    if (!schedule) return;
    const todayName = new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
    (async ()=>{
      const ag = await getAggregatedRatingsForDay(todayName);
      setAggregates(ag);
    })();
    // load local ratings for today into state
    const lsPrefix = `mess_local_${todayName}_`;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(lsPrefix));
    const lr: Record<string, number> = {};
    keys.forEach(k => {
      try {
        const val = localStorage.getItem(k);
        if (!val) return;
        const keySuffix = k.replace(lsPrefix,'');
        lr[`${todayName}::${keySuffix}`] = Number(val);
      } catch(e){}
    });
    setLocalRatings(lr);
  }, [schedule]);

  // --- new helpers to check current time against schedule ranges ---
  const parseTimePart = (part: string) => {
    // "7:00 AM" -> { hours, minutes }
    const m = part.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!m) return null;
    let hh = Number(m[1]);
    const mm = Number(m[2] || 0);
    const ampm = (m[3] || '').toUpperCase();
    if (ampm === 'PM' && hh !== 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    return { hh, mm };
  };

  const isNowInRange = (rangeStr: string) => {
    if (!rangeStr) return false;
    const parts = rangeStr.split('-');
    if (parts.length < 2) return false;
    const startP = parseTimePart(parts[0]);
    const endP = parseTimePart(parts[1]);
    if (!startP || !endP) return false;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startP.hh, startP.mm, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endP.hh, endP.mm, 59);
    return now >= start && now <= end;
  };

  const determineNowMeal = (menuForToday: DayMenu | null) => {
    if (!menuForToday) return 'CLOSED';
    const wanted = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];
    for (const key of wanted) {
      const m = menuForToday.meals.find(x => String(x.meal || '').toUpperCase().includes(key));
      if (m && m.time && isNowInRange(m.time)) return m.meal;
    }
    return 'CLOSED';
  };

  // update nowMeal every 30 seconds so OPEN/CLOSED updates live
  useEffect(() => {
    const updateNow = () => {
      const todayName = new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
      const todayMenu = schedule ? schedule.find(d => d.day.toUpperCase() === todayName) || null : null;
      setNowMeal(determineNowMeal(todayMenu));
    };
    updateNow();
    const t = setInterval(updateNow, 30 * 1000);
    return () => clearInterval(t);
  }, [schedule]);

  const isOpen = nowMeal !== 'CLOSED';

  const parseDayFromSchedule = (label: string) => {
    // normalize to JSON day key format like "MONDAY"
    return String(label).toUpperCase();
  };

  const handleRate = async (dayLabel: string, mealName: string, rating: number) => {
    const dayKey = parseDayFromSchedule(dayLabel);
    const storageKey = `mess_local_${dayKey}_${mealName.replace(/\s+/g,'_')}`;
    try {
      // persist local flag
      localStorage.setItem(storageKey, String(rating));
      setLocalRatings(prev => ({ ...prev, [`${dayKey}::${mealName}`]: rating }));

      // persist to DB if a user is logged in (or still write anonymous if desired)
      const uid = auth?.currentUser?.uid || null;
      await addOrUpdateMessRating(uid, dayKey, mealName, rating);

      // refresh aggregates for that day
      const ag = await getAggregatedRatingsForDay(dayKey);
      setAggregates(ag);
    } catch (e) {
      // swallow errors (or optionally show toast)
      console.error('rate error', e);
    }
  };

  const renderStars = (dayLabel: string, mealName: string) => {
    const dayKey = parseDayFromSchedule(dayLabel);
    const localKey = `${dayKey}::${mealName}`;
    const userRated = typeof localRatings[localKey] !== 'undefined';
    const agg = (aggregates[mealName] || aggregates[mealName.toUpperCase()]) as ( { avg:number; count:number; relative?:number } | undefined) || { avg: 0, count: 0, relative: 0 };
    const displayValue = userRated ? localRatings[localKey] : Math.round(agg.avg);

    return (
      <div className="flex items-center space-x-3">
        <div className="flex">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              onClick={() => handleRate(dayLabel, mealName, i)}
              className={`p-1 ${i <= displayValue ? 'text-yellow-500' : 'text-gray-300'}`}
              title={`Rate ${mealName} ${i}/5`}
              aria-label={`Rate ${mealName} ${i} out of 5`}
            >
              <StarIcon className="h-4 w-4" />
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {agg.count ? (
            <>
              <div>{agg.avg} / 5 ({agg.count})</div>
              <div>Relative: {typeof agg.relative === 'number' ? `${agg.relative} / 5` : '—'}</div>
            </>
          ) : userRated ? `${localRatings[localKey]} / 5 (you)` : 'No ratings'}
        </div>
      </div>
    );
  };

  const todayName = new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const todayMenu = schedule ? schedule.find(d => d.day.toUpperCase() === todayName) || null : null;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-1">Mess Hall</h1>
        <p className="text-muted-foreground">Check meal schedules & today's menu</p>
      </div>

      {/* Current Status - centered */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardContent className="text-center p-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <p className="text-sm text-muted-foreground">
                {isOpen ? `${nowMeal} serving now` : 'Serving times: Breakfast, Lunch, Snacks, Dinner'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="today">Today's Menu</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {todayMenu ? todayMenu.meals.map((meal, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{meal.meal}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{meal.time}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1">
                    {meal.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="text-sm bg-accent/50 rounded px-2 py-1">
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Rating UI centered */}
                  <div className="pt-2 flex justify-center">
                    {renderStars(todayMenu.day, meal.meal)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div>Loading menu...</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mess Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center justify-center mb-1">
                <StarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {aggregates ? (
                  (() => {
                    // compute overall relative average across meals (ignore zero entries)
                    const rels = Object.values(aggregates)
                      .map(x => (typeof (x as any).relative === 'number' ? (x as any).relative : (x as any).avg))
                      .filter(v => v > 0);
                    if (!rels.length) return 'No ratings';
                    const avgOverallRel = +(rels.reduce((a,b)=>a+b,0)/rels.length).toFixed(2);
                    return `${avgOverallRel} / 5 (relative)`;
                  })()
                ) : '—'}
              </div>
              <p className="text-xs text-muted-foreground">Today's relative average vs peers</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Floating Action Button: Role Based */}
    <div className="fixed bottom-6 right-6 z-50">
      {isAdmin ? (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-teal-600 hover:bg-teal-700"
          onClick={() => router.push('/mess/events')}
          aria-label="Create Mess Event"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      ) : (
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-indigo-600 hover:bg-indigo-700"
          onClick={() => router.push('/mess/events')}
          aria-label="View Mess Events"
        >
          <ScanLine className="h-6 w-6 text-white" />
        </Button>
      )}
    </div>

    </div>
  );
}