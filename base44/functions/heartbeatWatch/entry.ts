import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { reassignOrder } from '../../shared/dispatch.js';

// Reliability sweep: reassign drivers whose heartbeat went stale or who went
// offline mid-trip, and flag requests unmatched past the threshold. Runs on a
// schedule so lost connections don't strand the rider.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const orders = await base44.asServiceRole.entities.Order.list('-updated_date', 200).catch(() => []);
    const drivers = await base44.asServiceRole.entities.DriverProfile.list('-updated_date', 200).catch(() => []);
    const events = await base44.asServiceRole.entities.DispatchEvent.list('-created_date', 100).catch(() => []);

    const now = Date.now();
    const STALE_MS = 120_000;
    const UNMATCHED_MS = 120_000;

    const recentUnmatched = new Set();
    for (const e of events) {
      if (e.detail && e.detail.includes('unmatched past threshold') && e.order_id && e.created_date) {
        if (now - new Date(e.created_date).getTime() < 5 * 60 * 1000) recentUnmatched.add(e.order_id);
      }
    }

    const driverByUser = {};
    for (const d of drivers) if (d.created_by_id) driverByUser[d.created_by_id] = d;

    let reassigned = 0;
    let alerts = 0;
    const active = orders.filter((o) => ['matching', 'confirmed', 'preparing', 'picked_up'].includes(o.status));
    for (const o of active) {
      if (o.driver_id) {
        const d = driverByUser[o.driver_id];
        const offlineMidTrip = !d || d.is_available === false;
        const stale = d?.last_heartbeat && now - new Date(d.last_heartbeat).getTime() > STALE_MS;
        if (offlineMidTrip || stale) {
          await reassignOrder(base44, o, offlineMidTrip ? 'driver_offline_mid_trip' : 'heartbeat_timeout', 'system');
          reassigned++;
        }
      } else if (o.status === 'matching') {
        const ts = o.state_changed_at || o.updated_date;
        if (ts && now - new Date(ts).getTime() > UNMATCHED_MS && !recentUnmatched.has(o.id)) {
          await base44.asServiceRole.entities.DispatchEvent.create({
            order_id: o.id, actor_id: 'system', from_state: 'matching', to_state: 'matching',
            detail: 'unmatched past threshold — manual dispatch needed', severity: 'urgent',
          }).catch(() => {});
          alerts++;
        }
      }
    }

    return Response.json({ reassigned, alerts });
  } catch (e) {
    console.error('heartbeatWatch', e?.message || e);
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}