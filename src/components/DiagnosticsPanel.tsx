import React, { useState, useEffect } from 'react';
import { diagnostics, DiagnosticsSnapshot } from '../services/diagnostics';
import { featureFlags } from '../config/featureFlags';
import { Activity, AlertOctagon, RefreshCw, X, Shield, Cpu, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export const DiagnosticsPanel: React.FC<Props> = ({ onClose }) => {
  const [snapshot, setSnapshot] = useState<DiagnosticsSnapshot>(() =>
    diagnostics.getSnapshot(featureFlags.getAll())
  );
  const [activeTab, setActiveTab] = useState<'stages' | 'logs' | 'flags'>('stages');

  useEffect(() => {
    const unsub = diagnostics.subscribe((newSnap) => {
      setSnapshot({ ...newSnap, flags: featureFlags.getAll() });
    });
    return unsub;
  }, []);

  const handleToggleFlag = (key: any) => {
    const cur = featureFlags.get(key);
    featureFlags.set(key, !cur);
    setSnapshot(diagnostics.getSnapshot(featureFlags.getAll()));
  };

  const { latencies } = snapshot;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[85vh] flex flex-col rounded-2xl bg-zinc-950/95 border-2 border-emerald-500/50 text-zinc-100 shadow-2xl backdrop-blur-md overflow-hidden text-xs font-mono"
      role="region"
      aria-label="Walk Assistant Diagnostics Panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider text-emerald-400 uppercase">
            Diagnostics (v2.0)
          </span>
          <span className="text-[10px] text-zinc-400">
            {snapshot.inferencesPerSecond} IPS · {snapshot.fps} FPS
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              aria-label="Close Diagnostics"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab('stages')}
          className={`flex-1 py-1.5 text-center font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'stages'
              ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Latency ({latencies.totalMs}ms)
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-1.5 text-center font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'logs'
              ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Logs ({snapshot.recentLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('flags')}
          className={`flex-1 py-1.5 text-center font-bold transition cursor-pointer border-b-2 ${
            activeTab === 'flags'
              ? 'border-emerald-400 text-emerald-400 bg-zinc-800/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Flags
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3 overflow-y-auto space-y-3 max-h-[380px]">
        {activeTab === 'stages' && (
          <div className="space-y-2.5">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">p50 Latency</span>
                <span className="font-bold text-sm text-emerald-400">{snapshot.p50TotalMs} ms</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">p95 Latency</span>
                <span className="font-bold text-sm text-amber-400">{snapshot.p95TotalMs} ms</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">Drops</span>
                <span className="font-bold text-sm text-zinc-200">{snapshot.droppedFrames}</span>
              </div>
            </div>

            {/* Stage Latency Breakdown */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
                Stage Breakdown (Budget: &lt;200ms)
              </span>

              {[
                { name: '1. Frame Capture', ms: latencies.captureMs, budget: 16 },
                { name: '2. Letterbox Preprocess', ms: latencies.preprocessMs, budget: 8 },
                { name: '3. Detection Inference', ms: latencies.inferenceMs, budget: 60 },
                { name: '4. Path Safety Engine', ms: latencies.engineMs, budget: 10 },
                { name: '5. Audio Output Onset', ms: latencies.audioMs, budget: 50 },
              ].map((stage) => {
                const isOverBudget = stage.ms > stage.budget;
                return (
                  <div key={stage.name} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-300">{stage.name}</span>
                      <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {stage.ms} ms <span className="text-zinc-500 text-[10px]">(&lt;{stage.budget})</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (stage.ms / stage.budget) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Error Recovery Status */}
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Pipeline Restarts</span>
              <span className={snapshot.restartCount > 0 ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                {snapshot.restartCount} / 3
              </span>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-1.5">
            {snapshot.recentLogs.length === 0 ? (
              <p className="text-zinc-500 italic py-4 text-center">No errors or events logged.</p>
            ) : (
              snapshot.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-2 rounded border text-[11px] space-y-0.5 ${
                    log.level === 'error'
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                      : log.level === 'warn'
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span className="uppercase font-bold text-zinc-300">[{log.stage}]</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="break-words">{log.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">
              v2 Non-Regression Feature Toggles
            </span>
            {Object.entries(snapshot.flags).map(([flagKey, val]) => (
              <div
                key={flagKey}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800"
              >
                <div>
                  <span className="font-bold text-zinc-200 block">{flagKey}</span>
                  <span className="text-[10px] text-zinc-400">
                    {flagKey === 'WALK_V2_DETECTOR' && 'Letterbox unpadding + NMS + Tier 1'}
                    {flagKey === 'WALK_V2_PROXIMITY_AUDIO' && 'Distance-scaled pulses & fast audio'}
                    {flagKey === 'WALK_V2_ASSISTANT' && 'Hands-free voice assistant'}
                    {flagKey === 'WALK_V2_DEPTH' && 'Monocular depth unknown obstacle'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleFlag(flagKey)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition ${
                    val
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {val ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="px-3 py-1.5 bg-zinc-900 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Privacy: No camera images logged</span>
        <span>Build: {snapshot.version}</span>
      </div>
    </div>
  );
};
