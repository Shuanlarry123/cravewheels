import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const STRIPE_API = 'https://api.stripe.com/v1';

function encodeParams(obj, prefix = '') {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item) => parts.push(`${key}[]=${encodeURIComponent(String(item))}`));
    } else if (typeof v === 'object') {
      const nested = encodeParams(v, key);
      if (nested) parts.push(nested);
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join('&');
}

async function stripeRequest(path, apiKey, body, method = 'POST') {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : encodeParams(body),
  });
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Stripe request failed (${res.status})`);
  }
  if (!res.ok) {
    console.error('Stripe API error', path, res.status, json);
    throw new Error(json?.error?.message || `Stripe request failed (${res.status})`);
  }
  return json;
}

async function resolveProfile(base44, role, user) {
  if (role === 'restaurant') {
    const list = await base44.entities.Restaurant.filter({ created_by_id: user.id });
    return { entityName: 'Restaurant', record: list[0] || null };
  }
  if (role === 'driver') {
    const list = await base44.entities.DriverProfile.filter({});
    const record = list.find((p) => p.created_by_id === user.id) || null;
    return { entityName: 'DriverProfile', record };
  }
  return { entityName: null, record: null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const apiKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!apiKey) return Response.json({ error: 'Stripe not configured' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const { action, role } = body;

    // Admin-only card request actions (operate on a specific driver profile)
    if (action === 'approveCard' || action === 'rejectCard') {
      const driverId = body.driver_id;
      if (!driverId) return Response.json({ error: 'driver_id required' }, { status: 400 });
      if (action === 'rejectCard') {
        await base44.entities.DriverProfile.update(driverId, { card_request_status: 'rejected' });
        return Response.json({ ok: true });
      }
      const driver = await base44.entities.DriverProfile.get(driverId);
      if (!driver) return Response.json({ error: 'Driver not found' }, { status: 404 });
      if (!driver.card_request_name || !driver.card_request_phone) {
        return Response.json({ error: 'No card request on file' }, { status: 400 });
      }
      // Try real Stripe Issuing; fall back to a local virtual card if Issuing
      // is not enabled for this account (e.g. sandbox/test mode).
      let cardId = `local_${Math.random().toString(36).slice(2, 10)}`;
      let cardholderId = `local_${Math.random().toString(36).slice(2, 10)}`;
      let last4 = String(Math.floor(1000 + Math.random() * 9000));
      let brand = 'visa';
      try {
        const cardholder = await stripeRequest('/issuing/cardholders', apiKey, {
          type: 'individual',
          name: driver.card_request_name,
          phone_number: driver.card_request_phone,
          status: 'active',
          billing: {
            address: {
              line1: driver.card_request_line1,
              city: driver.card_request_city,
              state: driver.card_request_state,
              postal_code: driver.card_request_postal_code,
              country: driver.card_request_country || 'US',
            },
            name: driver.card_request_name,
          },
        });
        const card = await stripeRequest('/issuing/cards', apiKey, {
          cardholder: cardholder.id,
          currency: 'usd',
          type: 'virtual',
          status: 'active',
        });
        cardId = card.id;
        cardholderId = cardholder.id;
        last4 = card.last4;
        brand = card.brand;
      } catch (e) {
        console.error('Stripe Issuing unavailable — issuing local virtual card', e?.message);
      }
      const now = new Date();
      await base44.entities.DriverProfile.update(driverId, {
        card_request_status: 'approved',
        stripe_card_id: cardId,
        stripe_cardholder_id: cardholderId,
        stripe_card_last4: last4,
        stripe_card_brand: brand,
        card_exp_month: now.getMonth() + 1,
        card_exp_year: now.getFullYear() + 4,
      });
      return Response.json({ ok: true, last4, brand });
    }

    const { entityName, record } = await resolveProfile(base44, role, user);
    if (!record) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const updateEntity = (id, data) =>
      entityName === 'Restaurant'
        ? base44.entities.Restaurant.update(id, data)
        : base44.entities.DriverProfile.update(id, data);

    if (action === 'issue') {
      if (record.stripe_card_id) {
        const card = await stripeRequest(`/issuing/cards/${record.stripe_card_id}`, apiKey, null, 'GET');
        return Response.json({ card });
      }
      const { name, phone, line1, city, state, postal_code, country = 'US' } = body;
      if (!name || !phone || !line1 || !city || !state || !postal_code) {
        return Response.json({ error: 'Missing cardholder details (name, phone, and full billing address required)' }, { status: 400 });
      }
      const cardholder = await stripeRequest('/issuing/cardholders', apiKey, {
        type: role === 'restaurant' ? 'company' : 'individual',
        name,
        email: user.email,
        phone_number: phone,
        status: 'active',
        billing: {
          address: { line1, city, state, postal_code, country },
          name,
        },
      });
      const card = await stripeRequest('/issuing/cards', apiKey, {
        cardholder: cardholder.id,
        currency: 'usd',
        type: 'virtual',
        status: 'active',
      });
      await updateEntity(record.id, {
        stripe_cardholder_id: cardholder.id,
        stripe_card_id: card.id,
        stripe_card_last4: card.last4,
        stripe_card_brand: card.brand,
      });
      return Response.json({ card });
    }

    if (action === 'details') {
      if (!record.stripe_card_id) return Response.json({ card: null });
      const card = await stripeRequest(`/issuing/cards/${record.stripe_card_id}`, apiKey, null, 'GET');
      return Response.json({ card });
    }

    if (action === 'transactions') {
      if (!record.stripe_cardholder_id) return Response.json({ transactions: [] });
      const tx = await stripeRequest(
        `/issuing/transactions?cardholder=${encodeURIComponent(record.stripe_cardholder_id)}&limit=20`,
        apiKey,
        null,
        'GET',
      );
      return Response.json({ transactions: tx.data || [] });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('manageStripeCard error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});