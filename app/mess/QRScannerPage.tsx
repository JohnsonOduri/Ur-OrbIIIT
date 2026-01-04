"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Camera, AlertCircle } from "lucide-react";
import { getMessEventById, hasUserAttendedEvent, markAttendanceForEvent } from "../../lib/firestore";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

interface QRScannerPageProps {
  userEmail?: string;
}

export function QRScannerPage({ userEmail }: QRScannerPageProps) {
  const router = useRouter();
  const scannerRef = useRef<any>(null);

  const processingRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Scanner lifecycle ---------------- */

  useEffect(() => {
    // startScanner is async; call without awaiting
    startScanner();
    // cleanup must be synchronous: call stopScanner but don't return its Promise
    return () => {
      stopScanner().catch(() => {});
    };
  }, []);

  const startScanner = async () => {
    try {
      if (scannerRef.current) return; // already started
      const { Html5Qrcode } = await import("html5-qrcode");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        handleScanSuccess,
        /* QrcodeErrorCallback - provide a no-op to satisfy typings */
        (errorMessage?: string) => {
          // ignore scan errors
          return;
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      // also try to stop any underlying media tracks (video) used by the scanner
      try {
        const video = document.querySelector('#qr-reader video') as HTMLVideoElement | null;
        if (video) {
          const stream = (video.srcObject as MediaStream) || (video as any)._stream || null;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach(t => t.stop());
          }
          try { video.srcObject = null; } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    } catch {
      // swallow cleanup errors
    } finally {
      setIsScanning(false);
    }
  };

  /* ---------------- QR Processing ---------------- */

  const handleScanSuccess = async (decodedText: string) => {
    // guard against re-entrancy
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      await stopScanner();

      const payload = JSON.parse(decodedText);

      if (payload.type !== "mess-event-attendance") {
        return redirectResult("invalid", "Invalid QR Code", "Not a mess attendance QR");
      }

      const event = await getMessEventById(payload.eventId);
      if (!event) {
        return redirectResult("error", "Event Not Found", "This event does not exist");
      }

      if (event.qrCode !== payload.qrCode) {
        return redirectResult("invalid", "Invalid QR Code", "QR mismatch");
      }

      const now = new Date();
      const eventDate = new Date(event.date);

      const [sh, sm] = event.startTime.split(":").map(Number);
      const [eh, em] = event.endTime.split(":").map(Number);

      const start = new Date(eventDate);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(eventDate);
      end.setHours(eh, em, 0, 0);

      if (now < start || now > end) {
        return redirectResult(
          "invalid-time",
          "Event Not Active",
          `Allowed between ${event.startTime} and ${event.endTime}`,
          event.name
        );
      }

      const uid = auth.currentUser?.uid ?? "";
      const email = auth.currentUser?.email ?? userEmail ?? null;

      const already = await hasUserAttendedEvent(uid, event.id);
      if (already) {
        // try to fetch attendance record so we can show timestamp
        try {
          const { getUserAttendanceRecord } = await import("../../lib/firestore");
          const rec = await getUserAttendanceRecord(uid, event.id) as any;
          let ts: string | undefined = undefined;
          if (rec && rec.attendedAt) {
            // attendedAt may be a serverTimestamp object
            const a = rec.attendedAt as any;
            if (a && typeof a === 'object' && typeof a.seconds === 'number') {
              ts = new Date(a.seconds * 1000).toISOString();
            } else {
              ts = String(rec.attendedAt);
            }
          }
          return redirectResult("already-attended", "Already Attended", "Attendance already recorded", event.name, ts);
        } catch (e) {
          return redirectResult("already-attended", "Already Attended", "Attendance already recorded", event.name);
          console.log(e);
        }
      }

      const res = await markAttendanceForEvent(uid, email, event.id);

      redirectResult(
        "success",
        "Attendance Registered",
        "You have been marked present",
        event.name,
        res.timestamp
      );
    } catch (err) {
      console.error(err);
      redirectResult("error", "Invalid QR Code", "Failed to process QR");
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  };

  const redirectResult = (
    status: string,
    message: string,
    description: string,
    eventName?: string,
    timestamp?: string
  ) => {
    const params = new URLSearchParams({
      status,
      message,
      description,
    });

    if (eventName) params.append("eventName", eventName);
    if (timestamp) params.append("timestamp", timestamp);
    const target = `/mess/result?${params.toString()}`;

    if (typeof window !== "undefined") {
      // full reload ensures camera streams and html5-qrcode are torn down
      window.location.replace(target);
    } else {
      router.push(target);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={async () => { await stopScanner().catch(() => {}); router.back(); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Scan QR Code</h1>
            <p className="text-sm text-muted-foreground">
              Position the QR code within the frame
            </p>
          </div>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {error ? (
            <Card className="border-red-300">
              <CardContent className="p-6 text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={startScanner} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative rounded-lg overflow-hidden bg-black">
                <div id="qr-reader" className="w-full" />
                {isScanning && (
                  <div className="absolute inset-0 border-2 border-green-500 rounded-lg pointer-events-none" />
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <div className="space-y-2 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto" />
                      <div>Processing attendance…</div>
                    </div>
                  </div>
                )}
              </div>

              <Card>
                <CardContent className="p-4 flex gap-3">
                  <Camera className="h-5 w-5 text-primary" />
                  <div className="text-sm text-muted-foreground">
                    Hold steady and ensure good lighting for faster scanning.
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
