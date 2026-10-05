import type { Format } from './types';

export function foilTearLift(x:number,cut:number,direction:1|-1) {
  if(cut>=1)return 1;
  const u=direction===1?(x+1.05)/2.1:(1.05-x)/2.1;
  const t=Math.max(0,Math.min(1,(cut-u)/0.1));
  return t*t*(3-2*t);
}

export function emergingRecordPose(progress:number) {
  const p=Math.max(0,Math.min(1,progress));
  return {
    y:p<0.65?p*2.4:1.56*(1-(p-0.65)/0.35),
    z:p<0.6?-0.12:-0.12+(p-0.6)*1.5,
    scale:p<0.65?0.62:0.62+(p-0.65)/0.35*0.38,
  };
}

// Fit the whole object, including its forward movement, inside the viewport.
export function foilCameraDistance(progress:number,format:Format,aspect:number,fov=42) {
  const pose=emergingRecordPose(progress);
  const halfWidth=format==='CASETE'?1.65:format==='MINIDISC'?1.28:1.54;
  const halfHeight=format==='CASETE'?1.15:format==='MINIDISC'?1.36:1.54;
  const tangent=Math.tan(fov*Math.PI/360);
  const fit=Math.max(halfWidth*pose.scale/Math.max(0.1,aspect),Math.abs(pose.y)+halfHeight*pose.scale)*1.16/tangent;
  return Math.max(4.8+2*Math.sin(progress*Math.PI)+0.4*progress,pose.z+0.25+fit);
}
