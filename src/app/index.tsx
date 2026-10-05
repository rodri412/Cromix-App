import React from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '../state/AppProvider';
export default function Index() { const { session, demo, progress } = useApp(); return <Redirect href={demo ? '/inicio' : session ? progress?.onboarded ? '/inicio' : '/calibrar' : '/entrar'} />; }
