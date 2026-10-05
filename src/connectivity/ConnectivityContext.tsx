import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
export type ConnectivityStatus = 'checking' | 'online' | 'offline';
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
  useEffect(
    () =>
      NetInfo.addEventListener(state => setStatus(connectivityStatus(state))),
    [],
  );
  return <Context.Provider value={status}>{children}</Context.Provider>;
}
export const useConnectivity = () => useContext(Context);
