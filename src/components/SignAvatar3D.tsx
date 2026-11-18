import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { HAND_SHAPE_MAP } from '../data/bdslDataset';
import type {
  BodyZone,
  FingerDirection,
  FingerRigPose,
  HandPoseSpec,
  MotionType,
  PalmOrientation,
  SignSequenceStep,
} from '../types/signtalk';

interface SignAvatar3DProps {
  steps: SignSequenceStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.35 | 0.6 | 1.0
  onStepComplete?: () => void;
  highlightSignName?: string;
}

interface FingerBones {
  proximal: THREE.Group;
  middle: THREE.Group;
  distal: THREE.Group;
  baseSpreadZ: number;
}

interface ArmRig {
  side: 'right' | 'left';
  shoulderPos: THREE.Vector3;
  upperArm: THREE.Group;
  forearm: THREE.Group;
  wrist: THREE.Group;
  handRoot: THREE.Group;
  thumbBase: THREE.Group;
  thumbProx: THREE.Group;
  thumbDist: THREE.Group;
  fingers: FingerBones[];
}

const UPPER_LEN = 0.27;
const FORE_LEN = 0.25;

// Reusable module-scope math objects (zero GC in render loop)
const _targetPos = new THREE.Vector3();
const _shoulderToTarget = new THREE.Vector3();
const _poleDir = new THREE.Vector3();
const _elbowPos = new THREE.Vector3();
const _upperDir = new THREE.Vector3();
const _foreDir = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, -1, 0);
const _quatA = new THREE.Quaternion();
const _quatB = new THREE.Quaternion();
const _euler = new THREE.Euler();

const ZONE_ANCHORS_RIGHT: Record<BodyZone, [number, number, number]> = {
  waist: [0.15, 0.74, 0.21],
  chest: [0.13, 1.0, 0.26],
  shoulder: [0.21, 1.19, 0.2],
  chin: [0.055, 1.32, 0.22],
  mouth: [0.04, 1.36, 0.235],
  nose: [0.03, 1.4, 0.245],
  cheek: [0.095, 1.38, 0.21],
  ear: [0.135, 1.41, 0.08],
  forehead: [0.085, 1.48, 0.2],
  head: [0.135, 1.49, 0.14],
  face: [0.065, 1.39, 0.255],
};

function getZoneAnchor(zone: BodyZone, side: 'right' | 'left', out: THREE.Vector3): THREE.Vector3 {
  const base = ZONE_ANCHORS_RIGHT[zone] || ZONE_ANCHORS_RIGHT.chest;
  const xSign = side === 'right' ? 1 : -1;
  out.set(-base[0] * xSign, base[1], base[2]);
  return out;
}

function getTargetWristEuler(
  palm: PalmOrientation,
  direction: FingerDirection,
  side: 'right' | 'left',
  out: THREE.Euler,
): THREE.Euler {
  const s = side === 'right' ? 1 : -1;
  let rx = 0;
  let ry = 0;
  let rz = 0;

  if (direction === 'up') {
    rx = 0;
  } else if (direction === 'down') {
    rx = Math.PI;
  } else if (direction === 'front') {
    rx = Math.PI * 0.48;
  } else if (direction === 'back') {
    rx = -Math.PI * 0.45;
  } else if (direction === 'inward') {
    rz = -Math.PI * 0.48 * s;
  } else if (direction === 'outward') {
    rz = Math.PI * 0.48 * s;
  } else if (direction === 'facing') {
    rz = -Math.PI * 0.42 * s;
  }

  if (palm === 'front') {
    ry = 0;
  } else if (palm === 'back') {
    ry = Math.PI;
  } else if (palm === 'inward' || palm === 'facing') {
    ry = -Math.PI * 0.5 * s;
  } else if (palm === 'outward') {
    ry = Math.PI * 0.5 * s;
  } else if (palm === 'down') {
    if (direction === 'front') ry = 0;
    else if (direction === 'inward') rx = Math.PI * 0.45;
    else ry = Math.PI * 0.85;
  } else if (palm === 'up') {
    if (direction === 'front') {
      rx = Math.PI * 0.48;
      ry = Math.PI;
    } else {
      ry = Math.PI * 0.5 * s;
    }
  }

  out.set(rx, ry, rz, 'YXZ');
  return out;
}

