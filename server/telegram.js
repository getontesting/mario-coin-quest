'use strict';
const crypto = require('crypto');
const config = require('./config');

function verify(initData) {
  if (!initData || typeof initData !== 'string') throw new Error('loginRequired');
  if (!config.botToken) throw new Error('BOT_TOKEN_MISSING');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) throw new Error('loginRequired');
  params.delete('hash');
  const check = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
  const expected = crypto.createHmac('sha256', secret).update(check).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('err_login_proof_reused');

  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Math.abs(Date.now() / 1000 - authDate) > 86400) throw new Error('err_login_proof_reused');

  let user;
  try { user = JSON.parse(params.get('user') || '{}'); } catch { throw new Error('loginRequired'); }
  if (!user.id) throw new Error('loginRequired');

  return {
    id: String(user.id),
    first_name: user.first_name || 'Explorer',
    last_name: user.last_name || '',
    username: user.username || '',
    photo_url: user.photo_url || '',
    is_premium: !!user.is_premium,
    language_code: (user.language_code || 'en').slice(0, 8),
    chat_instance: params.get('chat_instance') || '',
    auth_date: authDate
  };
}

module.exports = { verify };
