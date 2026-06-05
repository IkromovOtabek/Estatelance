/** Admin panel ichki yo‘llar — frontend admin-config bilan mos */
export const AdminLinkPaths = {
  payments: (opts?: { jobId?: string; userId?: string }) => {
    const p = new URLSearchParams({ section: 'payments' });
    if (opts?.jobId) p.set('jobId', opts.jobId);
    if (opts?.userId) p.set('userId', opts.userId);
    return `/_admin?${p.toString()}`;
  },
  targetsAds: (sourceId?: string, sourceKind?: string) => {
    const p = new URLSearchParams({ section: 'targets', tab: 'ads' });
    if (sourceId) p.set('sourceId', sourceId);
    if (sourceKind) p.set('sourceKind', sourceKind);
    return `/_admin?${p.toString()}`;
  },
  targetsModeration: (opts?: { jobId?: string; disputeId?: string }) => {
    const p = new URLSearchParams({ section: 'targets', tab: 'moderation' });
    if (opts?.jobId) p.set('jobId', opts.jobId);
    if (opts?.disputeId) p.set('disputeId', opts.disputeId);
    return `/_admin?${p.toString()}`;
  },
};
