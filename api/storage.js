/**
 * Vercel Serverless Storage & Personal Auth Endpoint (/api/storage)
 *
 * Zero-dependency Serverless Function for personal D&D 3.5e Character + Master DB storage.
 *
 * Auto-detects any Vercel Storage / Upstash Redis / Vercel KV environment variables
 * and supports UTF-8 / Turkish characters in APP_PIN via URI component decoding.
 */

const STORAGE_KEY = process.env.STORAGE_KEY || 'dnd35_universal_state_v1';
const PIN_STORAGE_KEY = 'dnd35_vault_pin_v1';

function safeDecodePin(rawVal) {
  if (rawVal === null || rawVal === undefined) return '';
  const str = String(rawVal).trim();
  if (!str) return '';
  try {
    return decodeURIComponent(str).trim();
  } catch (e) {
    return str;
  }
}

// Automatically find KV / Upstash URL and Token even if user added a custom prefix in Vercel Storage
function resolveKvCredentials(headers = {}) {
  let url = String(
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    headers['x-upstash-url'] ||
    ''
  ).trim();

  let token = String(
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    headers['x-upstash-token'] ||
    ''
  ).trim();

  if (!url || !token) {
    const envKeys = Object.keys(process.env || {});
    if (!url) {
      const urlKey = envKeys.find(k =>
        (k.endsWith('_KV_REST_API_URL') || k.endsWith('_REDIS_REST_URL') || k.endsWith('_REST_API_URL')) &&
        !k.includes('READ_ONLY')
      );
      if (urlKey) url = String(process.env[urlKey] || '').trim();
    }
    if (!token) {
      const tokenKey = envKeys.find(k =>
        (k.endsWith('_KV_REST_API_TOKEN') || k.endsWith('_REDIS_REST_TOKEN') || k.endsWith('_REST_API_TOKEN')) &&
        !k.includes('READ_ONLY')
      );
      if (tokenKey) token = String(process.env[tokenKey] || '').trim();
    }
  }

  return {
    kvUrl: url.replace(/\/$/, ''),
    kvToken: token
  };
}

