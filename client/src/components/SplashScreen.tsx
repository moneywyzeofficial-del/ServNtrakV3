import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import logoImage from "@assets/Logo_ServNtrak_V.png";

interface SplashScreenProps {
  onFinish: () => void;
  userName?: string | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return "Bom dia";
  } else if (hour >= 12 && hour < 19) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}

export function SplashScreen({ onFinish, userName }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const greeting = useMemo(() => {
    const baseGreeting = getGreeting();
    if (userName) {
      return `${baseGreeting}, ${userName}`;
    }
    return baseGreeting;
  }, [userName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onFinish, 500);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex flex-col items-center justify-center">
              <img
                src={logoImage}
                alt="ServNtrak Logo"
                className="w-64 h-auto object-contain"
              />
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <p className="text-sm text-muted-foreground mt-1">Gestão de Serviços no Terreno</p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-base font-medium text-foreground mt-3"
              >
                {greeting}
              </motion.p>
            </motion.div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-12"
          >
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
