import {
  FaceLandmarker,
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import {
  ALL_BDSL_SIGNS,
  BDSL_ALPHABETS,
  BDSL_NUMBERS,
  BDSL_VOCABULARY,
  HAND_SHAPES,
  HAND_SHAPE_MAP,
} from '../data/bdslDataset';
import type {
  BdslSign,
  BodyZone,
  DetectedHandTelemetry,
  FingerDirection,
  HandShapeSpec,
  MediaPipeDetectionResult,
  MotionType,
  PalmOrientation,
} from '../types/signtalk';

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

interface WristSample {
  x: number;
  y: number;
  z: number;
  t: number;
}

interface FaceAnchors {
  forehead: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
  chin: { x: number; y: number };
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
  leftEar: { x: number; y: number };
  rightEar: { x: number; y: number };
  faceHeight: number;
}

function dist2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function dist3D(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function angleBetween(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v1z = (a.z ?? 0) - (b.z ?? 0);
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const v2z = (c.z ?? 0) - (b.z ?? 0);
  const mag1 = Math.hypot(v1x, v1y, v1z) || 1e-6;
  const mag2 = Math.hypot(v2x, v2y, v2z) || 1e-6;
  const dot = (v1x * v2x + v1y * v2y + v1z * v2z) / (mag1 * mag2);
  return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/**
 * Classifies 21 MediaPipe hand landmarks into one of the 33 PDF Hand Shapes.
 */
export function classifyHandShape33(landmarks: NormalizedLandmark[]): {
  shape: HandShapeSpec;
  confidence: number;
  extended: [boolean, boolean, boolean, boolean, boolean];
  pinchTI: number;
  spread: number;
} {
  const wrist = landmarks[0];
  const indexMCP = landmarks[5];
  const middleMCP = landmarks[9];
  const pinkyMCP = landmarks[17];
  const palmScale = Math.max(0.05, dist3D(wrist, middleMCP));

  // Finger extension via joint straightness + tip distance ratio
  const fingerTipIdx = [4, 8, 12, 16, 20];
  const fingerPipIdx = [3, 6, 10, 14, 18];
  const fingerMcpIdx = [2, 5, 9, 13, 17];

  const extendedScores = fingerTipIdx.map((tipI, fIdx) => {
    const tip = landmarks[tipI];
    const pip = landmarks[fingerPipIdx[fIdx]];
    const mcp = landmarks[fingerMcpIdx[fIdx]];

    if (fIdx === 0) {
      // Thumb: compare tip-to-pinkyMCP vs thumbIP-to-pinkyMCP and angle
      const tipToPinky = dist3D(tip, pinkyMCP) / palmScale;
      const thumbStraight = angleBetween(landmarks[1], landmarks[2], landmarks[3]);
      return tipToPinky > 1.08 && thumbStraight > 2.15 ? 1 : tipToPinky > 0.85 ? 0.55 : 0;
    }

    const tipToWrist = dist3D(tip, wrist);
    const pipToWrist = dist3D(pip, wrist);
    const pipAngle = angleBetween(mcp, pip, tip);
    const ratio = tipToWrist / Math.max(0.02, pipToWrist);
    if (ratio > 1.12 && pipAngle > 2.2) return 1;
    if (ratio > 0.96 && pipAngle > 1.65) return 0.5;
    return 0;
  });

  const extended: [boolean, boolean, boolean, boolean, boolean] = [
    extendedScores[0] >= 0.7,
    extendedScores[1] >= 0.7,
    extendedScores[2] >= 0.7,
    extendedScores[3] >= 0.7,
    extendedScores[4] >= 0.7,
  ];

  const pinchTI = dist3D(landmarks[4], landmarks[8]) / palmScale;
  const pinchTM = dist3D(landmarks[4], landmarks[12]) / palmScale;
  const indexMiddleGap = dist3D(landmarks[8], landmarks[12]) / palmScale;
  const middleRingGap = dist3D(landmarks[12], landmarks[16]) / palmScale;
  const spread = (indexMiddleGap + middleRingGap) * 0.5;

  const indexPipAngle = angleBetween(landmarks[5], landmarks[6], landmarks[7]);
  const indexDipAngle = angleBetween(landmarks[6], landmarks[7], landmarks[8]);
  const isIndexHooked = !extended[1] && indexPipAngle < 2.25 && indexDipAngle < 2.35 && dist3D(landmarks[8], wrist) / palmScale > 0.95;

  const isCurvedAll =
    extendedScores[1] >= 0.45 &&
    extendedScores[2] >= 0.45 &&
    extendedScores[3] >= 0.45 &&
    angleBetween(landmarks[5], landmarks[6], landmarks[8]) < 2.55;

  let bestShape = HAND_SHAPES[12]; // #13 Flat Hand default
  let bestScore = -1;

  for (const shape of HAND_SHAPES) {
    let score = 0;

    // 1. Match 5-finger extension pattern
    for (let f = 0; f < 5; f++) {
      if (shape.extendedPattern[f] === extended[f]) {
        score += 1.0;
      } else if (extendedScores[f] === 0.5) {
        score += 0.35;
      } else {
        score -= 0.75;
      }
    }

    // 2. Pinch bonuses
    if (shape.pinchThumbIndex) {
      if (pinchTI < 0.48) score += 2.1;
      else if (pinchTI < 0.72) score += 0.8;
      else score -= 1.0;
    }

    if (shape.pinchThumbMiddle) {
      if (pinchTM < 0.48) score += 2.0;
      else score -= 0.8;
    }

    // 3. Hooked index bonus (shapes 12, 27)
    if (shape.hookedIndex) {
      if (isIndexHooked) score += 2.0;
      else score -= 0.7;
    }

    // 4. Curved vs flat distinction
    if (shape.curvedHand) {
      if (isCurvedAll || (pinchTI >= 0.45 && pinchTI <= 0.95)) score += 1.1;
    } else if (extended[1] && extended[2] && extended[3] && extended[4]) {
      if (!isCurvedAll) score += 0.7;
    }

    // 5. Spread vs closed distinction (#14 vs #13, #28 vs #26)
    if (shape.spreadRequired) {
      if (spread > 0.42 || indexMiddleGap > 0.42) score += 1.4;
      else score -= 0.8;
    } else if (shape.id === 13 || shape.id === 26 || shape.id === 32) {
      if (indexMiddleGap < 0.36) score += 0.9;
    }

    // 6. Thumb tucked vs out (#32 vs #13 vs #14)
    if (shape.id === 32 && !extended[0] && extended[1] && extended[2] && extended[3] && extended[4]) {
      if (dist3D(landmarks[4], landmarks[9]) / palmScale < 0.55) score += 1.1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestShape = shape;
    }
  }

  const normalizedConf = Math.max(0.35, Math.min(0.99, (bestScore + 1.5) / 7.5));
  return {
    shape: bestShape,
    confidence: normalizedConf,
    extended,
    pinchTI,
    spread,
  };
}

function estimatePalmAndDirection(
  landmarks: NormalizedLandmark[],
  handedness: 'Right' | 'Left',
): { palm: PalmOrientation; direction: FingerDirection } {
  const wrist = landmarks[0];
  const indexMCP = landmarks[5];
  const middleMCP = landmarks[9];
  const pinkyMCP = landmarks[17];

  // Finger pointing vector
  const dx = middleMCP.x - wrist.x;
  const dy = middleMCP.y - wrist.y; // +y is down in normalized image coordinates
  const dz = (middleMCP.z ?? 0) - (wrist.z ?? 0);

  let direction: FingerDirection = 'up';
  if (Math.abs(dy) >= Math.abs(dx) && Math.abs(dy) >= Math.abs(dz)) {
    direction = dy < 0 ? 'up' : 'down';
  } else if (Math.abs(dx) >= Math.abs(dy) && Math.abs(dx) >= Math.abs(dz)) {
    if (handedness === 'Right') {
      direction = dx > 0 ? 'inward' : 'outward';
    } else {
      direction = dx < 0 ? 'inward' : 'outward';
    }
  } else {
    direction = dz < 0 ? 'front' : 'back';
  }

  // Palm normal via cross product
  const v1x = indexMCP.x - wrist.x;
  const v1y = indexMCP.y - wrist.y;
  const v1z = (indexMCP.z ?? 0) - (wrist.z ?? 0);
  const v2x = pinkyMCP.x - wrist.x;
  const v2y = pinkyMCP.y - wrist.y;
  const v2z = (pinkyMCP.z ?? 0) - (wrist.z ?? 0);

  let nx = v1y * v2z - v1z * v2y;
  let ny = v1z * v2x - v1x * v2z;
  let nz = v1x * v2y - v1y * v2x;
  if (handedness === 'Left') {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }

  let palm: PalmOrientation = 'front';
  const anx = Math.abs(nx);
  const any = Math.abs(ny);
  const anz = Math.abs(nz);
  if (anz >= anx && anz >= any) {
    palm = nz < 0 ? 'front' : 'back';
  } else if (any >= anx) {
    palm = ny < 0 ? 'up' : 'down';
  } else {
    palm = nx > 0 ? 'inward' : 'outward';
  }

  return { palm, direction };
}

function estimateBodyZone(
  landmarks: NormalizedLandmark[],
  faceAnchors: FaceAnchors | null,
): BodyZone {
  const refPoint = landmarks[8]; // Index tip is used for touching nose, ear, forehead, chin
  const palmCenter = landmarks[9];

  if (faceAnchors) {
    const fh = Math.max(0.12, faceAnchors.faceHeight);
    if (dist2D(refPoint, faceAnchors.nose) < fh * 0.25) return 'nose';
    if (dist2D(refPoint, faceAnchors.mouth) < fh * 0.28) return 'mouth';
    if (dist2D(refPoint, faceAnchors.chin) < fh * 0.3) return 'chin';
    if (
      dist2D(refPoint, faceAnchors.leftEar) < fh * 0.34 ||
      dist2D(refPoint, faceAnchors.rightEar) < fh * 0.34
    ) {
      return 'ear';
    }
    if (
      dist2D(refPoint, faceAnchors.leftCheek) < fh * 0.32 ||
      dist2D(refPoint, faceAnchors.rightCheek) < fh * 0.32
    ) {
      return 'cheek';
    }
    if (dist2D(refPoint, faceAnchors.forehead) < fh * 0.38) return 'forehead';
    if (palmCenter.y < faceAnchors.chin.y + fh * 0.15) return 'face';
    if (palmCenter.y < faceAnchors.chin.y + fh * 0.65) return 'shoulder';
    if (palmCenter.y < faceAnchors.chin.y + fh * 1.45) return 'chest';
    return 'waist';
  }

  // Proportional fallback if face landmarks are absent
  const y = palmCenter.y;
  if (y < 0.25) return 'forehead';
  if (y < 0.36) return 'nose';
  if (y < 0.45) return 'chin';
  if (y < 0.56) return 'shoulder';
  if (y < 0.78) return 'chest';
  return 'waist';
}

function estimateMotionFromHistory(history: WristSample[]): MotionType {
  if (history.length < 8) return 'static';
  const recent = history.slice(-22);
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  let pathLen = 0;
  for (let i = 0; i < recent.length; i++) {
    const p = recent[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    if (i > 0) {
      pathLen += Math.hypot(p.x - recent[i - 1].x, p.y - recent[i - 1].y);
    }
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const netDisp = Math.hypot(
    recent[recent.length - 1].x - recent[0].x,
    recent[recent.length - 1].y - recent[0].y,
  );

  if (pathLen < 0.045) return 'static';
  if (spanX > 0.08 && spanY > 0.08 && netDisp < pathLen * 0.42) return 'circle';
  if (spanX > spanY * 1.4 && netDisp < spanX * 0.8) return 'sideToSide';
  if (spanY > spanX * 1.4 && netDisp < spanY * 0.8) return 'tap2';

  const dy = recent[recent.length - 1].y - recent[0].y;
  if (Math.abs(dy) > 0.07) {
    return dy < 0 ? 'up' : 'down';
  }
  const dz = recent[recent.length - 1].z - recent[0].z;
  if (Math.abs(dz) > 0.04) {
    return dz < 0 ? 'forward' : 'backward';
  }
  return 'wave';
}

let tfliteLogPatched = false;

function installMediaPipeInfoLogFilter(): void {
  if (tfliteLogPatched || typeof console === 'undefined') return;
  tfliteLogPatched = true;
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (
      first.startsWith('INFO:') &&
      (first.includes('TensorFlow Lite') || first.includes('XNNPACK'))
    ) {
      console.info(...args);
      return;
    }
    origError(...args);
  };
}

export class MediaPipeSignEngine {
  private handLandmarker: HandLandmarker | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private wristHistoryRight: WristSample[] = [];
  private wristHistoryLeft: WristSample[] = [];
  private ready = false;
  private initializing: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.ready) return;
    if (this.initializing) return this.initializing;

    installMediaPipeInfoLogFilter();

    this.initializing = (async () => {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');

      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/api/mediapipe/models/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      } catch {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/api/mediapipe/models/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      }

      try {
        this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/api/mediapipe/models/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.45,
          minFacePresenceConfidence: 0.45,
        });
      } catch {
        // Face landmarks enhance nose/chin/ear anchor accuracy; graceful fallback works if unavailable
        this.faceLandmarker = null;
      }

      this.ready = true;
    })();

    return this.initializing;
  }

  public isReady(): boolean {
    return this.ready;
  }

  public resetHistory(): void {
    this.wristHistoryRight = [];
    this.wristHistoryLeft = [];
  }

  public detectVideoFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement | null,
    timestampMs: number,
    scopeFilter: 'all' | 'vocab' | 'numbers' | 'alphabets' | 'shapes' = 'all',
  ): MediaPipeDetectionResult {
    if (!this.handLandmarker || video.readyState < 2) {
      return {
        hands: [],
        matchedSign: null,
        confidence: 0,
        topCandidates: [],
        faceDetected: false,
      };
    }

    const handResult = this.handLandmarker.detectForVideo(video, timestampMs);
    let faceAnchors: FaceAnchors | null = null;
    if (this.faceLandmarker) {
      try {
        const faceRes = this.faceLandmarker.detectForVideo(video, timestampMs);
        if (faceRes.faceLandmarks && faceRes.faceLandmarks.length > 0) {
          const fl = faceRes.faceLandmarks[0];
          faceAnchors = {
            forehead: fl[10],
            nose: fl[1],
            mouth: fl[0],
            chin: fl[152],
            leftCheek: fl[234],
            rightCheek: fl[454],
            leftEar: fl[127],
            rightEar: fl[356],
            faceHeight: Math.max(0.12, dist2D(fl[10], fl[152])),
          };
        }
      } catch {
        faceAnchors = null;
      }
    }

    const hands: DetectedHandTelemetry[] = [];
    let rightShapeData: ReturnType<typeof classifyHandShape33> | null = null;
    let leftShapeData: ReturnType<typeof classifyHandShape33> | null = null;
    let rightZone: BodyZone = 'chest';
    let leftZone: BodyZone = 'chest';

    if (handResult.landmarks && handResult.landmarks.length > 0) {
      handResult.landmarks.forEach((lm, idx) => {
        const rawLabel = handResult.handednesses?.[idx]?.[0]?.categoryName ?? 'Right';
        // Mirror front camera handedness naturally
        const handedness: 'Right' | 'Left' = rawLabel === 'Left' ? 'Right' : 'Left';
        const classified = classifyHandShape33(lm);
        const { palm, direction } = estimatePalmAndDirection(lm, handedness);
        const zone = estimateBodyZone(lm, faceAnchors);

        const sample: WristSample = {
          x: lm[0].x,
          y: lm[0].y,
          z: lm[0].z ?? 0,
          t: timestampMs,
        };
        if (handedness === 'Right') {
          this.wristHistoryRight.push(sample);
          if (this.wristHistoryRight.length > 45) this.wristHistoryRight.shift();
          rightShapeData = classified;
          rightZone = zone;
        } else {
          this.wristHistoryLeft.push(sample);
          if (this.wristHistoryLeft.length > 45) this.wristHistoryLeft.shift();
          leftShapeData = classified;
          leftZone = zone;
        }

        const motion = estimateMotionFromHistory(
          handedness === 'Right' ? this.wristHistoryRight : this.wristHistoryLeft,
        );

        hands.push({
          handedness,
          shapeId: classified.shape.id,
          shapeBangla: classified.shape.banglaName,
          shapeEnglish: classified.shape.englishName,
          shapeConfidence: classified.confidence,
          palm,
          direction,
          zone,
          motion,
        });
      });
    }

    if (canvas) {
      this.drawOverlay(canvas, video, handResult.landmarks || [], faceAnchors, hands);
    }

    if (hands.length === 0) {
      return {
        hands: [],
        matchedSign: null,
        confidence: 0,
        topCandidates: [],
        faceDetected: Boolean(faceAnchors),
      };
    }

    const primaryRight = hands.find((h) => h.handedness === 'Right') || hands[0];
    const secondaryLeft = hands.length > 1 ? hands.find((h) => h !== primaryRight) : undefined;

    const pool: BdslSign[] =
      scopeFilter === 'vocab'
        ? BDSL_VOCABULARY
        : scopeFilter === 'numbers'
          ? BDSL_NUMBERS
          : scopeFilter === 'alphabets'
            ? BDSL_ALPHABETS
            : scopeFilter === 'shapes'
              ? ALL_BDSL_SIGNS.filter((s) => s.category === 'Hand Shapes')
              : [...BDSL_VOCABULARY, ...BDSL_NUMBERS, ...BDSL_ALPHABETS];

    const scored: Array<{ sign: BdslSign; score: number }> = pool.map((sign) => {
      let score = 0;

      // 1. Hand shape match (max 0.45)
      if (sign.rightHand.shapeId === primaryRight.shapeId) {
        score += 0.45 * primaryRight.shapeConfidence;
      } else {
        const targetShape = HAND_SHAPE_MAP.get(sign.rightHand.shapeId);
        const detectedShape = HAND_SHAPE_MAP.get(primaryRight.shapeId);
        if (targetShape && detectedShape) {
          let patternMatches = 0;
          for (let i = 0; i < 5; i++) {
            if (targetShape.extendedPattern[i] === detectedShape.extendedPattern[i]) {
              patternMatches += 1;
            }
          }
          score += (patternMatches / 5) * 0.25;
        }
      }

      // 2. Two-handed consistency (max 0.20)
      if (sign.twoHanded) {
        if (secondaryLeft) {
          score += 0.14;
          if (sign.leftHand && sign.leftHand.shapeId === secondaryLeft.shapeId) {
            score += 0.08;
          }
        } else {
          score -= 0.08;
        }
      } else if (!secondaryLeft) {
        score += 0.12;
      }

      // 3. Body/Face zone proximity (max 0.22)
      const zone = primaryRight.zone || rightZone || leftZone;
      if (sign.rightHand.zone === zone) {
        score += 0.22;
      } else if (
        (['nose', 'mouth', 'chin', 'cheek', 'ear', 'forehead', 'face'].includes(sign.rightHand.zone) &&
          ['nose', 'mouth', 'chin', 'cheek', 'ear', 'forehead', 'face'].includes(zone)) ||
        (['chest', 'shoulder', 'waist'].includes(sign.rightHand.zone) &&
          ['chest', 'shoulder', 'waist'].includes(zone))
      ) {
        score += 0.09;
      }

      // 4. Palm & direction match (max 0.13)
      if (sign.rightHand.palm === primaryRight.palm) score += 0.07;
      if (sign.rightHand.direction === primaryRight.direction) score += 0.06;

      // 5. Motion match (max 0.10)
      if (sign.rightHand.motion === primaryRight.motion) {
        score += 0.1;
      } else if (
        sign.rightHand.motion !== 'static' &&
        primaryRight.motion !== 'static'
      ) {
        score += 0.04;
      }

      // Suppress unused local warnings while keeping computed debug data available
      void rightShapeData;
      void leftShapeData;

      return { sign, score: Math.max(0, Math.min(0.99, score)) };
    });

    scored.sort((a, b) => b.score - a.score);
    const topCandidates = scored.slice(0, 4);
    const top = topCandidates[0];

    return {
      hands,
      matchedSign: top && top.score >= 0.48 ? top.sign : null,
      confidence: top ? top.score : 0,
      topCandidates,
      faceDetected: Boolean(faceAnchors),
    };
  }

  private drawOverlay(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    allHands: NormalizedLandmark[][],
    faceAnchors: FaceAnchors | null,
    telemetry: DetectedHandTelemetry[],
  ): void {
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    // Draw subtle face anatomical reference anchors (nose, mouth, chin, forehead, ears)
    if (faceAnchors) {
      const anchors = [
        faceAnchors.forehead,
        faceAnchors.nose,
        faceAnchors.mouth,
        faceAnchors.chin,
        faceAnchors.leftEar,
        faceAnchors.rightEar,
      ];
      ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
      for (const pt of anchors) {
        ctx.beginPath();
        ctx.arc(pt.x * w, pt.y * h, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    allHands.forEach((landmarks, idx) => {
      const isPrimary = idx === 0;
      const strokeColor = isPrimary ? '#38bdf8' : '#f43f5e';
      const jointColor = isPrimary ? '#e0f2fe' : '#ffe4e6';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (const [a, b] of HAND_CONNECTIONS) {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        ctx.beginPath();
        ctx.moveTo(p1.x * w, p1.y * h);
        ctx.lineTo(p2.x * w, p2.y * h);
        ctx.stroke();
      }

      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        const radius = i === 4 || i === 8 || i === 12 || i === 16 || i === 20 ? 4.5 : 3;
        ctx.fillStyle = jointColor;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      const info = telemetry[idx];
      if (info) {
        const wrist = landmarks[0];
        const label = `#${info.shapeId} ${info.shapeEnglish}`;
        ctx.save();
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        const textW = ctx.measureText(label).width;
        const bx = Math.max(8, Math.min(w - textW - 20, wrist.x * w - textW / 2));
        const by = Math.min(h - 14, wrist.y * h + 24);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
        ctx.fillRect(bx - 6, by - 14, textW + 12, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(label, bx, by);
        ctx.restore();
      }
    });
  }
}
