"use client";
import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  delay?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export default function CountUp({ 
  end, 
  duration = 2000, 
  delay = 0, 
  className = "",
  suffix = "",
  prefix = ""
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;

      const updateCount = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, end, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}
