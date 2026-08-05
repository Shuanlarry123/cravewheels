import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { createMimeMessage } from 'npm:mail-mime-builder';

const NOTIFIABLE = new Set(['confirmed', 'picked_up']);

const SUBJECTS = {
  confirmed: (name) => `Your ${name || 'Cravewheels'} order is confirmed`,
  picked_up: (name) => `Your ${name || 'Cravewheels'} order is on the way`,
};

function htmlBody(status, order) {
  const name = order.restaurant_name || 'Cravewheels';
  const shortId = String(order.id || '').slice(-6).toUpperCase();
  if (status === 'confirmed') {
    return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#0D0D0D;color:#fff;border-radius:16px;overflow:hidden">
      <div style="background:#FF6B2C;padding:20px 24px"><h1 style="margin:0;font-size:18px;color:#0D0D0D">Order confirmed 🎉</h1></div>
      <div style="padding:24px">
        <p style="margin:0 0 12px;font-size:15px">Your order from <strong>${name}</strong> is confirmed and the restaurant is preparing your meal.</p>
        <p style="margin:0 0 12px;font-size:14px;color:#A1A1AA">We'll email you again as soon as it's out for delivery.</p>
        <p style="margin:0;font-size:13px;color:#71717A">Order #${shortId}</p>
      </div>
    </div>`;
  }
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#0D0D0D;color:#fff;border-radius:16px;overflow:hidden">
    <div style="background:#FF6B2C;padding:20px 24px"><h1 style="margin:0;font-size:18px;color:#0D0D0D">Out for delivery 🛵</h1></div>
    <div style="padding:24px">
      <p style="margin:0 0 12px;font-size:15px">Your order from <strong>${name}</strong> is on the way — your driver is heading to you now.</p>
      <p style="margin:0 0 12px;font-size:14px;color:#A1A1AA">Track your meal in real time from the Cravewheels app.</p>
      <p style="margin:0;font-size:13px;color:#71717A">Order #${shortId}</p>
    </div>
  </div>`;
}

function textBody(status, order) {
  const name = order.restaurant_name || 'Cravewheels';
  const shortId = String(order.id || '').slice(-6).toUpperCase();
  if (status === 'confirmed') {
    return `Your order from ${name} is confirmed and the restaurant is preparing your meal. We'll email you again once it's out for delivery. Order #${shortId}.`;
  }
  return `Your order from ${name} is out for delivery — your driver is heading to you now. Track your meal in the Cravewheels app. Order #${shortId}.`;
}

function b64urlUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { order_id, status } = body || {};

    if (!order_id || !status) {
      return Response.json({ error: 'order_id and status required' }, { status: 400 });
    }
    if (!NOTIFIABLE.has(status)) {
      return Response.json({ skipped: true, reason: 'status not notifiable' });
    }

    const order = await base44.asServiceRole.entities.Order.get(order_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status && order.status !== status) {
      return Response.json({ skipped: true, reason: 'status already changed' });
    }

    // Customer email — look up the ordering user's email via service role.
    let toEmail = null;
    if (order.created_by_id) {
      try {
        const customer = await base44.asServiceRole.entities.User.get(order.created_by_id);
        toEmail = customer?.email;
      } catch (e) {
        console.error('Failed to load customer user', e?.message);
      }
    }
    if (!toEmail) {
      return Response.json({ skipped: true, reason: 'no customer email' });
    }

    // Gmail shared connector access token (builder's authorized account).
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    if (!accessToken) {
      return Response.json({ error: 'gmail not connected' }, { status: 500 });
    }

    // Resolve the sending address from the connected Gmail profile.
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let fromEmail = 'me';
    if (profileRes.ok) {
      const profile = await profileRes.json();
      if (profile?.emailAddress) fromEmail = profile.emailAddress;
    }

    const name = order.restaurant_name || 'Cravewheels';
    const mime = createMimeMessage();
    mime.setSender({ name: 'Cravewheels', addr: fromEmail });
    mime.setRecipient(toEmail);
    mime.setSubject(SUBJECTS[status](name));
    mime.addMessage({ contentType: 'text/plain', data: textBody(status, order) });
    mime.addMessage({ contentType: 'text/html', data: htmlBody(status, order) });

    const raw = b64urlUtf8(mime.asRaw());

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gmail send failed', res.status, errText);
      return Response.json({ error: 'gmail_send_failed', detail: errText }, { status: 502 });
    }
    const data = await res.json();
    return Response.json({ sent: true, message_id: data.id, to: toEmail, status });
  } catch (error) {
    console.error('sendOrderGmailNotification error', error?.message || error);
    return Response.json({ error: error?.message || 'unexpected_error' }, { status: 500 });
  }
}