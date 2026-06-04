import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import { Warning, CheckCircle, Clock, XCircle, Plus, ArrowRight } from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { GET_MY_DISPUTES } from '../../apollo/user/query';
import { CREATE_DISPUTE } from '../../apollo/user/mutation';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactElement }> = {
  OPEN:         { label: 'Ochiq',        color: 'bg-amber-50 text-amber-700',   icon: <Clock size={13} weight="fill" /> },
  UNDER_REVIEW: { label: 'Ko\'rib chiqilmoqda', color: 'bg-blue-50 text-blue-700', icon: <Warning size={13} weight="fill" /> },
  RESOLVED:     { label: 'Hal qilindi',  color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle size={13} weight="fill" /> },
  CLOSED:       { label: 'Yopildi',      color: 'bg-slate-100 text-slate-500',  icon: <XCircle size={13} weight="fill" /> },
};

const DECISION_LABEL: Record<string, string> = {
  FAVOR_AGENT:       'Agent foydasiga',
  FAVOR_FREELANCER:  'Frilanser foydasiga',
  SPLIT:             'Ikki tomon o\'rtasida',
};

const DisputesPage = () => {
  const user = useReactiveVar(userVar);
  const [showForm, setShowForm] = useState(false);
  const [jobId, setJobId]       = useState('');
  const [reason, setReason]     = useState('');
  const [error, setError]       = useState('');

  const { data, refetch } = useQuery(GET_MY_DISPUTES, { fetchPolicy: 'cache-and-network' });
  const disputes = data?.getMyDisputes ?? [];

  const [createDispute, { loading }] = useMutation(CREATE_DISPUTE, {
    onCompleted: () => { setShowForm(false); setJobId(''); setReason(''); refetch(); },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!jobId.trim() || !reason.trim()) return;
    createDispute({ variables: { input: { jobId: jobId.trim(), reason: reason.trim() } } });
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Nizolar — BuFu</title>
      </Head>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Nizolar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ish bo'yicha ochilgan va hal qilingan nizolar</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nizo ochish
        </button>
      </div>

      {/* Create dispute form */}
      {showForm && (
        <div className="bg-white border border-red-100 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Warning size={18} color="#ef4444" weight="fill" /> Yangi nizo ochish
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ish ID</label>
              <input
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                placeholder="Ish sahifasidan nusxa oling..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <p className="text-xs text-slate-400 mt-1">
                Ish sahifasiga o'ting va URL dagi IDni ko'chiring
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nizo sababi</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={4}
                placeholder="Muammoni batafsil yozing: nima bo'ldi, qanday hal bo'lishini xohlaysiz..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                Bekor qilish
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
                {loading ? 'Yuborilmoqda...' : 'Nizo ochish'}
              </button>
            </div>
          </form>
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700 font-semibold">⚠️ Diqqat:</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Nizo ochilsa, ish escrow to'lovi muzlatiladi va admin hal qilguncha kutiladi.
              Asossiz nizo ochish hisobingizga ta'sir qilishi mumkin.
            </p>
          </div>
        </div>
      )}

      {/* Disputes list */}
      {disputes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <Warning size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-semibold">Nizolar yo'q</p>
          <p className="text-sm text-slate-400 mt-1">Barcha ishlaringiz muammosiz yakunlangan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((dispute: any) => {
            const cfg = STATUS_CONFIG[dispute.status] ?? STATUS_CONFIG['OPEN'];
            const isFiler = dispute.filedById === user._id;
            return (
              <div key={dispute._id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {isFiler ? (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Siz ochdingiz</span>
                      ) : (
                        <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">Siz haqingizda</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {dispute.jobTitle ?? 'Ish'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isFiler ? `${dispute.againstName} haqida` : `${dispute.filedByName} tomonidan`}
                    </p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{dispute.reason}</p>
                    {dispute.decision && (
                      <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        <p className="text-xs font-bold text-emerald-700">Qaror: {DECISION_LABEL[dispute.decision]}</p>
                        {dispute.adminNote && <p className="text-xs text-emerald-600 mt-0.5">{dispute.adminNote}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-400">
                      {new Date(dispute.createdAt).toLocaleDateString('uz-UZ')}
                    </p>
                    <Link
                      href={`/jobs/${dispute.jobId}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Ishni ko'rish <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default withLayoutBasic(DisputesPage);
