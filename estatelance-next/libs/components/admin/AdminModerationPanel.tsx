import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import {
  MagnifyingGlass, CheckCircle, XCircle, Eye, Warning,
  CurrencyDollar, Clock, Buildings,
} from '@phosphor-icons/react';
import { GET_ALL_DISPUTES } from '../../../apollo/user/query';
import { RESOLVE_DISPUTE } from '../../../apollo/user/mutation';
import { ADMIN_GET_MODERATION_CANCELLED_JOBS } from '../../../apollo/admin/query';

const catColors: Record<string, string> = {
  DESIGN: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
  DEVELOPMENT: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  MARKETING: 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300',
  OTHER: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
};

interface AdminModerationPanelProps {
  focusJobId?: string;
  focusDisputeId?: string;
}

export default function AdminModerationPanel({ focusJobId, focusDisputeId }: AdminModerationPanelProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'disputes'>('jobs');
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: jobsData, loading: jobsLoading } = useQuery(ADMIN_GET_MODERATION_CANCELLED_JOBS, {
    variables: { limit: 100 },
    fetchPolicy: 'network-only',
  });

  const { data: disputesData, refetch: refetchDisputes } = useQuery(GET_ALL_DISPUTES, {
    fetchPolicy: 'cache-and-network',
  });

  const cancelledJobs = jobsData?.adminGetModerationCancelledJobs ?? [];
  const disputes: any[] = disputesData?.getAllDisputes ?? [];

  const [resolveDispute, { loading: resolving }] = useMutation(RESOLVE_DISPUTE);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
  const [disputeDecision, setDisputeDecision] = useState('FAVOR_FREELANCER');
  const [disputeAdminNote, setDisputeAdminNote] = useState('');

  const openDisputes = disputes.filter((d) => d.status === 'OPEN');

  useEffect(() => {
    if (focusDisputeId) {
      setActiveTab('disputes');
      const d = disputes.find((x) => x._id === focusDisputeId);
      if (d) {
        setSelectedDispute(d);
        setDisputeDecision('FAVOR_FREELANCER');
        setDisputeAdminNote('');
      }
    }
  }, [focusDisputeId, disputes]);

  useEffect(() => {
    if (focusJobId && cancelledJobs.length) {
      setActiveTab('jobs');
      setSelectedJobId(focusJobId);
    }
  }, [focusJobId, cancelledJobs]);

  const filteredJobs = useMemo(() => {
    return cancelledJobs.filter((j: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        j.title?.toLowerCase().includes(q) ||
        j.agentName?.toLowerCase().includes(q) ||
        j.cancelReason?.toLowerCase().includes(q)
      );
    });
  }, [cancelledJobs, search]);

  const selectedJob = filteredJobs.find((j: any) => j._id === selectedJobId) ?? filteredJobs[0] ?? null;

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    await resolveDispute({
      variables: {
        input: { disputeId: selectedDispute._id, decision: disputeDecision, adminNote: disputeAdminNote },
      },
    });
    setSelectedDispute(null);
    setDisputeAdminNote('');
    refetchDisputes();
  };

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-[#1e293b] overflow-hidden bg-white dark:bg-[#0f172a] min-h-[560px]">
      <div className="bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-[#1e293b] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Moderatsiya</h3>
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${
                activeTab === 'jobs'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              Bekor qilingan ishlar ({filteredJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('disputes')}
              className={`text-sm font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1 ${
                activeTab === 'disputes'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-slate-500 dark:text-slate-400'
              }`}
            >
              <Warning size={14} />
              Nizolar
              {openDisputes.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {openDisputes.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="relative">
          <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl text-sm w-52"
          />
        </div>
      </div>

      {activeTab === 'jobs' && (
        <div className="flex flex-1 min-h-[480px] overflow-hidden">
          <div className="w-96 flex-shrink-0 border-r border-slate-200 dark:border-[#1e293b] flex flex-col">
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1e293b]">
              {jobsLoading && (
                <p className="text-center py-12 text-sm text-slate-400">Yuklanmoqda...</p>
              )}
              {!jobsLoading && filteredJobs.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm px-4">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
                  Bekor qilingan ishlar yo&apos;q
                </div>
              )}
              {filteredJobs.map((job: any) => (
                <button
                  key={job._id}
                  type="button"
                  onClick={() => setSelectedJobId(job._id)}
                  className={`w-full text-left px-4 py-4 transition-colors border-l-2 ${
                    selectedJob?._id === job._id
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-600'
                      : 'hover:bg-slate-50 dark:hover:bg-[#1e293b]/40 border-transparent'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{job.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{job.agentName ?? 'Agent'}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{job.cancelReason}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0a0f1a]">
            {!selectedJob ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Eye size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Ko&apos;rish uchun ishni tanlang</p>
              </div>
            ) : (
              <div className="max-w-2xl space-y-4">
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5">
                  <div className="flex justify-between gap-2 mb-3">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedJob.title}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${catColors[selectedJob.category] ?? 'bg-slate-100 text-slate-600'}`}>
                      {selectedJob.category}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Buildings size={14} /> {selectedJob.agentName}</span>
                    <span className="flex items-center gap-1"><CurrencyDollar size={14} /> ${selectedJob.budget}</span>
                    {selectedJob.cancelledAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {new Date(selectedJob.cancelledAt).toLocaleString('uz-UZ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedJob.description}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-5">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">Bekor qilish sababi</p>
                  <p className="text-sm text-red-800 dark:text-red-200">{selectedJob.cancelReason}</p>
                </div>
                <Link
                  href={`/jobs/${selectedJob._id}`}
                  target="_blank"
                  className="inline-flex text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Ish sahifasini ochish →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              {disputes.length === 0 ? (
                <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-10 text-center">
                  <Warning size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-slate-500 font-semibold">Nizolar yo&apos;q</p>
                </div>
              ) : (
                disputes.map((d: any) => (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => {
                      setSelectedDispute(d);
                      setDisputeDecision('FAVOR_FREELANCER');
                      setDisputeAdminNote('');
                    }}
                    className={`w-full text-left bg-white dark:bg-[#0f172a] border rounded-2xl p-4 hover:shadow-sm transition-all ${
                      selectedDispute?._id === d._id
                        ? 'border-red-400 ring-1 ring-red-300'
                        : 'border-slate-200 dark:border-[#1e293b]'
                    }`}
                  >
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{d.jobTitle ?? 'Ish'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{d.filedByName} → {d.againstName}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{d.reason}</p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                          d.status === 'OPEN'
                            ? 'bg-amber-50 text-amber-700'
                            : d.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {d.status === 'OPEN' ? 'Ochiq' : d.status === 'RESOLVED' ? 'Hal qilindi' : d.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {selectedDispute && selectedDispute.status === 'OPEN' && (
              <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-5 sticky top-6 h-fit">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-4">Nizo hal qilish</h4>
                <form onSubmit={handleResolveDispute} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-[#1e293b] rounded-xl p-3 text-sm text-slate-700 dark:text-slate-300">
                    {selectedDispute.reason}
                  </div>
                  <div className="space-y-2">
                    {[
                      { val: 'FAVOR_FREELANCER', label: 'Frilanser foydasiga' },
                      { val: 'FAVOR_AGENT', label: 'Agent foydasiga' },
                      { val: 'SPLIT', label: "Ikki tomon o'rtasida" },
                    ].map((opt) => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="decision"
                          value={opt.val}
                          checked={disputeDecision === opt.val}
                          onChange={() => setDisputeDecision(opt.val)}
                          className="accent-indigo-600"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={disputeAdminNote}
                    onChange={(e) => setDisputeAdminNote(e.target.value)}
                    placeholder="Admin izohi..."
                    className="w-full border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] rounded-xl px-3 py-2 text-sm resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDispute(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#334155] text-sm font-semibold"
                    >
                      Bekor
                    </button>
                    <button
                      type="submit"
                      disabled={resolving}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-50"
                    >
                      {resolving ? 'Saqlanmoqda...' : 'Hal qilish'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