function applyMotionOffset(
  motion: MotionType,
  phase: number,
  side: 'right' | 'left',
  pos: THREE.Vector3,
  euler: THREE.Euler,
): number {
  const s = side === 'right' ? 1 : -1;
  const tau = Math.PI * 2;
  let morphProgress = 0;

  switch (motion) {
    case 'circle':
    case 'circle2': {
      const cycles = motion === 'circle2' ? 2 : 1;
      const a = phase * tau * cycles;
      pos.x += Math.cos(a) * 0.07 * s;
      pos.z += Math.sin(a) * 0.055;
      pos.y += Math.sin(a) * 0.028;
      break;
    }
    case 'tap2':
    case 'tap3': {
      const taps = motion === 'tap3' ? 3 : 2;
      const wave = Math.abs(Math.sin(phase * Math.PI * taps));
      pos.z -= wave * 0.04;
      pos.y -= wave * 0.022;
      break;
    }
    case 'forward': {
      const p = Math.sin(phase * Math.PI);
      pos.z += p * 0.13;
      break;
    }
    case 'backward': {
      const p = Math.sin(phase * Math.PI);
      pos.z -= p * 0.1;
      pos.y += p * 0.045;
      break;
    }
    case 'up': {
      const p = Math.sin(phase * Math.PI);
      pos.y += p * 0.13;
      break;
    }
    case 'down': {
      const p = Math.sin(phase * Math.PI);
      pos.y -= p * 0.12;
      morphProgress = Math.min(1, phase * 1.4);
      break;
    }
    case 'upDown': {
      const wave = Math.sin(phase * tau * 2);
      pos.y += wave * 0.05;
      break;
    }
    case 'sideToSide': {
      const wave = Math.sin(phase * tau * 1.5);
      pos.x += wave * 0.085 * s;
      break;
    }
    case 'arcOut': {
      const a = phase * Math.PI;
      pos.x -= Math.sin(a) * 0.11 * s;
      pos.y += Math.sin(a) * 0.065;
      pos.z += Math.sin(a) * 0.055;
      morphProgress = Math.min(1, phase * 1.3);
      break;
    }
    case 'arcIn': {
      const a = phase * Math.PI;
      pos.x += Math.sin(a) * 0.095 * s;
      pos.z += Math.sin(a) * 0.045;
      break;
    }
    case 'spreadOut': {
      const p = Math.sin(phase * Math.PI);
      pos.x -= p * 0.13 * s;
      morphProgress = Math.min(1, phase * 1.3);
      break;
    }
    case 'comeTogether': {
      const p = Math.sin(phase * Math.PI);
      pos.x += (1 - p) * 0.085 * s;
      break;
    }
    case 'wristTwist': {
      const tw = Math.sin(phase * tau);
      euler.y += tw * 0.72 * s;
      morphProgress = Math.min(1, phase * 1.3);
      break;
    }
    case 'shake': {
      const vib = Math.sin(phase * tau * 4);
      pos.x += vib * 0.022;
      pos.y += Math.cos(phase * tau * 4) * 0.014;
      break;
    }
    case 'rectDraw': {
      const seg = phase * 4;
      const r = 0.07;
      if (seg < 1) {
        pos.x -= seg * r * s;
      } else if (seg < 2) {
        pos.x -= r * s;
        pos.y -= (seg - 1) * r;
      } else if (seg < 3) {
        pos.x -= (1 - (seg - 2)) * r * s;
        pos.y -= r;
      } else {
        pos.y -= (1 - (seg - 3)) * r;
      }
      break;
    }
    case 'xDraw': {
      if (phase < 0.5) {
        const t = phase * 2;
        pos.x += 0.055 - t * 0.11;
        pos.y += 0.055 - t * 0.11;
      } else {
        const t = (phase - 0.5) * 2;
        pos.x += -0.055 + t * 0.11;
        pos.y += 0.055 - t * 0.11;
      }
      break;
    }
    case 'morph': {
      morphProgress = (Math.sin(phase * Math.PI - Math.PI / 2) + 1) * 0.5;
      pos.z += Math.sin(phase * Math.PI) * 0.038;
      break;
    }
    case 'wave': {
      euler.z += Math.sin(phase * tau * 2) * 0.24;
      break;
    }
    default:
      break;
  }
  return morphProgress;
}

