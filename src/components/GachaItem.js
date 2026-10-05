import React from 'react';
import { RecordArtwork } from './RecordArtwork';
export default function GachaItem({type, title = 'Cromix'}) { return <RecordArtwork format={type} title={title} />; }
