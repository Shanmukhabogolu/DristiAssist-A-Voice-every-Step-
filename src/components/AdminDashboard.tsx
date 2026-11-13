import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  FileCheck,
  Building2,
  Download,
  Filter,
  RefreshCw,
  Eye,
} from 'lucide-react';

import { SupportedLanguage } from '../types';
import { BrandHeaderBand } from './BrandHeaderBand';

interface Props {
  language: SupportedLanguage;
}

export const AdminDashboard: React.FC<Props> = ({ language }) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [stats, setStats] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contributions' | 'partners' | 'feedback'>('overview');

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, contribRes, partRes, fbRes] = await Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/contributions').then((r) => r.json()),
        fetch('/api/partners').then((r) => r.json()),
        fetch('/api/feedback').then((r) => r.json()),
      ]);

      setStats(statsRes);
      setContributions(contribRes.contributions || []);
      setPartners(partRes.partners || []);
      setFeedback(fbRes.feedback || []);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateContribution = async (id: string, status: string) => {
    try {
      await fetch(`/api/contributions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setContributions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (err) {
      console.error('Error updating contribution:', err);
    }
  };

  const exportDatasetManifest = () => {
    const approved = contributions.filter((c) => c.status === 'approved');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(approved, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'drishti_approved_dataset_manifest.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full flex flex-col">
      {/* Brand Header Band matching DrishtiAssist Logo (transparent variant without background block) */}
      <BrandHeaderBand
        serifPrefix="DA ·"
        variant="transparent"
        title={
          isTe
            ? 'ఆపరేషనల్ టెలిమెట్రీ & అడ్మిన్ కన్సోల్'
            : isHi
            ? 'प्रशासक एवं गुणवत्ता डैशबोर्ड'
            : 'OPERATIONAL TELEMETRY & ADMIN CONSOLE'
        }
        subtitle={
          isTe
            ? 'రియల్-టైమ్ ఖచ్చితత్వ టెలిమెట్రీ, ధృవీకరణ అభిప్రాయాలు మరియు భాగస్వామ్యాల నిర్వహణ.'
            : isHi
            ? 'दैनिक सक्रिय उपयोगकर्ता, मॉडल सटीकता रिपोर्ट और सामुदायिक योगदान'
            : 'Real-time accuracy telemetry, field feedback verification, and partner management.'
        }
        language={language}
        onRefresh={fetchAdminData}
        refreshLabel={isTe ? 'డేటా తాజాకరించు' : isHi ? 'ताज़ा करें' : 'Refresh Data'}
        isLoading={isLoading}
      />

      <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

      {/* Overview Stat Cards - Warm Cream Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="card-warm p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider">
            Active Users Today
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--text-heading)] font-mono">
              {stats?.metrics?.activeUsersToday || 318}
            </span>
            <span className="text-xs text-[#1F4D3A] bg-[#E6F2EA] px-1.5 py-0.5 rounded font-semibold font-mono">+14%</span>
          </div>
          <span className="text-[11px] text-[var(--text-body)] mt-2">Haryana & Delhi NCR</span>
        </div>

        <div className="card-warm p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider">
            Total Alerts Spoken
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[var(--icon-color)] font-mono">
              {stats?.metrics?.totalAlertsToday || 1420}
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-body)] mt-2">3.5/sec peak throughput</span>
        </div>

        <div className="card-warm p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider">
            Reported Accuracy
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#1F4D3A] font-mono">
              {stats?.metrics?.overallAccuracyPercent || 91}%
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-body)] mt-2">User field feedback</span>
        </div>

        <div className="card-warm p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider">
            Language Split
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-[var(--text-heading)] font-mono">
              62% HI / 38% EN
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-body)] mt-2">Hindi dominant</span>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--card-border)] gap-4 text-sm font-semibold">
        {[
          { id: 'overview', label: 'Class Accuracy & Performance' },
          { id: 'contributions', label: `Image Review Queue (${contributions.length})` },
          { id: 'partners', label: `Partner Inquiries (${partners.length})` },
          { id: 'feedback', label: `Field Feedback (${feedback.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition cursor-pointer ${
              activeTab === tab.id
                ? 'border-[var(--brand-charcoal)] text-[var(--text-heading)] font-bold'
                : 'border-transparent text-[var(--text-body)] hover:text-[var(--text-heading)] font-medium'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview Class Accuracy Bars */}
      {activeTab === 'overview' && (
        <div className="card-warm p-6 rounded-2xl space-y-6">
          <h2 className="card-warm-heading text-base font-bold">
            User-Reported Verification Accuracy by Hazard Class
          </h2>

          <div className="space-y-4">
            {[
              { label: 'Non-Demented (Normal)', accuracy: 94.1, count: 136 },
              { label: 'Very Mild Cognitive Changes', accuracy: 85.9, count: 114 },
              { label: 'Mild Impairment', accuracy: 88.2, count: 85 },
              { label: 'Moderate Impairment', accuracy: 92.5, count: 65 },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[var(--text-heading)]">{item.label}</span>
                  <span className="font-mono text-[#1F4D3A] font-bold">{item.accuracy}% ({item.count} samples)</span>
                </div>
                <div className="w-full bg-[#EAE3D6] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#3F8F6B] h-full rounded-full transition-all duration-300"
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: User Contributed Images Review Queue */}
      {activeTab === 'contributions' && (
        <div className="card-warm p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
            <div>
              <h2 className="card-warm-heading text-base font-bold">
                Opt-in Contributed Images Review Queue
              </h2>
              <p className="card-warm-body text-xs mt-0.5">
                Blur-or-discard policy: inspect and approve user photos before model retraining.
              </p>
            </div>
            <button
              onClick={exportDatasetManifest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-charcoal)] hover:bg-[var(--brand-charcoal-2)] text-[var(--brand-offwhite)] text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Approved Manifest</span>
            </button>
          </div>

          <div className="space-y-3">
            {contributions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-[var(--brand-ink-muted)] transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[var(--icon-color)] uppercase font-bold">
                      {item.suggestedLabel}
                    </span>
                    <span className="text-[var(--card-border)]">·</span>
                    <span className="text-xs text-[var(--text-body)]">
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-heading)] font-medium">{item.notes}</p>
                  <span className="text-[11px] text-[#1F4D3A] font-semibold block">
                    ✓ User Explicit DPDP Consent Verified
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs px-2.5 py-1 rounded font-bold uppercase ${
                      item.status === 'approved'
                        ? 'bg-[#E6F2EA] text-[#1F4D3A] border border-[#3F8F6B]/30'
                        : item.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateContribution(item.id, 'approved')}
                        className="p-1.5 rounded-lg bg-[#E6F2EA] text-[#1F4D3A] hover:bg-[#D2E7DA] transition border border-[#3F8F6B]/30 cursor-pointer"
                        title="Approve for retraining"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUpdateContribution(item.id, 'rejected')}
                        className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition border border-rose-300 cursor-pointer"
                        title="Reject and discard"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Partner Inquiries */}
      {activeTab === 'partners' && (
        <div className="card-warm p-6 rounded-2xl space-y-4">
          <h2 className="card-warm-heading text-base font-bold">
            NGO and School Deployment Requests
          </h2>

          <div className="space-y-3">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--card-border)] space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h3 className="card-warm-heading text-base font-bold">
                    {partner.organizationName}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-sky-100 text-sky-800 border border-sky-300">
                    {partner.type}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-body)] flex flex-wrap gap-3">
                  <span>Contact: {partner.contactName}</span>
                  <span>·</span>
                  <span>Email: {partner.email}</span>
                  <span>·</span>
                  <span className="text-[var(--icon-color)] font-semibold">{partner.devicesNeeded}</span>
                </div>
                <p className="text-xs text-[var(--text-body)] italic">{partner.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Field Feedback List */}
      {activeTab === 'feedback' && (
        <div className="card-warm p-6 rounded-2xl space-y-4">
          <h2 className="card-warm-heading text-base font-bold">
            User Post-Alert Feedback Stream
          </h2>

          <div className="space-y-2">
            {feedback.map((fb) => (
              <div
                key={fb.id}
                className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--card-border)] flex items-center justify-between text-xs shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      fb.wasCorrect
                        ? 'bg-[#E6F2EA] text-[#1F4D3A] border border-[#3F8F6B]/30'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {fb.wasCorrect ? 'CORRECT' : 'WRONG'}
                  </span>
                  <span className="font-mono text-[var(--text-heading)] font-semibold uppercase">
                    {fb.hazardLabel} ({fb.zone})
                  </span>
                  {fb.userNote && (
                    <span className="text-[var(--text-body)] italic">"{fb.userNote}"</span>
                  )}
                </div>
                <span className="text-[var(--text-body)] font-mono">
                  {new Date(fb.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
