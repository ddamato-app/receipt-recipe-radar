import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CelebrationAnimationProps {
  show: boolean;
  message: string;
  onComplete: () => void;
}

export function CelebrationAnimation({ show, message, onComplete }: CelebrationAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="animate-scale-in">
        <div className="bg-success/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center animate-pulse-success">
          <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Great Job!</h3>
          <p className="text-white/90 text-sm">{message}</p>
        </div>
      </div>
      
      {/* Confetti-like particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full animate-[pulse_0.5s_ease-out]"
            style={{
              left: `${50 + (Math.random() - 0.5) * 40}%`,
              top: `${50 + (Math.random() - 0.5) * 40}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