function solveTwoBoneIK(
  shoulderPos: THREE.Vector3,
  targetWristPos: THREE.Vector3,
  side: 'right' | 'left',
  upperArm: THREE.Group,
  forearm: THREE.Group,
): void {
  _shoulderToTarget.subVectors(targetWristPos, shoulderPos);
  const rawDist = _shoulderToTarget.length();
  const maxReach = UPPER_LEN + FORE_LEN - 0.015;
  const minReach = 0.1;
  const d = Math.max(minReach, Math.min(maxReach, rawDist));

  if (rawDist > 1e-4) {
    _shoulderToTarget.multiplyScalar(1 / rawDist);
  } else {
    _shoulderToTarget.set(0, -1, 0);
  }

  const cosAngle = Math.max(
    -1,
    Math.min(1, (UPPER_LEN * UPPER_LEN + d * d - FORE_LEN * FORE_LEN) / (2 * UPPER_LEN * d)),
  );
  const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle));

  const s = side === 'right' ? 1 : -1;
  _poleDir.set(-0.66 * s, -0.76, -0.25).normalize();
  const dot = _poleDir.dot(_shoulderToTarget);
  _poleDir.addScaledVector(_shoulderToTarget, -dot);
  if (_poleDir.lengthSq() < 1e-4) {
    _poleDir.set(-1 * s, 0, 0);
  } else {
    _poleDir.normalize();
  }

  _elbowPos
    .copy(shoulderPos)
    .addScaledVector(_shoulderToTarget, UPPER_LEN * cosAngle)
    .addScaledVector(_poleDir, UPPER_LEN * sinAngle);

  _upperDir.subVectors(_elbowPos, shoulderPos).normalize();
  _foreDir.subVectors(targetWristPos, _elbowPos).normalize();

  upperArm.position.copy(shoulderPos);
  _quatA.setFromUnitVectors(_upAxis, _upperDir);
  upperArm.quaternion.copy(_quatA);

  forearm.position.set(0, -UPPER_LEN, 0);
  _quatB.copy(_quatA).invert();
  _foreDir.applyQuaternion(_quatB).normalize();
  forearm.quaternion.setFromUnitVectors(_upAxis, _foreDir);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function createPortraitFaceTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d99e7c';
  ctx.fillRect(0, 0, w, h);

  const toXY = (phiOffset: number, theta: number): [number, number] => {
    const u = 0.5 + phiOffset / (Math.PI * 2);
    const v = 1 - theta / Math.PI;
    return [u * w, (1 - v) * h];
  };

  const [fx, fy] = toXY(0, 1.32);
  const foreGrad = ctx.createRadialGradient(fx, fy, 10, fx, fy, 130);
  foreGrad.addColorStop(0, 'rgba(236, 186, 155, 0.55)');
  foreGrad.addColorStop(1, 'rgba(236, 186, 155, 0)');
  ctx.fillStyle = foreGrad;
  ctx.fillRect(0, 0, w, h);

  const [jx, jy] = toXY(0, 2.35);
  const jawGrad = ctx.createRadialGradient(jx, jy, 15, jx, jy, 180);
  jawGrad.addColorStop(0, 'rgba(182, 118, 86, 0.35)');
  jawGrad.addColorStop(1, 'rgba(182, 118, 86, 0)');
  ctx.fillStyle = jawGrad;
  ctx.fillRect(0, 0, w, h);

  [-0.39, 0.39].forEach((phi) => {
    const [cx, cy] = toXY(phi, 1.73);
    const blush = ctx.createRadialGradient(cx, cy, 4, cx, cy, 62);
    blush.addColorStop(0, 'rgba(214, 114, 102, 0.34)');
    blush.addColorStop(1, 'rgba(214, 114, 102, 0)');
    ctx.fillStyle = blush;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();
  });

  [-0.3, 0.3].forEach((phi) => {
    const [ex, ey] = toXY(phi, 1.49);
    const eyeShade = ctx.createRadialGradient(ex, ey - 3, 4, ex, ey, 36);
    eyeShade.addColorStop(0, 'rgba(130, 78, 58, 0.36)');
    eyeShade.addColorStop(0.65, 'rgba(155, 96, 72, 0.14)');
    eyeShade.addColorStop(1, 'rgba(155, 96, 72, 0)');
    ctx.fillStyle = eyeShade;
    ctx.beginPath();
    ctx.ellipse(ex, ey, 38, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  [-1, 1].forEach((side) => {
    const [bx0, by0] = toXY(side * 0.14, 1.35);
    const [bx1, by1] = toXY(side * 0.29, 1.315);
    const [bx2, by2] = toXY(side * 0.42, 1.355);
    ctx.save();
    ctx.strokeStyle = 'rgba(34, 22, 18, 0.88)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(bx0, by0);
    ctx.quadraticCurveTo(bx1, by1, bx2, by2);
    ctx.stroke();
    ctx.restore();
  });

  const [lx, ly] = toXY(0, 1.98);
  ctx.save();
  ctx.fillStyle = 'rgba(176, 86, 82, 0.85)';
  ctx.beginPath();
  ctx.moveTo(lx - 32, ly + 2);
  ctx.quadraticCurveTo(lx - 13, ly - 9, lx, ly - 4);
  ctx.quadraticCurveTo(lx + 13, ly - 9, lx + 32, ly + 2);
  ctx.quadraticCurveTo(lx, ly + 6, lx - 32, ly + 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(192, 98, 92, 0.84)';
  ctx.beginPath();
  ctx.moveTo(lx - 29, ly + 3);
  ctx.quadraticCurveTo(lx, ly + 19, lx + 29, ly + 3);
  ctx.quadraticCurveTo(lx, ly + 6, lx - 29, ly + 3);
  ctx.fill();

  ctx.strokeStyle = 'rgba(110, 48, 46, 0.62)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(lx - 31, ly + 2);
  ctx.quadraticCurveTo(lx, ly + 5, lx + 31, ly + 2);
  ctx.stroke();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createIrisTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;

  ctx.fillStyle = '#f8f6f2';
  ctx.fillRect(0, 0, size, size);

  const irisRadius = size * 0.145;
  const grad = ctx.createRadialGradient(c, c, 4, c, c, irisRadius);
  grad.addColorStop(0, '#120b08');
  grad.addColorStop(0.32, '#2e1b11');
  grad.addColorStop(0.78, '#523120');
  grad.addColorStop(1, '#1c100a');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c, c, irisRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(136, 90, 56, 0.35)';
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 6, c + Math.sin(a) * 6);
    ctx.lineTo(c + Math.cos(a) * (irisRadius * 0.9), c + Math.sin(a) * (irisRadius * 0.9));
    ctx.stroke();
  }

  ctx.fillStyle = '#070606';
  ctx.beginPath();
  ctx.arc(c, c, size * 0.062, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createFabricTexture(baseHex: string, weaveHex: string, maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = weaveHex;
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createHairTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#14100f';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 240; i++) {
    const x = (i / 240) * size;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(58, 41, 32, 0.45)' : 'rgba(18, 13, 11, 0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 4, size * 0.33, x - 4, size * 0.66, x, size);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createSculptedFemaleHeadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 64, 48, -Math.PI * 0.5, Math.PI * 2);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const lowerT = smoothstep(0.12, -0.88, y);
    x *= 1 - 0.3 * lowerT;
    z *= 1 - 0.14 * lowerT;

    if (z > 0.25) {
      z -= 0.045 * smoothstep(0.25, 0.9, z) * smoothstep(0.65, -0.65, y);
    }

    if (z > 0.45) {
      const leftSocket = Math.exp(-((x - 0.28) ** 2) / 0.025 - ((y - 0.08) ** 2) / 0.016);
      const rightSocket = Math.exp(-((x + 0.28) ** 2) / 0.025 - ((y - 0.08) ** 2) / 0.016);
      z -= 0.075 * (leftSocket + rightSocket);

      const leftCheek = Math.exp(-((x - 0.41) ** 2) / 0.04 - ((y + 0.13) ** 2) / 0.032);
      const rightCheek = Math.exp(-((x + 0.41) ** 2) / 0.04 - ((y + 0.13) ** 2) / 0.032);
      z += 0.055 * (leftCheek + rightCheek);
      x += 0.03 * (leftCheek - rightCheek);

      const bridge = Math.exp(-(x ** 2) / 0.009 - ((y + 0.04) ** 2) / 0.038);
      const tip = Math.exp(-(x ** 2) / 0.01 - ((y + 0.2) ** 2) / 0.008);
      const wings =
        Math.exp(-((x - 0.095) ** 2) / 0.005 - ((y + 0.22) ** 2) / 0.005) +
        Math.exp(-((x + 0.095) ** 2) / 0.005 - ((y + 0.22) ** 2) / 0.005);
      z += 0.125 * bridge + 0.165 * tip + 0.045 * wings;

      const upperLip = Math.exp(-(x ** 2) / 0.032 - ((y + 0.37) ** 2) / 0.0036);
      const lowerLip = Math.exp(-(x ** 2) / 0.026 - ((y + 0.435) ** 2) / 0.0044);
      const mouthCrease = Math.exp(-(x ** 2) / 0.034 - ((y + 0.402) ** 2) / 0.0008);
      z += 0.068 * upperLip + 0.062 * lowerLip - 0.035 * mouthCrease;

      const chinLift = Math.exp(-(x ** 2) / 0.045 - ((y + 0.67) ** 2) / 0.024);
      z += 0.07 * chinLift;
    }

    pos.setXYZ(i, x * 0.081, y * 0.107, z * 0.093);
  }

  geo.computeVertexNormals();
  return geo;
}

function createLoftedFemaleTorsoGeometry(): THREE.BufferGeometry {
  const rings: Array<{ y: number; rx: number; rz: number; zOffset: number }> = [
    { y: 0.56, rx: 0.145, rz: 0.102, zOffset: -0.005 },
    { y: 0.72, rx: 0.118, rz: 0.088, zOffset: 0.0 },
    { y: 0.88, rx: 0.138, rz: 0.105, zOffset: 0.008 },
    { y: 1.01, rx: 0.162, rz: 0.122, zOffset: 0.015 },
    { y: 1.13, rx: 0.178, rz: 0.106, zOffset: 0.005 },
    { y: 1.205, rx: 0.186, rz: 0.084, zOffset: -0.005 },
    { y: 1.245, rx: 0.072, rz: 0.058, zOffset: 0.0 },
  ];

  const segs = 40;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  rings.forEach((r, ri) => {
    const v = ri / (rings.length - 1);
    for (let si = 0; si <= segs; si++) {
      const u = si / segs;
      const theta = u * Math.PI * 2 - Math.PI * 0.5;
      const x = Math.cos(theta) * r.rx;
      let z = Math.sin(theta) * r.rz + r.zOffset;
      let y = r.y;

      if (ri === 3 && Math.sin(theta) > 0) {
        const front = Math.sin(theta);
        const twin = Math.abs(Math.cos(theta));
        z += 0.014 * front * (0.4 + 0.6 * twin);
      }
      if (ri === 5) {
        y -= Math.abs(Math.cos(theta)) * 0.028;
      }
      if (ri === 6 && Math.sin(theta) > 0.3) {
        y -= 0.01 * Math.sin(theta);
      }

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  });

  const stride = segs + 1;
  for (let ri = 0; ri < rings.length - 1; ri++) {
    for (let si = 0; si < segs; si++) {
      const a = ri * stride + si;
      const b = a + 1;
      const c = (ri + 1) * stride + si;
      const d = c + 1;
      indices.push(a, d, b, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSculptedPalmGeometry(): THREE.BufferGeometry {
  const w = 0.029;
  const h = 0.072;
  const shape = new THREE.Shape();
  shape.moveTo(-w * 0.72, 0.004);
  shape.quadraticCurveTo(-w * 0.96, h * 0.45, -w * 0.88, h * 0.92);
  shape.quadraticCurveTo(0, h * 1.02, w * 0.88, h * 0.92);
  shape.quadraticCurveTo(w * 0.96, h * 0.45, w * 0.72, 0.004);
  shape.quadraticCurveTo(0, -0.006, -w * 0.72, 0.004);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.0045,
    bevelSize: 0.0038,
    bevelSegments: 4,
    curveSegments: 12,
  });
  geo.translate(0, 0, -0.006);
  return geo;
}

function buildArmRig(
  side: 'right' | 'left',
  skinMat: THREE.Material,
  nailMat: THREE.Material,
  sleeveMat: THREE.Material,
  cuffMat: THREE.Material,
  palmGeo: THREE.BufferGeometry,
): ArmRig {
  const s = side === 'right' ? 1 : -1;
  const shoulderPos = new THREE.Vector3(-0.185 * s, 1.195, -0.006);

  const upperArm = new THREE.Group();
  const sleeveMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.038, UPPER_LEN - 0.015, 22),
    sleeveMat,
  );
  sleeveMesh.position.y = -UPPER_LEN * 0.5;
  sleeveMesh.castShadow = true;
  upperArm.add(sleeveMesh);

  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.049, 18, 16), sleeveMat);
  shoulderCap.castShadow = true;
  upperArm.add(shoulderCap);

  const elbowSleeve = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 14), sleeveMat);
  elbowSleeve.position.y = -UPPER_LEN;
  upperArm.add(elbowSleeve);

  const forearm = new THREE.Group();
  forearm.position.y = -UPPER_LEN;

  const foreSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.037, 0.033, FORE_LEN * 0.54, 20),
    sleeveMat,
  );
  foreSleeve.position.y = -FORE_LEN * 0.27;
  foreSleeve.castShadow = true;
  forearm.add(foreSleeve);

  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.0335, 0.032, 0.022, 20), cuffMat);
  cuff.position.y = -FORE_LEN * 0.56;
  forearm.add(cuff);

  const foreSkin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0285, 0.0215, FORE_LEN * 0.44, 20),
    skinMat,
  );
  foreSkin.position.y = -FORE_LEN * 0.78;
  foreSkin.castShadow = true;
  forearm.add(foreSkin);

  const wrist = new THREE.Group();
  wrist.position.y = -FORE_LEN;
  forearm.add(wrist);

  const handRoot = new THREE.Group();
  wrist.add(handRoot);

  const palmMesh = new THREE.Mesh(palmGeo, skinMat);
  palmMesh.castShadow = true;
  handRoot.add(palmMesh);

  const wristBridge = new THREE.Mesh(new THREE.SphereGeometry(0.0205, 14, 14), skinMat);
  wristBridge.scale.set(1.06, 0.85, 0.62);
  handRoot.add(wristBridge);

  const thumbBase = new THREE.Group();
  thumbBase.position.set(0.029 * s, 0.02, 0.009);
  handRoot.add(thumbBase);

  const thumbMeta = new THREE.Mesh(new THREE.CapsuleGeometry(0.0088, 0.02, 8, 12), skinMat);
  thumbMeta.position.y = 0.014;
  thumbBase.add(thumbMeta);

  const thumbProx = new THREE.Group();
  thumbProx.position.y = 0.028;
  thumbBase.add(thumbProx);

  const thumbProxMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.019, 8, 12), skinMat);
  thumbProxMesh.position.y = 0.013;
  thumbProx.add(thumbProxMesh);

  const thumbDist = new THREE.Group();
  thumbDist.position.y = 0.025;
  thumbProx.add(thumbDist);

  const thumbDistMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.0072, 0.015, 8, 12), skinMat);
  thumbDistMesh.position.y = 0.01;
  thumbDist.add(thumbDistMesh);

  const thumbNail = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 8, 8), nailMat);
  thumbNail.scale.set(0.92, 1.3, 0.35);
  thumbNail.position.set(0, 0.018, -0.0055);
  thumbDist.add(thumbNail);

  const fingerSpecs = [
    { x: 0.021 * s, len: [0.034, 0.023, 0.017], r: 0.0078, baseSpreadZ: 0.13 * s },
    { x: 0.007 * s, len: [0.039, 0.026, 0.019], r: 0.008, baseSpreadZ: 0.04 * s },
    { x: -0.0075 * s, len: [0.036, 0.024, 0.017], r: 0.0076, baseSpreadZ: -0.05 * s },
    { x: -0.021 * s, len: [0.028, 0.019, 0.014], r: 0.0068, baseSpreadZ: -0.13 * s },
  ];

  const fingers: FingerBones[] = fingerSpecs.map((spec) => {
    const proximal = new THREE.Group();
    proximal.position.set(spec.x, 0.075, 0);
    handRoot.add(proximal);

    const pMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(spec.r, spec.len[0] - spec.r, 8, 12),
      skinMat,
    );
    pMesh.position.y = spec.len[0] * 0.5;
    pMesh.castShadow = true;
    proximal.add(pMesh);

    const middle = new THREE.Group();
    middle.position.y = spec.len[0];
    proximal.add(middle);

    const mMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(spec.r * 0.88, spec.len[1] - spec.r * 0.75, 8, 12),
      skinMat,
    );
    mMesh.position.y = spec.len[1] * 0.5;
    middle.add(mMesh);

    const distal = new THREE.Group();
    distal.position.y = spec.len[1];
    middle.add(distal);

    const dMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(spec.r * 0.78, spec.len[2] - spec.r * 0.75, 8, 12),
      skinMat,
    );
    dMesh.position.y = spec.len[2] * 0.5;
    distal.add(dMesh);

    const nail = new THREE.Mesh(new THREE.SphereGeometry(spec.r * 0.62, 8, 8), nailMat);
    nail.scale.set(0.9, 1.32, 0.32);
    nail.position.set(0, spec.len[2] * 0.72, -spec.r * 0.55);
    distal.add(nail);

    return { proximal, middle, distal, baseSpreadZ: spec.baseSpreadZ };
  });

  upperArm.add(forearm);

  return {
    side,
    shoulderPos,
    upperArm,
    forearm,
    wrist,
    handRoot,
    thumbBase,
    thumbProx,
    thumbDist,
    fingers,
  };
}

