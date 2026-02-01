'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startAmbientSound, stopAmbientSound, isAmbientActive, playSound } from '@/lib/sounds';

export function SoundToggle() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(isAmbientActive());
  }, []);

  const toggle = () => {
    playSound('click');
    if (enabled) {
      stopAmbientSound();
      setEnabled(false);
    } else {
      startAmbientSound();
      setEnabled(true);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-9 h-9">
        <VolumeX className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="w-9 h-9 relative group"
      title={enabled ? 'Mute ambient sounds' : 'Enable ambient sounds'}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <VolumeX className="w-4 h-4 text-muted-foreground" />
      )}
      {enabled && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
      )}
    </Button>
  );
}
