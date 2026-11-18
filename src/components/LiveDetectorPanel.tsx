import {
  Camera,
  CameraOff,
  CheckCircle2,
  Hand,
  ImagePlus,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BDSL_NUMBERS,
  BDSL_VOCABULARY,
  SIGN_BY_ID,
} from '../data/bdslDataset';
import type {
  BdslSign,
  MediaPipeDetectionResult,
  SignSequenceStep,
} from '../types/signtalk';
import { MediaPipeSignEngine } from '../utils/mediapipeSignDetector';

interface LiveDetectorPanelProps {
  practiceTarget: BdslSign | null;
  onClearPracticeTarget: () => void;
  onEmitBanglaSentence: (payload: {
    tokens: BdslSign[];
    banglaText: string;
    englishText: string;
    confidence: number;
    source: 'mediapipe' | 'image';
  }) => void;
  onPreviewSignOn3D: (steps: SignSequenceStep[]) => void;
  autoSpeakBangla: boolean;
  onToggleAutoSpeak: () => void;
  liveSessionTrigger?: number;
  isMinimized?: boolean;
  isExpanded?: boolean;
  onToggleMinimize?: () => void;
  latestWatchMessage?: {
    role: 'speaker' | 'signer';
    callerLabel?: string;
    banglaText: string;
    englishText: string;
  } | null;
  liveSpokenInterim?: string;
}

