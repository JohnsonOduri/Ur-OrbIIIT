import React from 'react';
import { Button } from "../../components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export interface AttendanceResultPageProps {
  status: 'success' | 'already-attended' | 'invalid-time' | 'invalid' | 'error';
  message: string;
  description: string;
  eventName?: string;
  timestamp?: string;
  onNavigate: (page: string) => void;
}

const formatTimestamp = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;

  try {
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'IST'
    });
    return `${dateFormatter.format(date)} `;
  } catch {
    return date.toISOString();
  }
};

export function AttendanceResultPage({ 
  status, 
  message, 
  description, 
  eventName,
  timestamp,
  onNavigate 
}: AttendanceResultPageProps) {
  
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          bgColor: 'bg-green-500 dark:bg-green-600',
          icon: <CheckCircle2 className="h-24 w-24 text-white mb-6" />,
          textColor: 'text-white'
        };
      case 'already-attended':
        return {
          bgColor: 'bg-red-500 dark:bg-red-600',
          icon: <XCircle className="h-24 w-24 text-white mb-6" />,
          textColor: 'text-white'
        };
      case 'invalid-time':
        return {
          bgColor: 'bg-yellow-500 dark:bg-yellow-600',
          icon: <Clock className="h-24 w-24 text-white mb-6" />,
          textColor: 'text-white'
        };
      case 'invalid':
      case 'error':
        return {
          bgColor: 'bg-red-500 dark:bg-red-600',
          icon: <AlertCircle className="h-24 w-24 text-white mb-6" />,
          textColor: 'text-white'
        };
    }
  };

  const config = getStatusConfig();
  const formattedTimestamp = formatTimestamp(timestamp);

  return (
    <div className={`min-h-screen ${config.bgColor} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="flex justify-center">
          {config.icon}
        </div>

        {/* Message */}
        <h1 className={`text-3xl font-bold mb-4 ${config.textColor}`}>
          {message}
        </h1>

        {/* Event Name */}
        {eventName && (
          <div className={`text-xl mb-2 ${config.textColor} opacity-90`}>
            {eventName}
          </div>
        )}

        {/* Description */}
        <p className={`text-lg mb-8 ${config.textColor} opacity-80`}>
          {description}
        </p>

        {/* Timestamp */}
        {formattedTimestamp && (
          <div className={`mb-8 p-4 rounded-lg bg-white/10 ${config.textColor}`}>
            <p className="text-sm opacity-80 mb-1">Recorded at</p>
            <p className="font-semibold">{formattedTimestamp}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === 'success' && (
            <Button
              onClick={() => onNavigate('mess-events')}
              size="lg"
              className="w-full bg-white text-green-600 hover:bg-white/90 dark:bg-white dark:text-green-700 dark:hover:bg-white/90"
            >
              View All Events
            </Button>
          )}

          {status !== 'success' && (
            <>
              <Button
                onClick={() => onNavigate('mess-events')}
                size="lg"
                className="w-full bg-white text-gray-900 hover:bg-white/90"
              >
                Back to Events
              </Button>
              {status === 'invalid' || status === 'error' ? (
                <Button
                  onClick={() => onNavigate('mess-qr-scanner')}
                  size="lg"
                  variant="outline"
                  className="w-full border-white text-white hover:bg-white/10"
                >
                  Try Again
                </Button>
              ) : null}
            </>
          )}
        </div>

        {/* Additional Info */}
        {status === 'invalid-time' && (
          <div className={`mt-6 p-4 rounded-lg bg-white/10 ${config.textColor} text-sm`}>
            <p className="opacity-80">
              Please scan the QR code only during the event's scheduled time window.
            </p>
          </div>
        )}

        {status === 'already-attended' && (
          <div className={`mt-6 p-4 rounded-lg bg-white/10 ${config.textColor} text-sm`}>
            <p className="opacity-80">
              You can only mark attendance once per event. Your previous attendance has been recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
