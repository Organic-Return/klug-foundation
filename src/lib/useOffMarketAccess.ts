'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';

export const OFF_MARKET_PASSCODE = 'CKPMembers';
export const OFF_MARKET_PASSCODE_KEY = 'ckp-off-market-passcode';

/**
 * Returns whether the visitor has access to off-market listings
 * via either a logged-in account OR the shared member passcode.
 */
export function useOffMarketAccess() {
  const { user, loading, signOut } = useAuth();
  const [passcodeUnlocked, setPasscodeUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(OFF_MARKET_PASSCODE_KEY) === 'true') {
      setPasscodeUnlocked(true);
    }
  }, []);

  const unlockWithPasscode = (input: string): boolean => {
    if (input.trim() === OFF_MARKET_PASSCODE) {
      sessionStorage.setItem(OFF_MARKET_PASSCODE_KEY, 'true');
      setPasscodeUnlocked(true);
      return true;
    }
    return false;
  };

  const lockPasscode = () => {
    sessionStorage.removeItem(OFF_MARKET_PASSCODE_KEY);
    setPasscodeUnlocked(false);
  };

  return {
    user,
    loading,
    signOut,
    passcodeUnlocked,
    unlockWithPasscode,
    lockPasscode,
    hasAccess: !!user || passcodeUnlocked,
  };
}
