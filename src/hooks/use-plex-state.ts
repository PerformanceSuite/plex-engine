import { useState, useCallback } from 'react';

interface PlexState {
  activeId: string;
  navigate: (nodeId: string) => void;
}

export function usePlexState(initialActiveId: string): PlexState {
  const [activeId, setActiveId] = useState(initialActiveId);

  const navigate = useCallback((nodeId: string) => {
    setActiveId(nodeId);
  }, []);

  return { activeId, navigate };
}
