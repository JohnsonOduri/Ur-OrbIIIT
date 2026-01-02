"use client";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [animationData, setAnimationData] = useState<any | null>(null);

  useEffect(() => {
    // Start fade out at 2.5s, fully hide at 3s
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    const hideTimer = setTimeout(() => setIsVisible(false), 3000);

    // load local lottie json (no external player, no watermark)
    (async () => {
      try {
        const res = await fetch('/animations/splash-screen.json');
        if (!res.ok) return;
        const json = await res.json();
        // basic validation: must have a v or ip/op/frame data
        if (json && (json.v || json.layers || json.assets)) {
          setAnimationData(json);
        }
      } catch (e) {
        // ignore — fallback will be used
      }
    })();

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black z-[100] transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {animationData ? (
        <div className="w-48 h-48">
          <Lottie
            animationData={animationData}
            loop={false}
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ) : (
        <h1 className="text-4xl font-bold text-white animate-pulse">OrbIIIT</h1>
      )}
    </div>
  );
}
