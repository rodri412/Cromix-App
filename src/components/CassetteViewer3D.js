import React from 'react';
import RecordInspector from './RecordInspector';
export default function CassetteViewer3D({visible, item, onClose}) { return <RecordInspector gift={visible ? item : null} onClose={onClose} />; }
