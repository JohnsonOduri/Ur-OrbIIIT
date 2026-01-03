"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// status UI will use inline spans instead of the Badge component for consistent styling
import { Button } from "../../components/ui/button";
import { Plus, Calendar, Clock, QrCode, Users } from 'lucide-react';
import { CreateEventModal } from './CreateEventModal';
import { createMessEvent, listMessEvents } from '../../lib/firestore';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

interface MessEvent {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'live' | 'closed';
  attendeeCount: number;
  qrCode: string;
}

interface MessEventDashboardProps {
  userEmail: string;
  onNavigate: (page: string, eventId?: string) => void;
}

export function MessEventDashboard({ userEmail, onNavigate }: MessEventDashboardProps) {
  const [events, setEvents] = useState<MessEvent[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const isAdmin = auth.currentUser?.email === 'odurijohnson24bcs66@iiitkottayam.ac.in';
  const router = useRouter();

  useEffect(() => {
    loadEvents();
    // Update event statuses every minute
    const interval = setInterval(updateEventStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = () => {
    (async () => {
      try {
        const list = await listMessEvents();
        const mapped = list.map(e => ({ ...e, status: getEventStatus(e as MessEvent) } as MessEvent));
        setEvents(mapped);
      } catch (err) {
        console.error('load events failed', err);
        setEvents([]);
      }
    })();
  };

  const getEventStatus = (event: MessEvent): 'upcoming' | 'live' | 'closed' => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const [startHour, startMinute] = event.startTime.split(':').map(Number);
    const [endHour, endMinute] = event.endTime.split(':').map(Number);
    
    const eventStart = new Date(eventDate);
    eventStart.setHours(startHour, startMinute, 0, 0);
    
    const eventEnd = new Date(eventDate);
    eventEnd.setHours(endHour, endMinute, 0, 0);

    if (now < eventStart) return 'upcoming';
    if (now >= eventStart && now <= eventEnd) return 'live';
    return 'closed';
  };

  const updateEventStatuses = () => {
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(event => ({
        ...event,
        status: getEventStatus(event)
      }));
      return updatedEvents;
    });
  };

  const handleCreateEvent = async (eventData: Omit<MessEvent, 'id' | 'status' | 'attendeeCount' | 'qrCode'>) => {
  if (!auth.currentUser) {
    console.error("User not authenticated");
    return;
  }

  try {
    

    const created = await createMessEvent({
      name: eventData.name,
      date: eventData.date,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
    });

    const updated = { ...created, status: getEventStatus(created as any) } as MessEvent;
    setEvents(prev => [...prev, updated]);
    setIsCreateModalOpen(false);
  } catch (err) {
    console.error("create event failed", err);
  }
};


  const getStatusBadge = (status: 'upcoming' | 'live' | 'closed') => {
    switch (status) {
      case 'upcoming':
        return (
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Upcoming
          </span>
        );
      case 'live':
        return (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live
          </span>
        );
      case 'closed':
        return (
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Closed
          </span>
        );
    }
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const liveEvents = events.filter(e => e.status === 'live');
  const closedEvents = events.filter(e => e.status === 'closed');

  const goToDetails = (id: string) => router.push(`/mess/event/${id}`);
  const goToScanner = (id?: string) => router.push(id ? `/mess/scan/${id}` : '/mess/scan');

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mess Events</h1>
          <p className="text-muted-foreground">QR-based attendance system</p>
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Live Events */}
      {liveEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-green-600 dark:text-green-400"> Live Events</h2>
          {liveEvents.map(event => (
              <Card 
              key={event.id}
              className="border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => goToDetails(event.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{event.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{event.attendeeCount} attended</span>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => goToScanner(event.id)}>
                    <QrCode className="h-4 w-4" />
                    {isAdmin ? 'View QR' : 'Scan QR'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Upcoming Events</h2>
          {upcomingEvents.map(event => (
              <Card 
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => goToDetails(event.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{event.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.attendeeCount} registered</span>
                  </div>
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="gap-2">
                      <QrCode className="h-4 w-4" />
                      View QR
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Closed Events */}
      {closedEvents.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">Past Events</h2>
          {closedEvents.map(event => (
              <Card 
              key={event.id}
              className="opacity-75 cursor-pointer hover:opacity-100 transition-opacity"
              onClick={() => goToDetails(event.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{event.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.attendeeCount} attended</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <Card className="p-12 text-center">
          <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin ? 'Create your first mess event to get started' : 'No mess events scheduled at the moment'}
          </p>
          {isAdmin && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Event
            </Button>
          )}
        </Card>
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateEvent}
      />
    </div>
  );
}
