import { createContext, useContext } from 'react';
export const StartupContext = createContext({ preparing: false, envelopeReady: () => {}, envelopeFailed: () => {} });
export const useStartup = () => useContext(StartupContext);
