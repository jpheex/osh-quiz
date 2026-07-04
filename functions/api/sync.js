const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function bad(message, status = 400) {
  return json({ error: message }, status);
}

function userIdFromUrl(url) {
  const userId = url.searchParams.get("userId")?.trim();
  if (!userId || userId.length > 128) return null;
  return userId;
}

async function readRow(db, userId) {
  return db
    .prepare(
      "SELECT user_id, progress_json, session_json, app_version, updated_at FROM user_data WHERE user_id = ?"
    )
    .bind(userId)
    .first();
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-methods": "GET, PUT, DELETE, OPTIONS",
        "access-control-allow-headers": "content-type",
      },
    });
  }

  if (method === "GET") {
    const userId = userIdFromUrl(url);
    if (!userId) return bad("缺少 userId");

    const row = await readRow(env.DB, userId);
    if (!row) {
      return json({ userId, progress: null, session: null, updatedAt: null });
    }

    return json({
      userId: row.user_id,
      progress: JSON.parse(row.progress_json),
      session: row.session_json ? JSON.parse(row.session_json) : null,
      appVersion: row.app_version,
      updatedAt: row.updated_at,
    });
  }

  if (method === "PUT") {
    let body;
    try {
      body = await request.json();
    } catch {
      return bad("JSON 格式錯誤");
    }

    const userId = String(body.userId || "").trim();
    if (!userId || userId.length > 128) return bad("缺少 userId");
    if (!body.progress || typeof body.progress !== "object") return bad("缺少 progress");

    const progressJson = JSON.stringify(body.progress);
    const sessionJson = body.session ? JSON.stringify(body.session) : null;
    const appVersion = String(body.appVersion || "");
    const updatedAt = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO user_data (user_id, progress_json, session_json, app_version, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         progress_json = excluded.progress_json,
         session_json = excluded.session_json,
         app_version = excluded.app_version,
         updated_at = excluded.updated_at`
    )
      .bind(userId, progressJson, sessionJson, appVersion, updatedAt)
      .run();

    return json({ ok: true, userId, updatedAt });
  }

  if (method === "DELETE") {
    const userId = userIdFromUrl(url);
    if (!userId) return bad("缺少 userId");

    await env.DB.prepare("DELETE FROM user_data WHERE user_id = ?").bind(userId).run();
    return json({ ok: true, userId });
  }

  return bad("不支援的方法", 405);
}