function dampHandFingers(arm: ArmRig, rig: FingerRigPose, dt: number): void {
  const s = arm.side === 'right' ? 1 : -1;
  const lambda = 12;

  const curls = [rig.index, rig.middle, rig.ring, rig.pinky];
  const mcpBend = rig.mcpBend ?? 0;

  arm.fingers.forEach((f, idx) => {
    const c = curls[idx];
    const targetProxX = mcpBend > 0.1 ? mcpBend * 1.25 : c * 1.35;
    const targetMidX = mcpBend > 0.4 ? c * 0.45 : c * 1.55;
    const targetDistX = mcpBend > 0.4 ? c * 0.3 : c * 1.1;
    const targetSpreadZ = f.baseSpreadZ * (0.15 + rig.spread * 0.95);

    f.proximal.rotation.x = THREE.MathUtils.damp(f.proximal.rotation.x, targetProxX, lambda, dt);
    f.proximal.rotation.z = THREE.MathUtils.damp(f.proximal.rotation.z, -targetSpreadZ, lambda, dt);
    f.middle.rotation.x = THREE.MathUtils.damp(f.middle.rotation.x, targetMidX, lambda, dt);
    f.distal.rotation.x = THREE.MathUtils.damp(f.distal.rotation.x, targetDistX, lambda, dt);
  });

  const thumbBaseZ = (-0.55 + rig.thumbOpposed * 0.5) * s;
  const thumbBaseX = 0.25 + rig.thumbOpposed * 0.55;
  arm.thumbBase.rotation.z = THREE.MathUtils.damp(arm.thumbBase.rotation.z, thumbBaseZ, lambda, dt);
  arm.thumbBase.rotation.x = THREE.MathUtils.damp(arm.thumbBase.rotation.x, thumbBaseX, lambda, dt);
  arm.thumbProx.rotation.x = THREE.MathUtils.damp(arm.thumbProx.rotation.x, rig.thumb * 0.95, lambda, dt);
  arm.thumbDist.rotation.x = THREE.MathUtils.damp(arm.thumbDist.rotation.x, rig.thumb * 1.15, lambda, dt);
}