async function kvGet(kvUrl, kvToken, key) {
  const res = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${kvToken}` }
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`KV GET (${res.status}): ${errText}`);
  }
  const json = await res.json();
  return json ? json.result : null;
}

async function kvSet(kvUrl, kvToken, key, value) {
  const res = await fetch(kvUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${kvToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['SET', key, typeof value === 'string' ? value : JSON.stringify(value)])
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`KV SET (${res.status}): ${errText}`);
  }
  return true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-pin, x-upstash-url, x-upstash-token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { kvUrl, kvToken } = resolveKvCredentials(req.headers || {});
  const hasKv = Boolean(kvUrl && kvToken);
  const clientPin = safeDecodePin(req.headers['x-app-pin'] || (req.query && req.query.pin) || '');

  // Detect any storage-related env key names for diagnostics (never expose values)
  const detectedStorageEnvKeys = Object.keys(process.env || {}).filter(k =>
    /KV|REDIS|UPSTASH|BLOB|STORAGE|POSTGRES|DATABASE|APP_PIN/i.test(k)
  );

  // Resolve active PIN: 1) Env var APP_PIN if defined, 2) Otherwise check Upstash KV `dnd35_vault_pin_v1`
  let activePin = safeDecodePin(process.env.APP_PIN || process.env.APP_PASSWORD || '');
  let pinSource = activePin ? 'env' : 'none';

  if (!activePin && hasKv) {
    try {
      const dbPinRaw = await kvGet(kvUrl, kvToken, PIN_STORAGE_KEY);
      const dbPin = safeDecodePin(dbPinRaw);
      if (dbPin) {
        activePin = dbPin;
        pinSource = 'db';
      } else if (clientPin) {
        // First-time auto-registration: if DB has no PIN yet and client sent a saved PIN from Settings, persist it now
        await kvSet(kvUrl, kvToken, PIN_STORAGE_KEY, clientPin);
        activePin = clientPin;
        pinSource = 'db';
      }
    } catch (e) {
      // Ignore PIN read error during status check
    }
  }

  const pinRequired = Boolean(activePin);
  const authenticated = !pinRequired || (clientPin.length > 0 && clientPin === activePin);

  // 1. Status / Handshake Check (GET /api/storage?action=status)
  if (req.method === 'GET' && req.query && req.query.action === 'status') {
    return res.status(200).json({
      ok: true,
      configured: hasKv,
      provider: hasKv ? 'vercel-upstash-kv' : 'unconfigured',
      pinRequired,
      pinSource,
      authenticated,
      detectedStorageEnvKeys
    });
  }

  // 2. Verify Storage Backend Configuration
  if (!hasKv) {
    return res.status(503).json({
      ok: false,
      configured: false,
      pinRequired,
      authenticated,
      detectedStorageEnvKeys,
      error: 'Vercel veritabanı henüz bağlanmamış veya veritabanı bağlandıktan sonra Redeploy yapılmamış.'
    });
  }

  // 3. Set or Update Personal PIN directly from the Web App Settings Modal (POST /api/storage?action=setPin)
  if (req.method === 'POST' && req.query && req.query.action === 'setPin') {
    if (pinSource === 'env') {
      return res.status(400).json({
        ok: false,
        error: 'Şifreniz Vercel Environment Variables (APP_PIN) üzerinden sabitlenmiş. Değiştirmek için Vercel panelini kullanın.'
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const newPin = safeDecodePin((body && body.newPin !== undefined) ? body.newPin : clientPin);

    try {
      await kvSet(kvUrl, kvToken, PIN_STORAGE_KEY, newPin);
      return res.status(200).json({
        ok: true,
        pinRequired: Boolean(newPin),
        authenticated: true,
        message: newPin
          ? '🔒 Kişisel Kasa Şifreniz (APP_PIN) doğrudan veritabanına kaydedildi!'
          : '🔓 Kişisel Kasa Şifresi kaldırıldı.'
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 4. Enforce Personal PIN / Password Protection
  if (pinRequired && !authenticated) {
    return res.status(401).json({
      ok: false,
      pinRequired: true,
      authenticated: false,
      error: 'Bu uygulama özeldir. Erişim için geçerli Uygulama Şifresi (APP_PIN) gereklidir.'
    });
  }

  try {
    // =========================================================================
    // GET: Pull Character + Master DB from Vercel / Upstash KV
    // =========================================================================
    if (req.method === 'GET') {
      const rawResult = await kvGet(kvUrl, kvToken, STORAGE_KEY);
      if (rawResult === null || rawResult === undefined || rawResult === '') {
        return res.status(200).json({
          ok: true,
          empty: true,
          data: null
        });
      }

      let parsedData = rawResult;
      let parseAttempts = 0;
      while (typeof parsedData === 'string' && parseAttempts < 3) {
        parseAttempts++;
        try {
          parsedData = JSON.parse(parsedData);
        } catch (parseErr) {
          return res.status(500).json({
            ok: false,
            error: 'Buluttaki JSON verisi ayrıştırılamadı.'
          });
        }
      }

      return res.status(200).json({
        ok: true,
        empty: false,
        data: parsedData
      });
    }

    // =========================================================================
    // POST: Push Character + Master DB to Vercel / Upstash KV
    // =========================================================================
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ ok: false, error: 'Geçersiz JSON gövdesi.' });
        }
      }

      if (!body || typeof body !== 'object') {
        return res.status(400).json({ ok: false, error: 'Kaydedilecek veri bulunamadı.' });
      }

      if (!pinRequired && clientPin) {
        try {
          await kvSet(kvUrl, kvToken, PIN_STORAGE_KEY, clientPin);
        } catch (e) {}
      }

      const payloadToStore = {
        version: 2,
        lastModified: body.lastModified || new Date().toISOString(),
        character: body.character || null,
        masterDb: Array.isArray(body.masterDb) ? body.masterDb : null
      };

      await kvSet(kvUrl, kvToken, STORAGE_KEY, JSON.stringify(payloadToStore));

      return res.status(200).json({
        ok: true,
        lastModified: payloadToStore.lastModified
      });
    }

    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Vercel Storage Error:', err);
    return res.status(500).json({
      ok: false,
      error: 'Sunucu hatası: ' + (err.message || String(err))
    });
  }
};
