export type PalmOrientation =
  | 'up'
  | 'down'
  | 'inward'
  | 'outward'
  | 'front'
  | 'back'
  | 'facing';

export type FingerDirection =
  | 'up'
  | 'down'
  | 'inward'
  | 'outward'
  | 'front'
  | 'back'
  | 'facing';

export type BodyZone =
  | 'waist'
  | 'chest'
  | 'shoulder'
  | 'chin'
  | 'mouth'
  | 'nose'
  | 'cheek'
  | 'ear'
  | 'forehead'
  | 'head'
  | 'face';

export type MotionType =
  | 'static'
  | 'circle'
  | 'circle2'
  | 'tap2'
  | 'tap3'
  | 'forward'
  | 'backward'
  | 'up'
  | 'down'
  | 'upDown'
  | 'sideToSide'
  | 'arcOut'
  | 'arcIn'
  | 'wave'
  | 'shake'
  | 'crossOut'
  | 'rectDraw'
  | 'xDraw'
  | 'morph'
  | 'spreadOut'
  | 'comeTogether'
  | 'wristTwist';

export interface FingerRigPose {
  /** 0 = straight, 1 = fully curled into palm */
  thumb: number;
  index: number;
  middle: number;
  ring: number;
  pinky: number;
  /** Thumb abduction/opposition: 0 = tucked against side, 1 = opposed forward/across */
  thumbOpposed: number;
  /** Finger splay: 0 = closed together, 1 = wide open */
  spread: number;
  /** Optional MCP bend without PIP curl (for flat-bent / parallel bent hands) */
  mcpBend?: number;
}

export interface HandShapeSpec {
  id: number;
  banglaName: string;
  englishName: string;
  pdfPage: number;
  rig: FingerRigPose;
  /** Extended finger booleans [thumb, index, middle, ring, pinky] for MediaPipe matching */
  extendedPattern: [boolean, boolean, boolean, boolean, boolean];
  pinchThumbIndex?: boolean;
  pinchThumbMiddle?: boolean;
  hookedIndex?: boolean;
  curvedHand?: boolean;
  spreadRequired?: boolean;
}

export interface HandPoseSpec {
  shapeId: number;
  endShapeId?: number;
  palm: PalmOrientation;
  direction: FingerDirection;
  zone: BodyZone;
  offset?: [number, number, number];
  motion: MotionType;
}

export type SignCategory =
  | 'Family & People'
  | 'Time & Days'
  | 'Pronouns & Questions'
  | 'Actions & Verbs'
  | 'Feelings & Qualities'
  | 'Objects & Home'
  | 'Media & Tech'
  | 'Medical & Care'
  | 'Legal & Advisory'
  | 'Numbers'
  | 'Alphabets'
  | 'Hand Shapes';

export interface BdslSign {
  id: string;
  bangla: string;
  english: string;
  synonyms: string[];
  category: SignCategory;
  pdfPage: number;
  pdfDescription: string;
  englishExplanation: string;
  twoHanded: boolean;
  rightHand: HandPoseSpec;
  leftHand?: HandPoseSpec;
}

export interface SignSequenceStep {
  id: string;
  sign: BdslSign;
  spokenToken: string;
  explanationBn: string;
  explanationEn: string;
}

export interface TranscriptMessage {
  id: string;
  role: 'speaker' | 'signer';
  timestamp: string;
  banglaText: string;
  englishText: string;
  originalText: string;
  signSteps: SignSequenceStep[];
  confidence?: number;
  source: 'voice' | 'text' | 'mediapipe' | 'image' | 'practice' | 'call-demo';
  callerLabel?: string;
}

export interface DetectedHandTelemetry {
  handedness: 'Right' | 'Left';
  shapeId: number;
  shapeBangla: string;
  shapeEnglish: string;
  shapeConfidence: number;
  palm: PalmOrientation;
  direction: FingerDirection;
  zone: BodyZone;
  motion: MotionType;
}

export interface MediaPipeDetectionResult {
  hands: DetectedHandTelemetry[];
  matchedSign: BdslSign | null;
  confidence: number;
  topCandidates: Array<{ sign: BdslSign; score: number }>;
  faceDetected: boolean;
}
