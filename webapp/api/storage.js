/**
 * Vercel Serverless Storage & Personal Auth Endpoint (/api/storage)
 *
 * Zero-dependency Serverless Function for personal D&D 3.5e Character + Master DB storage.
 *
 * Supported Vercel Environment Variables:
 * 1. APP_PIN (or APP_PASSWORD):
 *    - Personal password/PIN to make the deployed web app strictly private to the owner.
 * 2. KV_REST_API_URL & KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN):
 *    - Automatically added when connecting "Upstash Redis / Vercel KV" from Vercel Marketplace -> Storage.
 * 3. BLOB_READ_WRITE_TOKEN (Optional alternative):
 *    - Automatically added if the user connects "Vercel Blob" storage instead of KV/Redis.
 */

const STORAGE_KEY = process.env.STORAGE_KEY || 'dnd35_universal_state_v1';

module.exports = async function handler(req, res) {
  // Set CORS headers for same-origin and local testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-pin, x-upstash-url, x-upstash-token');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Resolve Environment & Optional Client-Supplied Credentials
  const serverPin = String(process.env.APP_PIN || process.env.APP_PASSWORD || '').trim();
  const clientPin = String(req.headers['x-app-pin'] || (req.query && req.query.pin) || '').trim();

  const kvUrl = String(
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    req.headers['x-upstash-url'] ||
    ''
  ).trim().replace(/\/$/, '');

  const kvToken = String(
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    req.headers['x-upstash-token'] ||
    ''
  ).trim();

  const hasKv = Boolean(kvUrl && kvToken);
  const pinRequired = Boolean(serverPin);
  const authenticated = !pinRequired || (clientPin.length > 0 && clientPin === serverPin);

  // 2. Status / Handshake Check (GET /api/storage?action=status)
  if (req.method === 'GET' && req.query && req.query.action === 'status') {
    return res.status(200).json({
      ok: true,
      configured: hasKv,
      provider: hasKv ? 'vercel-upstash-kv' : 'unconfigured',
      pinRequired,
      authenticated
    });
  }

  // 3. Enforce Personal PIN / Password Protection
  if (pinRequired && !authenticated) {
    return res.status(401).json({
      ok: false,
      pinRequired: true,
      authenticated: false,
      error: 'Bu uygulama özeldir. Erişim için geçerli Uygulama Şifresi (APP_PIN) gereklidir.'
    });
  }

  // 4. Verify Storage Backend Configuration
  if (!hasKv) {
    return res.status(503).json({
      ok: false,
      configured: false,
      pinRequired,
      authenticated,
      error: 'Vercel veritabanı henüz bağlanmamış. Vercel panelinden Storage -> Upstash Redis (KV) ekleyin veya Ayarlar ekranından Upstash URL/Token girin.'
    });
  }

  try {
    // =========================================================================
    // GET: Pull Character + Master DB from Vercel / Upstash KV
    // =========================================================================
    if (req.method === 'GET') {
      const response = await fetch(`${kvUrl}/get/${encodeURIComponent(STORAGE_KEY)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${kvToken}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          ok: false,
          error: `Veritabanı okuma hatası (${response.status}): ${errText}`
        });
      }

      const resultJson = await response.json();
      if (!resultJson || resultJson.result === null || resultJson.result === undefined) {
        return res.status(200).json({
          ok: true,
          empty: true,
          data: null
        });
      }

      let parsedData = resultJson.result;
      if (typeof parsedData === 'string') {
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

      const payloadToStore = {
        version: 2,
        lastModified: body.lastModified || new Date().toISOString(),
        character: body.character || null,
        masterDb: Array.isArray(body.masterDb) ? body.masterDb : null
      };

      // Upstash REST API standard command array: ["SET", key, serializedValue]
      const saveResp = await fetch(kvUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', STORAGE_KEY, JSON.stringify(payloadToStore)])
      });

      if (!saveResp.ok) {
        const errText = await saveResp.text();
        return res.status(saveResp.status).json({
          ok: false,
          error: `Veritabanı yazma hatası (${saveResp.status}): ${errText}`
        });
      }

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