export function SignAvatar3D({
  steps,
  currentStepIndex,
  isPlaying,
  playbackSpeed,
  onStepComplete,
}: SignAvatar3DProps) {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);

  const stateRef = useRef({
    steps,
    currentStepIndex,
    isPlaying,
    playbackSpeed,
    onStepComplete,
    cyclePhase: 0,
    lastStepId: '',
  });

  stateRef.current.steps = steps;
  stateRef.current.currentStepIndex = currentStepIndex;
  stateRef.current.isPlaying = isPlaying;
  stateRef.current.playbackSpeed = playbackSpeed;
  stateRef.current.onStepComplete = onStepComplete;

  useEffect(() => {
    const step = steps[currentStepIndex];
    const nextId = step ? `${step.id}_${currentStepIndex}` : '';
    if (nextId !== stateRef.current.lastStepId) {
      stateRef.current.lastStepId = nextId;
      stateRef.current.cyclePhase = 0;
    }
  }, [steps, currentStepIndex]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL is unavailable in this browser context.');
      return;
    }

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 480;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1624);
    scene.fog = new THREE.FogExp2(0x0f1624, 0.055);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 30-deg portrait framing positioned slightly right of top-left explainer overlay
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 30);
    camera.position.set(0, 1.24, 1.66);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-0.08, 1.15, 0.04);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.85;
    controls.maxDistance = 2.4;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.minPolarAngle = Math.PI * 0.25;
    controls.update();

    const hemi = new THREE.HemisphereLight(0xfff1e6, 0x1e293b, 0.68);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e8, 1.38);
    keyLight.position.set(1.35, 2.25, 2.4);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -1.1;
      keyLight.shadow.camera.right = 1.1;
      keyLight.shadow.camera.top = 1.8;
      keyLight.shadow.camera.bottom = -0.4;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.52);
    fillLight.position.set(-1.5, 1.55, 1.6);
    scene.add(fillLight);

    const hairRimLight = new THREE.DirectionalLight(0xfde68a, 0.62);
    hairRimLight.position.set(-1.1, 2.05, -1.5);
    scene.add(hairRimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softbox = new THREE.RectAreaLight(0xfff7ed, 2.2, 1.6, 1.8);
      softbox.position.set(0.95, 1.45, 1.85);
      softbox.lookAt(0, 1.25, 0);
      scene.add(softbox);
    }

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d1320,
      roughness: 0.82,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 48), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const backdropMat = new THREE.MeshStandardMaterial({
      color: 0x162033,
      roughness: 0.92,
      metalness: 0.03,
    });
    const backdrop = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 2.6, 40, 1, true, Math.PI * 0.7, Math.PI * 0.6),
      backdropMat,
    );
    backdrop.material.side = THREE.BackSide;
    backdrop.position.set(0, 1.3, 0);
    scene.add(backdrop);

    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1a2436,
      roughness: 0.55,
      metalness: 0.25,
    });
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.05, 40), pedestalMat);
    pedestal.position.y = 0.025;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const faceTex = createPortraitFaceTexture(maxAniso);
    const irisTex = createIrisTexture(maxAniso);
    const blazerTex = createFabricTexture('#1e3a4c', 'rgba(255,255,255,0.035)', maxAniso);
    const scarfTex = createFabricTexture('#e8dfd5', 'rgba(180,145,115,0.09)', maxAniso);
    const hairTex = createHairTexture(maxAniso);

    const character = new THREE.Group();
    character.position.y = 0.05;
    scene.add(character);

    const faceMat = new THREE.MeshPhysicalMaterial({
      map: faceTex,
      roughness: 0.56,
      metalness: 0.0,
      sheen: 0.35,
      sheenRoughness: 0.72,
      sheenColor: new THREE.Color(0xf9d6c1),
    });
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: 0xd99e7c,
      roughness: 0.55,
      metalness: 0.0,
      sheen: 0.32,
      sheenRoughness: 0.72,
      sheenColor: new THREE.Color(0xf9d6c1),
    });
    const nailMat = new THREE.MeshStandardMaterial({
      color: 0xf1d5c5,
      roughness: 0.3,
      metalness: 0.02,
    });
    const blazerMat = new THREE.MeshPhysicalMaterial({
      map: blazerTex,
      roughness: 0.76,
      metalness: 0.03,
      sheen: 0.65,
      sheenRoughness: 0.68,
      sheenColor: new THREE.Color(0x6495a8),
    });
    const blouseMat = new THREE.MeshPhysicalMaterial({
      map: scarfTex,
      roughness: 0.62,
      metalness: 0.02,
      sheen: 0.55,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color(0xfff7ed),
    });
    const hairMat = new THREE.MeshPhysicalMaterial({
      map: hairTex,
      roughness: 0.44,
      metalness: 0.05,
      sheen: 0.65,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(0x4a3529),
    });
    const eyeballMat = new THREE.MeshPhysicalMaterial({
      map: irisTex,
      roughness: 0.14,
      metalness: 0.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.08,
    });
    const trouserMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.84,
      metalness: 0.03,
    });

    const lowerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.138, 0.165, 0.58, 32),
      trouserMat,
    );
    lowerBody.position.y = 0.29;
    lowerBody.scale.set(1.04, 1, 0.74);
    lowerBody.castShadow = true;
    character.add(lowerBody);

    const torsoGeo = createLoftedFemaleTorsoGeometry();
    const torso = new THREE.Mesh(torsoGeo, blazerMat);
    torso.castShadow = true;
    torso.receiveShadow = true;
    character.add(torso);

    const blouseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.075, 1.225, 0.03),
      new THREE.Vector3(-0.042, 1.12, 0.105),
      new THREE.Vector3(0.0, 1.03, 0.118),
      new THREE.Vector3(0.042, 1.12, 0.105),
      new THREE.Vector3(0.075, 1.225, 0.03),
    ]);
    const blouseTrim = new THREE.Mesh(
      new THREE.TubeGeometry(blouseCurve, 28, 0.014, 12, false),
      blouseMat,
    );
    character.add(blouseTrim);

    const drapeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, 1.21, -0.05),
      new THREE.Vector3(0.14, 1.19, 0.06),
      new THREE.Vector3(0.08, 1.06, 0.125),
      new THREE.Vector3(0.04, 0.86, 0.115),
    ]);
    const drapeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(drapeCurve, 24, 0.024, 12, false),
      blouseMat,
    );
    drapeMesh.scale.set(1.25, 1, 0.55);
    drapeMesh.castShadow = true;
    character.add(drapeMesh);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.047, 0.125, 24), skinMat);
    neck.position.set(0, 1.275, 0.004);
    neck.castShadow = true;
    character.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.4, 0.016);
    character.add(headGroup);

    const headGeo = createSculptedFemaleHeadGeometry();
    const headMesh = new THREE.Mesh(headGeo, faceMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    const eyelids: THREE.Mesh[] = [];
    [-1, 1].forEach((sideSign) => {
      const ex = 0.0227 * sideSign;
      const ey = 0.0086;
      const ez = 0.0725;

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 20, 18), eyeballMat);
      eye.rotation.y = -Math.PI / 2;
      eye.position.set(ex, ey, ez);
      headGroup.add(eye);

      const lid = new THREE.Mesh(
        new THREE.SphereGeometry(0.0128, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
        skinMat,
      );
      lid.position.set(ex, ey, ez);
      lid.rotation.x = -0.62;
      headGroup.add(lid);
      eyelids.push(lid);
    });

    const earGeo = new THREE.SphereGeometry(0.016, 14, 14);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.scale.set(0.36, 1.18, 0.68);
    leftEar.position.set(0.078, -0.004, -0.004);
    const rightEar = leftEar.clone();
    rightEar.position.x = -0.078;
    headGroup.add(leftEar, rightEar);

    const earringMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.2,
      metalness: 0.6,
    });
    const earringGeo = new THREE.SphereGeometry(0.0045, 10, 10);
    const leftEarring = new THREE.Mesh(earringGeo, earringMat);
    leftEarring.position.set(0.081, -0.018, 0.001);
    const rightEarring = leftEarring.clone();
    rightEarring.position.x = -0.081;
    headGroup.add(leftEarring, rightEarring);

    const hairCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat,
    );
    hairCrown.scale.set(0.89, 1.07, 1.01);
    hairCrown.rotation.x = -0.28;
    hairCrown.position.set(0, 0.018, -0.009);
    headGroup.add(hairCrown);

    [-1, 1].forEach((sideSign) => {
      const waveCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.014 * sideSign, 0.096, 0.056),
        new THREE.Vector3(0.068 * sideSign, 0.052, 0.048),
        new THREE.Vector3(0.082 * sideSign, -0.025, 0.018),
        new THREE.Vector3(0.076 * sideSign, -0.11, -0.015),
      ]);
      const waveGeo = new THREE.TubeGeometry(waveCurve, 22, 0.026, 12, false);
      const waveMesh = new THREE.Mesh(waveGeo, hairMat);
      waveMesh.scale.set(0.85, 1, 1.08);
      waveMesh.castShadow = true;
      headGroup.add(waveMesh);
    });

    const backHair = new THREE.Mesh(
      new THREE.CylinderGeometry(0.082, 0.098, 0.24, 24, 1, false, Math.PI * 0.6, Math.PI * 0.8),
      hairMat,
    );
    backHair.scale.set(1.06, 1, 0.72);
    backHair.position.set(0, -0.09, -0.032);
    backHair.castShadow = true;
    headGroup.add(backHair);

    const palmGeo = createSculptedPalmGeometry();
    const rightArm = buildArmRig('right', skinMat, nailMat, blazerMat, blouseMat, palmGeo);
    const leftArm = buildArmRig('left', skinMat, nailMat, blazerMat, blouseMat, palmGeo);
    character.add(rightArm.upperArm, leftArm.upperArm);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth || 640;
      const nh = mount.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    resizeObserver?.observe(mount);

    const restRight: HandPoseSpec = {
      shapeId: 14,
      palm: 'inward',
      direction: 'down',
      zone: 'waist',
      motion: 'static',
    };
    const restLeft: HandPoseSpec = {
      shapeId: 14,
      palm: 'inward',
      direction: 'down',
      zone: 'waist',
      motion: 'static',
    };

    const currentRightPos = new THREE.Vector3(-0.2, 0.74, 0.16);
    const currentLeftPos = new THREE.Vector3(0.2, 0.74, 0.16);
    const currentRightQuat = new THREE.Quaternion();
    const currentLeftQuat = new THREE.Quaternion();

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const status = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (status === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function updateArm(
      arm: ArmRig,
      spec: HandPoseSpec,
      phase: number,
      dt: number,
      curPos: THREE.Vector3,
      curQuat: THREE.Quaternion,
      isActive: boolean,
    ) {
      getZoneAnchor(spec.zone, arm.side, _targetPos);
      if (spec.offset) {
        const s = arm.side === 'right' ? 1 : -1;
        _targetPos.x -= spec.offset[0] * s;
        _targetPos.y += spec.offset[1];
        _targetPos.z += spec.offset[2];
      }

      getTargetWristEuler(spec.palm, spec.direction, arm.side, _euler);
      const morphT = applyMotionOffset(spec.motion, phase, arm.side, _targetPos, _euler);

      const posLambda = isActive ? 7.5 : 5.5;
      curPos.x = THREE.MathUtils.damp(curPos.x, _targetPos.x, posLambda, dt);
      curPos.y = THREE.MathUtils.damp(curPos.y, _targetPos.y, posLambda, dt);
      curPos.z = THREE.MathUtils.damp(curPos.z, _targetPos.z, posLambda, dt);

      if (!isActive) {
        curPos.y += Math.sin(clock.elapsedTime * 1.55) * 0.001;
      }

      solveTwoBoneIK(arm.shoulderPos, curPos, arm.side, arm.upperArm, arm.forearm);

      _quatA.setFromEuler(_euler);
      curQuat.slerp(_quatA, 1 - Math.exp(-9 * dt));
      arm.upperArm.updateMatrixWorld(true);
      arm.forearm.getWorldQuaternion(_quatB).invert();
      arm.wrist.quaternion.copy(_quatB).multiply(curQuat);

      const activeShapeId =
        spec.endShapeId && morphT > 0.45 ? spec.endShapeId : spec.shapeId;
      const shapeSpec = HAND_SHAPE_MAP.get(activeShapeId) || HAND_SHAPE_MAP.get(13)!;
      dampHandFingers(arm, shapeSpec.rig, dt);
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(0.08, clock.getDelta());
      const elapsed = clock.elapsedTime;
      const st = stateRef.current;
      const activeStep = st.steps[st.currentStepIndex];

      if (activeStep && st.isPlaying) {
        const baseDurationSec = 2.6;
        st.cyclePhase += (dt * st.playbackSpeed) / baseDurationSec;
        if (st.cyclePhase >= 1) {
          st.cyclePhase = 0;
          if (st.onStepComplete) {
            st.onStepComplete();
          }
        }
      }

      const rSpec = activeStep ? activeStep.sign.rightHand : restRight;
      const lSpec =
        activeStep && activeStep.sign.twoHanded && activeStep.sign.leftHand
          ? activeStep.sign.leftHand
          : restLeft;

      updateArm(
        rightArm,
        rSpec,
        st.cyclePhase,
        dt,
        currentRightPos,
        currentRightQuat,
        Boolean(activeStep),
      );
      updateArm(
        leftArm,
        lSpec,
        st.cyclePhase,
        dt,
        currentLeftPos,
        currentLeftQuat,
        Boolean(activeStep && activeStep.sign.twoHanded),
      );

      const breath = Math.sin(elapsed * 1.45) * 0.0035;
      torso.scale.y = 1 + breath * 1.4;

      const headPitch = activeStep
        ? Math.sin(st.cyclePhase * Math.PI) * 0.045
        : Math.sin(elapsed * 0.85) * 0.015;
      const headYaw = activeStep
        ? Math.sin(st.cyclePhase * Math.PI * 2) * 0.04
        : Math.sin(elapsed * 0.4) * 0.02;
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, headPitch, 5, dt);
      headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, headYaw, 5, dt);

      const blinkCycle = elapsed % 3.6;
      const blinkAmt = blinkCycle < 0.14 ? Math.sin((blinkCycle / 0.14) * Math.PI) : 0;
      eyelids.forEach((lid) => {
        lid.rotation.x = -0.62 + blinkAmt * 1.25;
      });

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      controls.dispose();
      headGeo.dispose();
      torsoGeo.dispose();
      palmGeo.dispose();
      faceTex.dispose();
      irisTex.dispose();
      blazerTex.dispose();
      scarfTex.dispose();
      hairTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (webglError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-6 text-center">
        <p className="text-base font-semibold">3D AI Interpreter Stage Unavailable</p>
        <p className="text-sm text-slate-400 mt-1">{webglError}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0f1624]">
      <div ref={canvasMountRef} className="w-full h-full" />
    </div>
  );
}
