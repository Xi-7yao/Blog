import { useCallback, useEffect, useRef, useState } from 'react';
import { SAVE_STATUS_RESET_DELAY } from './editorUtils';

export type SaveStatus = 'idle' | 'saving' | 'saved';

export const useSaveStatus = () => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const markSaving = useCallback(() => {
    clearResetTimer();
    setSaveStatus('saving');
  }, [clearResetTimer]);

  const markSaved = useCallback(() => {
    clearResetTimer();
    setSaveStatus('saved');
    timeoutRef.current = setTimeout(() => {
      setSaveStatus('idle');
      timeoutRef.current = null;
    }, SAVE_STATUS_RESET_DELAY);
  }, [clearResetTimer]);

  const resetSaveStatus = useCallback(() => {
    clearResetTimer();
    setSaveStatus('idle');
  }, [clearResetTimer]);

  useEffect(() => clearResetTimer, [clearResetTimer]);

  return {
    saveStatus,
    markSaving,
    markSaved,
    resetSaveStatus,
  };
};
