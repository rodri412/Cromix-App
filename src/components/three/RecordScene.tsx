import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from '../../../assets/fonts/cromix-sans.typeface.json';
import type { Envelope, Format } from '../../domain/types';
import { ENVELOPES } from '../../domain/gifts';
import { labelInk,recordPalette } from '../../domain/palette';
import { useArtworkTexture } from './useArtworkTexture';
import { emergingRecordPose, foilCameraDistance, foilTearLift } from '../../domain/foilScene';
import { CD_HOLE_RADIUS, CD_HUB_RADIUS, CD_PRINT_RADIUS, DISC_RADIUS } from '../../domain/recordDimensions';
import CdReflectiveMaterial from './CdReflectiveMaterial';
export type StageProps = { format: Format; title: string; albumUrl?: string | null; tint?: string; rotation: [number, number, number]; onReady?: () => void; envelope?: Envelope; daily?: boolean; upright?: boolean; cut?: number; cutHint?:boolean; cutDirection?: 1|-1; emergence?: number; flap?: number };
const font = new FontLoader().parse(fontData);
function Caption({ title, position, width, color = '#352f29', size = 0.1 }: { title: string; position: [number, number, number]; width: number; color?: string; size?: number }) {
  const geometry = useMemo(() => {
    const geometry = new TextGeometry(title.normalize('NFC').length > 28 ? `${title.normalize('NFC').slice(0, 27)}…` : title.normalize('NFC'), { font, size, depth: 0.001, curveSegments: 2 });
    geometry.computeBoundingBox();
    const bounds = geometry.boundingBox!;
    const scale = Math.min(1, width / Math.max(0.001, bounds.max.x - bounds.min.x));
    geometry.scale(scale, scale, 1); geometry.center(); return geometry;
  }, [title, width, size]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} geometry={geometry}><meshBasicMaterial color={color} /></mesh>;
}
function Body({ dimensions, color, position = [0, 0, 0], transparent = false }: { dimensions: [number, number, number]; color: string; position?: [number, number, number]; transparent?: boolean }) {
  const [x, y, z] = dimensions;
  const geometry = useMemo(() => new RoundedBoxGeometry(x, y, z, 2, Math.min(0.08, z / 3)), [x, y, z]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={position}><meshPhysicalMaterial color={color} roughness={transparent ? 0.14 : 0.4} metalness={transparent ? 0.1 : 0.18} transparent={transparent} opacity={transparent ? 0.32 : 1} depthWrite={!transparent} clearcoat={1} clearcoatRoughness={0.12} /></mesh>;
}
function Disc({ outer, inner, depth, color, metalness = 0.3, transparent = false }: { outer: number; inner: number; depth: number; color: string; metalness?: number; transparent?: boolean }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape(); shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, inner, 0, Math.PI * 2, true); shape.holes.push(hole);
    const result = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 48, steps: 1 }); result.translate(0, 0, -depth / 2); return result;
  }, [outer, inner, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshPhysicalMaterial color={color} roughness={transparent ? 0.12 : 0.25} metalness={metalness} clearcoat={1} clearcoatRoughness={0.08} transparent={transparent} opacity={transparent ? 0.42 : 1} depthWrite={!transparent} /></mesh>;
}
function GrainMaterial({ color, metalness = 0.1, vertexColors=false }: { color: string; metalness?: number;vertexColors?:boolean }) {
  const texture = useMemo(() => {
    const bytes = new Uint8Array(64 * 64 * 4);
    for (let i = 0; i < bytes.length; i += 4) { const value = 120 + ((i * 13 + (i >> 4)) % 17); bytes[i] = value; bytes[i + 1] = value; bytes[i + 2] = 250; bytes[i + 3] = 255; }
    const result = new THREE.DataTexture(bytes, 64, 64); result.wrapS = result.wrapT = THREE.RepeatWrapping; result.repeat.set(3, 3); result.needsUpdate = true; return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return <meshStandardMaterial color={color} vertexColors={vertexColors} metalness={metalness} roughness={metalness > 0.5 ? 0.22 : 0.56} normalMap={texture} normalScale={new THREE.Vector2(0.09, 0.09)} />;
}
function PaperEnvelope({ type, flap }: { type: Envelope; flap: number }) {
  const paper = ENVELOPES.find(value => value.id === type) ?? ENVELOPES[0];
  const triangle = useMemo(() => {
    const shape = new THREE.Shape(); shape.moveTo(-1.55, 0); shape.lineTo(0, -1.12); shape.lineTo(1.55, 0); shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  useEffect(() => () => triangle.dispose(), [triangle]);
  return <>
    <mesh><boxGeometry args={[3.15, 2.08, 0.085]} /><GrainMaterial color={paper.color} /></mesh>
    <mesh position={[0, -1.03, 0.05]} rotation={[0, 0, Math.PI]} geometry={triangle}><meshStandardMaterial color={paper.color} roughness={0.95} side={THREE.DoubleSide} /></mesh>
    <group position={[0, 1.04, 0.08]} rotation={[-flap * 2.8, 0, 0]}>
      <mesh geometry={triangle}><meshStandardMaterial color={paper.color} roughness={0.95} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.83, 0.025]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.18, 0.19, 0.05, 32]} /><meshStandardMaterial color="#9a5264" roughness={0.55} /></mesh>
    </group>
    <Body dimensions={[0.35, 0.43, 0.025]} position={[1.16, 0.55, 0.07]} color="#eee1c9" />
    <Caption title="CROMIX" position={[-0.85, -0.69, 0.069]} width={0.85} />
  </>;
}
function FoilWrapper({ flap }: { flap: number }) {
  const geometry = useMemo(() => {
    const result = new THREE.PlaneGeometry(2.85, 1.85, 36, 24);
    const positions = result.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      const pillow = Math.pow(Math.max(0, 1 - (x / 1.425) ** 2), 0.55) * Math.pow(Math.max(0, 1 - (y / 0.925) ** 2), 0.55);
      const wrinkle = Math.sin(x * 33 + y * 12) * Math.cos(y * 21) * 0.018 * (1 - pillow);
      positions.setZ(i, pillow * 0.23 + wrinkle);
    }
    result.computeVertexNormals();
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    {[1, -1].map(side => <mesh key={side} geometry={geometry} rotation={[0, side < 0 ? Math.PI : 0, 0]}><GrainMaterial color="#c8cbc2" metalness={0.78} /></mesh>)}
    {[-1, 1].map(side => <group key={side} position={[side * (1.51 + (side > 0 ? flap * 0.75 : 0)), side > 0 ? flap * 0.38 : 0, 0]} rotation={[0, 0, side > 0 ? -flap * 0.6 : 0]}>
      <Body dimensions={[0.18, 1.88, 0.045]} color="#acb1a5" />
      {Array.from({ length: 32 }, (_, i) => <mesh key={i} position={[0, -0.88 + i * 0.056, 0.027]}><boxGeometry args={[0.17, 0.019, 0.017]} /><meshStandardMaterial color={i % 2 ? '#e1e5d9' : '#949b8d'} metalness={0.8} roughness={0.28} /></mesh>)}
    </group>)}
    <Caption title="cromix." position={[0, -0.04, 0.242]} width={1.85} size={0.4} color="#242820" />
    <group rotation={[0, Math.PI, 0]}><Caption title="TU MÚSICA, MÁS CERCA" position={[0, 0.05, 0.242]} width={1.85} color="#34382f" /></group>
  </>;
}
function FoilSeal() {
  // All forty crimps share one draw call instead of forty independent meshes.
  const ridges = useMemo(() => {
    const geometry = new THREE.BoxGeometry(0.018, 0.13, 0.012);
    const material = new THREE.MeshStandardMaterial({color:'#e1e6e9',metalness:0.85,roughness:0.3});
    const mesh = new THREE.InstancedMesh(geometry, material, 40);
    for (let i = 0; i < 40; i++) {
      mesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-1.025 + i * 0.0525, 0, 0.029));
      mesh.setColorAt(i, new THREE.Color(i % 2 ? '#e1e6e9' : '#68747e'));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }, []);
  useEffect(() => () => { ridges.geometry.dispose(); ridges.material.dispose(); ridges.dispose(); }, [ridges]);
  return <><Body dimensions={[2.12, 0.16, 0.04]} color="#aeb8c0" /><primitive object={ridges} /></>;
}
function FoilGlow({cut,direction,release,hint}:{cut:number;direction:1|-1;release:number;hint:boolean}) {
  const texture = useMemo(() => {
    const width=64,height=16,data=new Uint8Array(width*height*4);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const index=(y*width+x)*4;
      data[index]=232;data[index+1]=244;data[index+2]=255;
      data[index+3]=Math.round(255*Math.exp(-(((y-7.5)/3.3)**2+((x-31.5)/13)**2)));
    }
    const result=new THREE.DataTexture(data,width,height);result.needsUpdate=true;return result;
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <>
    <mesh position={[direction*(cut*2.1-1.05),1.18,0.24]} visible={(hint||cut>0)&&release<0.1}><planeGeometry args={[0.34,0.26]} /><meshBasicMaterial map={texture} transparent opacity={0.88} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
    <mesh position={[0,1.18,0.23]} visible={release>0&&release<0.95}><planeGeometry args={[2.1,0.24]} /><meshBasicMaterial map={texture} transparent opacity={Math.sin(release*Math.PI)*0.6} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
  </>;
}
function StandingFoil({ flap, cut, direction = 1, hint=false }: { flap: number; cut: number; direction?:1|-1;hint?:boolean }) {
  const surfaces = useMemo(() => {
    const make = (bottom: number, top: number) => {
      const geometry = new THREE.PlaneGeometry(2.1, top - bottom, bottom>0?80:24, Math.max(6, Math.round((top - bottom) * 12)));
      geometry.translate(0, (top + bottom) / 2, 0);
      const positions = geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i), y = positions.getY(i);
        const pillow = Math.pow(Math.max(0, 1 - (x / 1.05) ** 2), 0.55) * Math.pow(Math.max(0, 1 - (y / 1.4) ** 2), 0.55);
        const wrinkles = Math.sin(x * 41 + y * 14) * Math.cos(y * 32) * 0.016 * (1 - pillow);
        positions.setZ(i, pillow * 0.21 + wrinkles + (y>1.4 ? Math.sin((x+1.05)*Math.PI/0.0525)**2*0.024 : 0));
      }
      geometry.computeVertexNormals();
      if(bottom>0) {
        const shades=new Float32Array(positions.count*3);
        for(let i=0;i<positions.count;i++) {
          const y=positions.getY(i),rib=Math.round((positions.getX(i)+1.05)/0.02625)%2;
          const value=y>1.4?(rib?0.54:0.86):1;
          shades.set([value,value,value],i*3);
        }
        geometry.setAttribute('color',new THREE.BufferAttribute(shades,3));
      }
      return geometry;
    };
    return [make(-1.4, 1.18), make(1.18, 1.54)];
  }, []);
  const capVertices=useMemo(()=>Float32Array.from(surfaces[1].attributes.position.array),[surfaces]);
  useEffect(() => () => surfaces.forEach(surface => surface.dispose()), [surfaces]);
  useEffect(() => {
    const positions=surfaces[1].attributes.position;
    // Only the tiny cap is deformed; the larger foil body and textures are reused.
    for(let i=0;i<positions.count;i++) {
      const x=capVertices[i*3],y=capVertices[i*3+1],z=capVertices[i*3+2];
      const lift=foilTearLift(x,cut,direction);
      // Separate the lower edge as well as the embossed seal above it.
      positions.setY(i,y+lift*(0.12+(y-1.18)*0.08));
      positions.setZ(i,z+lift*(0.055+(y-1.18)*0.12));
    }
    // Three owns this GPU buffer; notify it after updating the existing vertices.
    // eslint-disable-next-line react-hooks/immutability
    positions.needsUpdate=true;surfaces[1].computeVertexNormals();
  },[cut,direction,surfaces,capVertices]);
  return <>
    {[1, -1].map(side => <mesh key={side} geometry={surfaces[0]} scale={[1, 1, side]}><GrainMaterial color="#c8d0d6" metalness={0.8} /></mesh>)}
    <group position={[flap * 0.65, flap * 0.8, flap * 0.25]} rotation={[-flap * 0.6, 0, -flap * 0.35]} visible={flap < 0.99}>
      {[1, -1].map(side => <mesh key={side} geometry={surfaces[1]} scale={[1, 1, side]}><GrainMaterial color="#c8d0d6" metalness={0.8} vertexColors /></mesh>)}
    </group>
    <group position={[0, -1.46, 0]}><FoilSeal /></group>
    <Caption title="Cromix." position={[0, -0.08, 0.219]} width={1.65} size={0.32} color="#1a2025" />
    <Caption title="TU MÚSICA, MÁS CERCA" position={[0, -0.48, 0.215]} width={1.36} size={0.07} color="#414b52" />
    <group rotation={[0, Math.PI, 0]}><Caption title="UNA CANCIÓN PARA TI" position={[0, 0, 0.219]} width={1.6} size={0.09} color="#343e46" /></group>
    <FoilGlow cut={cut} direction={direction} release={flap} hint={hint} />
    <mesh position={[direction*(cut-1)*1.05,1.18,0.135]} scale={[Math.max(0.001,cut),1,1]} visible={cut>0}><boxGeometry args={[2.08,0.022,0.16]} /><meshBasicMaterial color="#151b20" /></mesh>
  </>;
}
function ArtworkPrint({ texture, position, size, disc = false, inner = 0.09 }: { texture: THREE.Texture; position: [number, number, number]; size: number; disc?: boolean; inner?: number }) {
  const geometry = useMemo(() => {
    if (!disc) return new THREE.PlaneGeometry(size, size);
    const result = new THREE.RingGeometry(inner, size / 2, 64);
    const positions = result.attributes.position, uv = result.attributes.uv;
    for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / size + 0.5, positions.getY(i) / size + 0.5);
    return result;
  }, [size, disc, inner]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={position} geometry={geometry}><meshBasicMaterial map={texture} toneMapped={false} /></mesh>;
}
function Cassette({ title, tint, texture }: { title: string; tint: string; texture: THREE.Texture | null }) {
  const material=recordPalette(tint);
  return <>
    <Body dimensions={[3, 1.9, 0.32]} color={material.base} transparent />
    <Body dimensions={[2.85, 1.76, 0.025]} color={material.back} transparent position={[0, 0, -0.17]} />
    {[-0.72, 0.72].map(x => <group key={x} position={[x, -0.03, 0]}><Disc outer={0.57} inner={0.17} depth={0.085} color="#493729" metalness={0.1} /><mesh position={[0, 0, 0.06]}><ringGeometry args={[0.12, 0.23, 32]} /><meshStandardMaterial color="#babfb2" roughness={0.5} /></mesh></group>)}
    <Body dimensions={[2.7, 0.035, 0.04]} color="#76523b" position={[0, -0.68, 0]} />
    {[-1.4, 1.4].map(x => <Body key={x} dimensions={[0.055, 1.6, 0.25]} color={material.edge} transparent position={[x, 0, 0]} />)}
    {[-0.83, 0.83].map(y => <Body key={y} dimensions={[2.8, 0.055, 0.25]} color={material.edge} transparent position={[0, y, 0]} />)}
    {[1, -1].map(side => <group key={side} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
      <Body dimensions={[2.64, 1.02, 0.025]} color={material.label} position={[0, 0.3, 0.179]} />
      <Body dimensions={[2.58, 0.025, 0.007]} color={material.shadow} position={[0, -0.18, 0.195]} />
      {texture && <ArtworkPrint texture={texture} position={[-0.87, 0.32, 0.2]} size={0.68} />}
      <Caption title={title} position={[texture ? 0.42 : 0, 0.43, 0.204]} width={texture ? 1.62 : 2.35} color={material.ink} />
      <Caption title={`${side > 0 ? 'A' : 'B'}  /  CROMIX`} position={[texture ? 0.42 : 0, 0.13, 0.204]} width={1.2} color={material.ink} />
      <Body dimensions={[1.64, 0.32, 0.055]} color={material.edge} transparent position={[0, -0.68, 0.174]} />
      {[-1.18, 1.18].map(x => <group key={x} position={[x, -0.64, 0.09]}><Disc outer={0.14} inner={0.05} depth={0.1} color="#a2a99a" metalness={0.7} /></group>)}
      {[-0.53, 0.53].map(x => <mesh key={x} position={[x, -0.68, 0.209]}><ringGeometry args={[0.045, 0.072, 20]} /><meshStandardMaterial color="#acb3a1" metalness={0.6} /></mesh>)}
      {[-1.33, 1.33].flatMap(x => [-0.76, 0.76].map(y => <group key={`${x}${y}`} position={[x, y, 0.176]}><mesh><circleGeometry args={[0.05, 16]} /><meshStandardMaterial color="#b0b5a8" metalness={0.8} roughness={0.25} /></mesh><mesh position={[0, 0, 0.003]} rotation={[0, 0, 0.6]}><boxGeometry args={[0.066, 0.012, 0.005]} /><meshBasicMaterial color="#30332b" /></mesh></group>))}
    </group>)}
  </>;
}
function StudioReflections() {
  const environment = useMemo(() => {
    const width = 128, height = 64, data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const softbox = Math.exp(-(((x - 27) / 12) ** 2) - ((y - 24) / 19) ** 2);
      const rim = Math.exp(-(((x - 96) / 5) ** 2) - ((y - 30) / 24) ** 2);
      const value = Math.min(255, 32 + 210 * softbox + 165 * rim);
      const index = (y * width + x) * 4;
      data[index] = value; data[index + 1] = value; data[index + 2] = value; data[index + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, width, height);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => environment.dispose(), [environment]);
  return <primitive object={environment} attach="environment" />;
}
function CompactDisc({ title, tint, texture }: { title: string; tint: string; texture: THREE.Texture | null }) {
  return <>
    <Disc outer={DISC_RADIUS.CD} inner={CD_HUB_RADIUS} depth={0.04} color="#afb4b9" metalness={0.85} />
    <Disc outer={CD_HUB_RADIUS} inner={CD_HOLE_RADIUS} depth={0.038} color={tint} metalness={0.04} transparent />
    {texture ? <ArtworkPrint texture={texture} position={[0, 0, 0.022]} size={CD_PRINT_RADIUS * 2} disc inner={CD_HUB_RADIUS} /> : <>
      <mesh position={[0, 0, 0.021]}><ringGeometry args={[CD_HUB_RADIUS, CD_PRINT_RADIUS, 64]} /><meshStandardMaterial color={tint} roughness={0.45} /></mesh>
      <Caption title={title} position={[0, 0.6, 0.026]} width={1.4} color={labelInk(tint)} />
    </>}
    <group rotation={[0, Math.PI, 0]}>
      <mesh position={[0, 0, 0.022]}><ringGeometry args={[CD_HUB_RADIUS, DISC_RADIUS.CD - 0.008, 96]} /><CdReflectiveMaterial /></mesh>
      <Caption title="CROMIX · AUDIO" position={[0, -0.42, 0.025]} width={0.55} size={0.045} color="#596167" />
    </group>
    {[1, -1].map(side => <group key={side} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
      {[CD_HOLE_RADIUS + 0.013, CD_HUB_RADIUS - 0.025].map(radius => <mesh key={radius} position={[0, 0, 0.024]}><ringGeometry args={[radius, radius + 0.008, 64]} /><meshPhysicalMaterial color="#d3d8dc" transparent opacity={0.58} depthWrite={false} roughness={0.18} metalness={0.35} /></mesh>)}
    </group>)}
  </>;
}
function RecordObject({format,title,tint,texture}:{format:Format;title:string;tint:string;texture:THREE.Texture|null}) {
  const material=recordPalette(tint);
  return format === 'CASETE' ? <Cassette title={title} tint={tint} texture={texture} /> : format === 'MINIDISC' ? <>
        <Body dimensions={[2.25, 2.5, 0.27]} color={material.base} transparent />
        <Body dimensions={[2.09, 2.32, 0.02]} color={material.back} position={[0, 0, -0.13]} />
        <Body dimensions={[0.8, 1.4, 0.03]} color="#c9cdd3" position={[0.49, 0.52, 0.12]} />
        <mesh position={[-0.14, 0.13, 0.115]}><circleGeometry args={[0.76, 48]} /><GrainMaterial color={material.highlight} metalness={0.5} /></mesh>
        <Body dimensions={[1.85, 0.65, 0.025]} color={material.label} position={[0, -0.74, 0.12]} />
        {texture && <ArtworkPrint texture={texture} position={[-0.58, -0.74, 0.14]} size={0.48} />}
        <Caption title={title} position={[texture ? 0.27 : 0, -0.74, 0.143]} width={texture ? 1 : 1.6} color={material.ink} />
      </> : format === 'CD' ? <CompactDisc title={title} tint={tint} texture={texture} /> : <>
        <Disc outer={DISC_RADIUS.VINILO} inner={0.09} depth={0.065} color="#111216" metalness={0.3} />
        {Array.from({ length: 12 }, (_, index) => <mesh key={index} position={[0, 0, 0.035]}><ringGeometry args={[0.63 + index * 0.064, 0.64 + index * 0.064, 80]} /><meshStandardMaterial color="#514754" roughness={0.28} metalness={0.6} side={THREE.DoubleSide} /></mesh>)}
        {[1, -1].map(side => <group key={side} rotation={[0, side < 0 ? Math.PI : 0, 0]}>
          <mesh position={[0, 0, 0.037]}><ringGeometry args={[0.09, 0.58, 64]} /><GrainMaterial color={tint} /></mesh>
          {texture ? <ArtworkPrint texture={texture} position={[0, 0, 0.041]} size={1.15} disc inner={0.09} /> : <Caption title={title} position={[0, 0.29, 0.041]} width={0.95} color={labelInk(tint)} />}
          <Caption title={side > 0 ? 'A / CROMIX' : 'B / CROMIX'} position={[0, texture ? -1.4 : -0.28, 0.046]} width={0.69} color={texture ? '#d2d3cb' : labelInk(tint)} />
        </group>)}
      </>;
}
export function RecordScene({ format, title, albumUrl, tint = '#887565', rotation, envelope, daily = false, upright = false, cut = 0, cutHint=false, cutDirection=1, emergence=0, flap = 0 }: StageProps) {
  const texture = useArtworkTexture(albumUrl);
  const camera=useThree(state=>state.camera),invalidate=useThree(state=>state.invalidate);
  const size=useThree(state=>state.size);
  useEffect(()=>{
    if(!envelope||!upright)return;
    camera.position.setZ(foilCameraDistance(emergence,format,size.width/Math.max(1,size.height)));invalidate();
  },[camera,invalidate,envelope,upright,emergence,format,size.width,size.height]);
  const pose=emergingRecordPose(emergence);
  return <>
    <StudioReflections />
    <ambientLight intensity={1.4} /><directionalLight position={[3, 4, 5]} intensity={3} color="#fffaf0" /><directionalLight position={[-4, 1, -2]} intensity={2} color="#e5ebf0" /><pointLight position={[-3, 2, 4]} intensity={18} color="#ffffff" />
    <group rotation={rotation}>
      {envelope ? <>
        <group position={[0,-emergence*emergence*2.2,0]} visible={emergence<0.98}>{daily ? upright ? <StandingFoil flap={flap} cut={cut} direction={cutDirection} hint={cutHint} /> : <FoilWrapper flap={flap} /> : <PaperEnvelope type={envelope} flap={flap} />}</group>
        {!!title && <group visible={emergence>0} position={[0,pose.y,pose.z]} scale={pose.scale} rotation={[0.05,emergence<0.65?-0.12:(emergence-0.65)*0.7,0]}><RecordObject format={format} title={title} tint={tint} texture={texture} /></group>}
      </> : <RecordObject format={format} title={title} tint={tint} texture={texture} />}
    </group>
  </>;
}
