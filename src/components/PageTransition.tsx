import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  currentKey: string;
  children: React.ReactNode;
}

const TAB_ORDER: Record<string, number> = {
  home: 0,
  'how-it-works': 1,
  maps: 2,
  assistant: 3,
  'model-card': 4,
  'ngo-schools': 5,
  admin: 6,
  assist: 7,
  install: 8,
  design: 9,
};

export const PageTransition: React.FC<Props> = ({ currentKey, children }) => {
  const { reducedMotion } = useTheme();
  const [direction, setDirection] = useState<number>(1);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const prevKeyRef = useRef<string>(currentKey);

  useEffect(() => {
    if (prevKeyRef.current !== currentKey) {
      const prevOrder = TAB_ORDER[prevKeyRef.current] ?? 0;
      const nextOrder = TAB_ORDER[currentKey] ?? 0;
      setDirection(nextOrder >= prevOrder ? 1 : -1);
      prevKeyRef.current = currentKey;

      // Trigger 2px top hairline progress animation
      setIsNavigating(true);
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentKey]);

  // Motion variants
  const variants: any = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : {
        initial: (dir: number) => ({
          opacity: 0,
          x: dir * 24,
        }),
        animate: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
        },
        exit: (dir: number) => ({
          opacity: 0,
          x: -dir * 24,
          transition: {
            duration: 0.15,
            ease: [0.4, 0, 0.2, 1],
          },
        }),
      };

  return (
    <div className="relative w-full flex-1 flex flex-col">
      {/* 2px high accent progress hairline at the very top of the viewport during navigation */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="page-nav-hairline"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              scaleX: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.15 },
            }}
            style={{ transformOrigin: direction > 0 ? 'left center' : 'right center' }}
            className="fixed top-0 left-0 right-0 h-[2px] bg-[var(--accent)] z-[100] pointer-events-none"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentKey}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full flex-1 flex flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
