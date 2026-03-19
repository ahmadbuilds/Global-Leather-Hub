import React, { useEffect, useRef } from "react";

const SITE_KEY =
  import.meta.env.VITE_CF_TURNSTILE_SITE_KEY

const CloudflareTurnstile = ({ onVerify, onExpire, onError }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });

  
  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError };
  }, [onVerify, onExpire, onError]);

  const renderWidget = () => {
    if (!containerRef.current || !window.turnstile) return;

    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "dark",
      size: "flexible",
      callback: (token) => callbacksRef.current.onVerify?.(token),
      "expired-callback": () => callbacksRef.current.onExpire?.(),
      "error-callback": () => callbacksRef.current.onError?.(),
    });
  };

  useEffect(() => {
    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 200);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cf-turnstile w-full"
      style={{ display: "block" }}
    />
  );
};

export default CloudflareTurnstile;
