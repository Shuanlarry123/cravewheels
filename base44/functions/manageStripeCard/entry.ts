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