export function LiveDetectorPanel({
  practiceTarget,
  onClearPracticeTarget,
  onEmitBanglaSentence,
  onPreviewSignOn3D,
  autoSpeakBangla,
  onToggleAutoSpeak,
  liveSessionTrigger = 0,
  isMinimized = false,
  isExpanded = false,
  onToggleMinimize,
  latestWatchMessage,
  liveSpokenInterim = '',
}: LiveDetectorPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const engineRef = useRef<MediaPipeSignEngine | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [scope, setScope] = useState<'all' | 'vocab' | 'numbers' | 'alphabets' | 'shapes'>('all');
  const [autoCommit, setAutoCommit] = useState(true);
  const [autoSendOnPause, setAutoSendOnPause] = useState(true);
  const [pauseProgress, setPauseProgress] = useState(0);

  const [detection, setDetection] = useState<MediaPipeDetectionResult>({
    hands: [],
    matchedSign: null,
    confidence: 0,
    topCandidates: [],
    faceDetected: false,
  });

  const [signBuffer, setSignBuffer] = useState<BdslSign[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [imageAnalyzing, setImageAnalyzing] = useState(false);

  const signBufferRef = useRef<BdslSign[]>([]);
  signBufferRef.current = signBuffer;
  const isComposingRef = useRef(false);
  isComposingRef.current = isComposing;

  // Stability lock tracking so a sign held ~750ms commits cleanly without jitter
  const stabilityRef = useRef<{ signId: string; startMs: number; committed: boolean }>({
    signId: '',
    startMs: 0,
    committed: false,
  });
  const lastSignOrHandMsRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setPauseProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const appendSignToBuffer = useCallback((sign: BdslSign) => {
    lastSignOrHandMsRef.current = performance.now();
    setPauseProgress(0);
    setSignBuffer((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.id === sign.id && prev.length > 0) {
        return prev;
      }
      return [...prev.slice(-11), sign];
    });
  }, []);

  const commitBuffer = useCallback(async () => {
    const currentBuf = signBufferRef.current;
    if (currentBuf.length === 0 || isComposingRef.current) return;

    setIsComposing(true);
    setPauseProgress(0);
    try {
      const tokens = currentBuf.map((s) => s.bangla);
      const res = await fetch('/api/compose-bangla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      const data = (await res.json()) as { banglaText?: string; englishText?: string };
      const banglaText = data.banglaText || tokens.join(' ');
      const englishText = data.englishText || currentBuf.map((s) => s.english).join(' ');

      onEmitBanglaSentence({
        tokens: currentBuf,
        banglaText,
        englishText,
        confidence: detection.confidence || 0.86,
        source: 'mediapipe',
      });
      setSignBuffer([]);
    } catch {
      onEmitBanglaSentence({
        tokens: currentBuf,
        banglaText: currentBuf.map((s) => s.bangla).join(' '),
        englishText: currentBuf.map((s) => s.english).join(' '),
        confidence: 0.8,
        source: 'mediapipe',
      });
      setSignBuffer([]);
    } finally {
      setIsComposing(false);
    }
  }, [detection.confidence, onEmitBanglaSentence]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setLoadingModel(true);
    try {
      if (!engineRef.current) {
        engineRef.current = new MediaPipeSignEngine();
      }
      await engineRef.current.init();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      engineRef.current.resetHistory();
      lastSignOrHandMsRef.current = performance.now();
      setCameraActive(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not access webcam or initialize MediaPipe.';
      setCameraError(msg);
      stopCamera();
    } finally {
      setLoadingModel(false);
    }
  }, [stopCamera]);

  const prevLiveTriggerRef = useRef(0);
  useEffect(() => {
    if (liveSessionTrigger > prevLiveTriggerRef.current) {
      prevLiveTriggerRef.current = liveSessionTrigger;
      if (!cameraActive && !loadingModel) {
        startCamera();
      }
    }
  }, [liveSessionTrigger, cameraActive, loadingModel, startCamera]);

  useEffect(() => {
    if (!cameraActive) return;

    let lastDetectTime = 0;
    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (now - lastDetectTime < 55) return; // ~18 FPS detection for smooth UI
      lastDetectTime = now;

      const video = videoRef.current;
      const engine = engineRef.current;
      if (!video || !engine || !engine.isReady() || video.readyState < 2) return;

      const result = engine.detectVideoFrame(video, canvasRef.current, now, scope);
      setDetection(result);

      if (result.matchedSign && result.confidence >= 0.52) {
        lastSignOrHandMsRef.current = now;
        setPauseProgress(0);
        const st = stabilityRef.current;
        if (st.signId === result.matchedSign.id) {
          if (autoCommit && !st.committed && now - st.startMs > 780) {
            st.committed = true;
            appendSignToBuffer(result.matchedSign);
          }
        } else {
          stabilityRef.current = {
            signId: result.matchedSign.id,
            startMs: now,
            committed: false,
          };
        }
      } else {
        stabilityRef.current = { signId: '', startMs: 0, committed: false };
        // Auto-convert to Bangla after 1.8s pause (hands lowered or between signs)
        if (
          autoSendOnPause &&
          signBufferRef.current.length > 0 &&
          !isComposingRef.current &&
          result.hands.length === 0
        ) {
          const elapsedPause = now - lastSignOrHandMsRef.current;
          const pct = Math.min(1, elapsedPause / 1800);
          setPauseProgress(pct);
          if (elapsedPause >= 1800) {
            commitBuffer();
          }
        } else {
          if (result.hands.length > 0) {
            lastSignOrHandMsRef.current = now;
          }
          setPauseProgress(0);
        }
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraActive, scope, autoCommit, autoSendOnPause, appendSignToBuffer, commitBuffer]);

  const handleCommitBufferToBangla = () => {
    commitBuffer();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageAnalyzing(true);
    setCameraError(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const availableSigns = [...BDSL_VOCABULARY, ...BDSL_NUMBERS.slice(0, 12)].map((s) => ({
        id: s.id,
        bangla: s.bangla,
        english: s.english,
        desc: s.pdfDescription,
      }));

      const res = await fetch('/api/interpret-sign-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg',
          availableSigns,
        }),
      });
      const data = (await res.json()) as {
        signId?: string;
        bangla?: string;
        english?: string;
        confidence?: number;
        observationBn?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        setCameraError(data.error || 'Could not analyze uploaded sign image.');
        return;
      }

      const matched = data.signId ? SIGN_BY_ID.get(data.signId) : undefined;
      if (matched) {
        appendSignToBuffer(matched);
        onPreviewSignOn3D([
          {
            id: `img_${Date.now()}`,
            sign: matched,
            spokenToken: matched.bangla,
            explanationBn: data.observationBn || matched.pdfDescription,
            explanationEn: matched.englishExplanation,
          },
        ]);
      } else if (data.bangla) {
        onEmitBanglaSentence({
          tokens: [],
          banglaText: data.bangla,
          englishText: data.english || data.bangla,
          confidence: data.confidence || 0.78,
          source: 'image',
        });
      }
    } catch {
      setCameraError('Failed to process uploaded sign image.');
    } finally {
      setImageAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const quickTestSigns = [
    BDSL_VOCABULARY.find((s) => s.id === 'ami')!,
    BDSL_VOCABULARY.find((s) => s.id === 'bhalo')!,
    BDSL_VOCABULARY.find((s) => s.id === 'kemon_acho')!,
    BDSL_VOCABULARY.find((s) => s.id === 'shahajjo')!,
    BDSL_VOCABULARY.find((s) => s.id === 'ma')!,
    BDSL_NUMBERS.find((s) => s.id === 'num_5')!,
  ].filter(Boolean);

  const primaryHand = detection.hands[0];
  const practiceMatched =
    practiceTarget &&
    detection.matchedSign &&
    detection.matchedSign.id === practiceTarget.id;

  return (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden relative ${
        isMinimized ? 'shrink-0' : 'h-full'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/70 ${
          isMinimized ? '' : 'border-b border-slate-200 dark:border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Hand className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            Sign Detector · Google MediaPipe
          </h3>
          {cameraActive && (
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 font-mono tabular-nums whitespace-nowrap shrink-0">
              · Active {detection.faceDetected ? '(Hand + Face)' : '(Hand 21-pt)'}
              {isMinimized && detection.matchedSign ? ` · ${detection.matchedSign.bangla}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isMinimized && (
            <>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
                aria-label="Detection scope"
                className="text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-md px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All BdSL Signs</option>
                <option value="vocab">Bangla Words</option>
                <option value="numbers">Numbers (০–১০০০+)</option>
                <option value="alphabets">Alphabets (A–Z)</option>
                <option value="shapes">33 Hand Shapes</option>
              </select>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageAnalyzing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                title="Analyze a sign photo"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {imageAnalyzing ? 'Scanning...' : 'Scan Photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </>
          )}

          <button
            type="button"
            onClick={cameraActive ? stopCamera : startCamera}
            disabled={loadingModel}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              cameraActive
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {cameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
            {loadingModel ? 'Loading MediaPipe...' : cameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>

          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              title={isMinimized ? 'Expand Camera Panel' : 'Minimize Camera Panel (Show Only 3D Model)'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {isMinimized ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5" /> Expand Camera
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5" /> Minimize
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Practice Target Banner */}
      {!isMinimized && practiceTarget && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-blue-900 whitespace-nowrap">Practice Target:</span>
            <span className="font-bengali font-bold text-blue-800 truncate">
              {practiceTarget.bangla} ({practiceTarget.english})
            </span>
            <span className="text-blue-700 hidden sm:inline">
              · Shape #{practiceTarget.rightHand.shapeId} · {practiceTarget.rightHand.zone}
            </span>
            {practiceMatched && (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" /> Matched!
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClearPracticeTarget}
            className="text-blue-700 hover:text-blue-900 font-medium whitespace-nowrap shrink-0"
          >
            Exit Practice
          </button>
        </div>
      )}

      {/* Video + MediaPipe Landmark Canvas Viewport (stays mounted invisibly when minimized) */}
      <div
        className={
          isMinimized
            ? 'w-px h-px opacity-0 pointer-events-none overflow-hidden absolute'
            : `relative flex-1 ${
                isExpanded ? 'min-h-[380px] lg:min-h-[460px]' : 'min-h-[280px] lg:min-h-[320px]'
              } bg-slate-950 flex items-center justify-center overflow-hidden`
        }
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-contain ${mirrored ? '-scale-x-100' : ''} ${
            cameraActive ? 'block' : 'hidden'
          }`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
            mirrored ? '-scale-x-100' : ''
          } ${cameraActive ? 'block' : 'hidden'}`}
        />

        {!cameraActive && (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Sign-to-Bangla Camera Ready
            </p>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Start your camera for real-time Google MediaPipe 21-point hand &amp; face landmark detection across all 33 hand shapes, numbers, alphabets, and Bangla conversation signs.
            </p>
            {cameraError && (
              <p className="mt-2.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800 rounded-md px-3 py-1.5">
                {cameraError}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Simulate Sign:</span>
              {quickTestSigns.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    appendSignToBuffer(s);
                    onPreviewSignOn3D([
                      {
                        id: `sim_${Date.now()}_${s.id}`,
                        sign: s,
                        spokenToken: s.bangla,
                        explanationBn: s.pdfDescription,
                        explanationEn: s.englishExplanation,
                      },
                    ]);
                  }}
                  className="px-2 py-1 text-[11px] font-bengali font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 rounded transition-colors"
                >
                  {s.bangla}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Telemetry Overlay when Camera Active */}
        {cameraActive && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent flex items-end justify-between gap-3">
            <div className="min-w-0">
              {primaryHand ? (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs text-sky-300 font-mono">
                    <span>
                      Shape #{primaryHand.shapeId}: {primaryHand.shapeBangla}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Palm: {primaryHand.palm}</span>
                    <span aria-hidden="true">·</span>
                    <span>Zone: {primaryHand.zone}</span>
                  </div>
                  {detection.matchedSign ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bengali font-bold text-white">
                        {detection.matchedSign.bangla}
                      </span>
                      <span className="text-xs text-slate-300">
                        ({detection.matchedSign.english})
                      </span>
                      <span className="text-xs font-mono tabular-nums text-emerald-400">
                        {Math.round(detection.confidence * 100)}%
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">
                      Hold a steady BdSL sign to lock &amp; translate...
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Show one or both hands clearly in frame...
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {detection.matchedSign && (
                <button
                  type="button"
                  onClick={() => appendSignToBuffer(detection.matchedSign!)}
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors whitespace-nowrap"
                >
                  + Add Sign
                </button>
              )}
              <button
                type="button"
                onClick={() => setMirrored((m) => !m)}
                className="px-2 py-1 text-[11px] font-medium bg-slate-800/90 text-slate-200 rounded hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                {mirrored ? 'Mirrored' : 'Normal'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Candidates, Live Spoken/Signed Watch Strip & Sentence Builder */}
      {!isMinimized && (
      <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/70 space-y-2">
        {(liveSpokenInterim || latestWatchMessage) && (
          <div className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 flex flex-col gap-0.5">
            {liveSpokenInterim ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
                  Listening Live:
                </span>
                <span className="text-sm font-bengali font-semibold text-slate-900 dark:text-white">
                  {liveSpokenInterim}
                </span>
              </div>
            ) : (
              latestWatchMessage && (
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                    <span
                      className={`text-[11px] font-semibold whitespace-nowrap ${
                        latestWatchMessage.role === 'signer' ? 'text-rose-700 dark:text-rose-400' : 'text-blue-700 dark:text-sky-400'
                      }`}
                    >
                      {latestWatchMessage.callerLabel ||
                        (latestWatchMessage.role === 'signer'
                          ? 'Sign → Bangla:'
                          : 'Spoken → Sign:')}
                    </span>
                    <span className="text-sm font-bengali font-bold text-slate-950 dark:text-white">
                      {latestWatchMessage.banglaText}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {latestWatchMessage.englishText}
                  </span>
                </div>
              )
            )}
          </div>
        )}

        {cameraActive && detection.topCandidates.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Candidates:
            </span>
            {detection.topCandidates.map((cand) => (
              <button
                key={cand.sign.id}
                type="button"
                onClick={() => appendSignToBuffer(cand.sign)}
                className="px-2 py-0.5 text-xs font-bengali bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded hover:border-blue-400 text-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
              >
                {cand.sign.bangla}{' '}
                <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                  {Math.round(cand.score * 100)}%
                </span>
              </button>
            ))}
          </div>
        )}

        {pauseProgress > 0.05 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-rose-700 font-medium">
              <span>Hands paused — converting signs into Bangla speech &amp; text...</span>
              <span className="font-mono tabular-nums">{Math.round(pauseProgress * 100)}%</span>
            </div>
            <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-100"
                style={{ width: `${Math.round(pauseProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1 min-w-[200px] flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 min-h-[38px]">
            {signBuffer.length === 0 ? (
              <span className="text-xs text-slate-400">
                Sign in front of camera — signs collect here and auto-convert to Bangla when you pause...
              </span>
            ) : (
              signBuffer.map((s, idx) => (
                <button
                  key={`${s.id}_${idx}`}
                  type="button"
                  onClick={() =>
                    setSignBuffer((prev) => prev.filter((_, i) => i !== idx))
                  }
                  title="Click to remove"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bengali font-medium bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-700 dark:hover:text-rose-300 text-slate-800 dark:text-slate-100 rounded"
                >
                  {s.bangla}
                  <span className="text-[10px] text-slate-400">×</span>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <label
              className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none px-1"
              title="Automatically add steady signs"
            >
              <input
                type="checkbox"
                checked={autoCommit}
                onChange={(e) => setAutoCommit(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Auto-add
            </label>

            <label
              className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none px-1"
              title="Automatically convert buffer to Bangla when hands pause"
            >
              <input
                type="checkbox"
                checked={autoSendOnPause}
                onChange={(e) => setAutoSendOnPause(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              Auto-send
            </label>

            <button
              type="button"
              onClick={onToggleAutoSpeak}
              title="Speak converted Bangla automatically"
              className={`p-1.5 rounded-md border text-xs transition-colors ${
                autoSpeakBangla
                  ? 'bg-blue-50 dark:bg-sky-950/60 border-blue-200 dark:border-sky-500/30 text-blue-700 dark:text-sky-300'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSignBuffer([])}
              disabled={signBuffer.length === 0}
              title="Clear queue"
              className="p-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCommitBufferToBangla}
              disabled={signBuffer.length === 0 || isComposing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-45 transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              {isComposing ? 'Converting...' : 'Send Bangla'}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
