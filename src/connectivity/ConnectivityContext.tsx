import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState } from 'react-native';
export type ConnectivityStatus = 'checking' | 'online' | 'offline';
export const refreshConnectivity = () => NetInfo.refresh();
export function connectivityStatus(
  state: Pick<NetInfoState, 'isConnected' | 'isInternetReachable'>,
): ConnectivityStatus {
  if (state.isConnected === false || state.isInternetReachable === false)
    return 'offline';
  if (state.isConnected === true && state.isInternetReachable === true)
    return 'online';
  return 'checking';
}
const Context = createContext<ConnectivityStatus>('checking');
export function ConnectivityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<ConnectivityStatus>('checking');
  useEffect(() => {
    // Wi-Fi/cellular attachment alone does not prove internet access.
    NetInfo.configure({
      useNativeReachability: false,
      reachabilityUrl: 'https://clients3.google.com/generate_204',
      reachabilityMethod: 'HEAD',
      reachabilityTest: async response => response.status === 204,
      reachabilityRequestTimeout: 8000,
      reachabilityShortTimeout: 5000,
      reachabilityLongTimeout: 30000,
      reachabilityShouldRun: () => AppState.currentState === 'active',
    });
    const unsubscribe = NetInfo.addEventListener(state =>
      setStatus(connectivityStatus(state)),
    );
    const app = AppState.addEventListener('change', next => {
      if (next === 'active') refreshConnectivity().catch(() => {});
    });
    return () => {
      unsubscribe();
      app.remove();
    };
  }, []);
  return <Context.Provider value={status}>{children}</Context.Provider>;
}
export const useConnectivity = () => useContext(Context);
