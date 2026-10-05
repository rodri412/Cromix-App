import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';

// A radial diffraction approximation, evaluated only when the demand renderer
// draws (e.g. while dragging). No time uniform, texture downloads or render loop.
export default function CdReflectiveMaterial() {
  const material = useMemo(() => {
    const result = new THREE.MeshPhysicalMaterial({ color: '#b4bbc0', metalness: 0.92, roughness: 0.2, envMapIntensity: 1.5, clearcoat: 0.7, clearcoatRoughness: 0.12 });
    result.customProgramCacheKey = () => 'cromix-cd-radial-reflection-v3';
    result.onBeforeCompile = shader => {
      const declarations = `varying vec3 vCdWorldPosition; varying vec3 vCdRadial; varying vec3 vCdNormal;\n`;
      shader.vertexShader = declarations + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        vCdWorldPosition = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vCdRadial = normalize(mat3(modelMatrix) * vec3(position.xy, 0.0));
        vCdNormal = normalize(mat3(modelMatrix) * normal);
      `);
      shader.fragmentShader = declarations + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        vec3 cdN = normalize(vCdNormal);
        vec3 cdR = normalize(vCdRadial);
        vec3 cdV = normalize(cameraPosition - vCdWorldPosition);
        vec3 cdL = normalize(vec3(-3.0, 2.0, 4.0) - vCdWorldPosition);
        vec3 cdL2 = normalize(vec3(3.0, 4.0, 5.0) - vCdWorldPosition);
        vec3 cdH = cdV + cdL;
        vec3 cdH2 = cdV + cdL2;
        vec3 cdPlanar = cdH - cdN * dot(cdH, cdN);
        vec3 cdPlanar2 = cdH2 - cdN * dot(cdH2, cdN);
        float cdBeam = pow(abs(dot(cdR, cdPlanar / max(length(cdPlanar), 0.001))), 20.0);
        float cdBeam2 = pow(abs(dot(cdR, cdPlanar2 / max(length(cdPlanar2), 0.001))), 28.0);
        vec3 cdAxis = cdPlanar / max(length(cdPlanar), 0.001);
        float cdAngle = atan(dot(cross(cdAxis, cdR), cdN), dot(cdAxis, cdR));
        float cdPhase = cdAngle * 1.8 + dot(cdN, cdV) * 0.45;
        vec3 cdSpectrum = 0.5 + 0.5 * cos(6.2831853 * (cdPhase + vec3(0.0, 0.33, 0.67)));
        float cdGlare = clamp(0.025 + cdBeam * 0.9 + cdBeam2 * 0.45, 0.0, 0.95);
        outgoingLight = mix(outgoingLight * 0.85, outgoingLight * (0.3 + cdSpectrum * 1.4) + cdSpectrum * 0.32, cdGlare);
        #include <opaque_fragment>
      `);
    };
    return result;
  }, []);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}
