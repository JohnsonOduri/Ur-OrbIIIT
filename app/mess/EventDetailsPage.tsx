import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Calendar, Clock, Download, RefreshCw, QrCode as QrCodeIcon, Users, Scan } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getMessEventById, regenerateMessEventQr } from '../../lib/firestore';
import { useRouter } from 'next/navigation';

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

interface EventDetailsPageProps {
  eventId: string;
  userEmail: string;
  onNavigate: (page: string, eventId?: string) => void;
}

export function EventDetailsPage({ eventId, userEmail, onNavigate }: EventDetailsPageProps) {
  const [event, setEvent] = useState<MessEvent | null>(null);
  const isAdmin = userEmail === 'odurijohnson24bcs66@iiitkottayam.ac.in';
  const router = useRouter();

  useEffect(() => {
    loadEvent();
    // Update event status every minute
    const interval = setInterval(loadEvent, 60000);
    return () => clearInterval(interval);
  }, [eventId]);

  const loadEvent = () => {
    // try fetching up to 3 times with short delay — sometimes client-side navigation
    // can hit a transient state where Firestore isn't ready; retrying fixes the
    // observed "Event not found until refresh" behavior.
    (async () => {
      let attempts = 0;
      while (attempts < 3) {
        try {
          const ev = await getMessEventById(eventId);
          if (ev) {
            const updatedEvent = { ...ev, status: getEventStatus(ev as MessEvent) } as MessEvent;
            setEvent(updatedEvent);
            return;
          }
          // if ev is null, delay and retry
        } catch (err) {
          console.error('loadEvent attempt failed', attempts + 1, err);
        }
        attempts += 1;
        await new Promise(res => setTimeout(res, 400));
      }
      // final attempt to surface a missing event (will show "Event not found")
      try {
        const ev = await getMessEventById(eventId);
        if (ev) setEvent({ ...ev, status: getEventStatus(ev as MessEvent) } as MessEvent);
      } catch (err) {
        console.error('loadEvent final attempt failed', err);
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

  const downloadQR = () => {
    const svg = document.getElementById('event-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${event?.name}-QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const regenerateQR = () => {
    if (!event) return;
    (async () => {
      try {
        const updated = await regenerateMessEventQr(eventId);
        setEvent(updated as any);
      } catch (err) {
        console.error('regenerate failed', err);
      }
    })();
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

  if (!event) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => router.push('/mess/events')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Event not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/mess/events')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Event Details</h1>
        </div>
        {getStatusBadge(event.status)}
      </div>

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle>{event.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {new Date(event.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{event.startTime} - {event.endTime}</p>
              <p className="text-sm text-muted-foreground">Event time window</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{event.attendeeCount} students</p>
              <p className="text-sm text-muted-foreground">Total attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      <Card className={event.status === 'live' ? 'border-2 border-green-200 dark:border-green-800' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <QrCodeIcon className="h-5 w-5" />
              Event QR Code
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code Display */}
          <div className="flex justify-center p-8 bg-white rounded-lg">
            <QRCodeSVG
              id="event-qr-code"
              value={JSON.stringify({
                eventId: event.id,
                eventName: event.name,
                qrCode: event.qrCode,
                type: 'mess-event-attendance'
              })}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            {event.status === 'live' ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  ✓ Event is Live - Scanning is now active
                </p>
              </div>
            ) : event.status === 'upcoming' ? (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  ⏳ Event starts at {event.startTime}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  Event has ended
                </p>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {isAdmin 
                ? "Display this QR code for students to scan during the event time"
                : "Scan this QR code during the event time to register your attendance"
              }
            </p>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={downloadQR} variant="outline" className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Download QR
              </Button>
              <Button onClick={regenerateQR} variant="outline" className="flex-1 gap-2">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            </div>
          )}

          {/* Student Scan Button */}
          {!isAdmin && event.status === 'live' && (
            <Button 
              onClick={() => router.push(`/mess/scan/${eventId}`)}
              className="w-full gap-2"
              size="lg"
            >
              <Scan className="h-5 w-5" />
              Scan QR Code
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
