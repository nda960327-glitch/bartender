/* ============================================================
 *  Supabase REST 최소 클라이언트 (외부 의존성 없음)
 *
 *  service_role 키로 붙기 때문에 RLS 를 전부 통과합니다.
 *  이 파일을 쓰는 코드는 내 PC 나 서버에서만 돌아야 해요.
 * ============================================================ */

import fs from "node:fs";
import path from "node:path";

/* ---------- .env 읽기 ---------- */

function parseEnv(text) {
  const out = {};
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

/** .env.local → .env 순으로 읽고, 실제 환경변수가 항상 이깁니다. */
export function loadEnv(root) {
  const merged = {};
  for (const name of [".env", ".env.local"]) {
    const p = path.join(root, name);
    if (fs.existsSync(p)) Object.assign(merged, parseEnv(fs.readFileSync(p, "utf8")));
  }
  for (const k of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "CRON_SECRET"]) {
    if (process.env[k]) merged[k] = process.env[k];
  }
  return merged;
}

/* ---------- 클라이언트 ---------- */

export function createClient(url, serviceKey) {
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.\n" +
      "  .env.example 을 .env.local 로 복사해서 값을 채워주세요."
    );
  }
  const base = url.replace(/\/+$/, "") + "/rest/v1";
  const baseHeaders = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  };

  async function request(method, pathAndQuery, { body, prefer } = {}) {
    const headers = { ...baseHeaders };
    if (prefer) headers.Prefer = prefer;

    const res = await fetch(base + pathAndQuery, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      let detail = text;
      try {
        const j = JSON.parse(text);
        detail = j.message || j.hint || text;
      } catch (_) { /* 원문 사용 */ }

      // 제일 흔한 실수: SQL 을 아직 안 돌린 경우. 원문 에러만 보면 뭘 해야 할지 몰라요.
      if (/content_queue|content_settings|is_official|official_label|publish_due_content/.test(detail)
          && /does not exist|schema cache|찾을 수 없/i.test(detail)) {
        throw new Error(
          "먼저 supabase/official.sql 을 실행해 주세요.\n" +
          "  Supabase 대시보드 > SQL Editor 에 파일 내용을 통째로 붙여넣고 Run 하시면 됩니다.\n" +
          `  (원인: ${detail})`
        );
      }
      if (/JWT|Invalid API key|invalid signature/i.test(detail)) {
        throw new Error(
          "키가 올바르지 않습니다.\n" +
          "  .env.local 의 SUPABASE_SERVICE_ROLE_KEY 를 확인하세요.\n" +
          "  대시보드 > Project Settings > API Keys > service_role  (anon 키가 아닙니다)\n" +
          `  (원인: ${detail})`
        );
      }

      throw new Error(`Supabase ${res.status} ${method} ${pathAndQuery}\n  ${detail}`);
    }
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_) {
      return text;
    }
  }

  return {
    /** select("content_queue", "select=*&status=eq.draft&limit=20") */
    select: (table, query = "select=*") => request("GET", `/${table}?${query}`),

    /** 중복(dedupe_key)은 조용히 무시하고 넣습니다. */
    insertIgnore: (table, rows, conflictCol) =>
      request("POST", `/${table}?on_conflict=${conflictCol}&select=id`, {
        body: rows,
        prefer: "resolution=ignore-duplicates,return=representation",
      }),

    insert: (table, rows) =>
      request("POST", `/${table}?select=*`, { body: rows, prefer: "return=representation" }),

    /** update("content_queue", "id=eq.3", { status: "approved" }) */
    update: (table, filter, patch) =>
      request("PATCH", `/${table}?${filter}&select=*`, { body: patch, prefer: "return=representation" }),

    rpc: (fn, args = {}) => request("POST", `/rpc/${fn}`, { body: args }),

    /** 조건에 맞는 행 개수만. */
    async count(table, filter = "") {
      const res = await fetch(`${base}/${table}?select=id${filter ? "&" + filter : ""}`, {
        method: "HEAD",
        headers: { ...baseHeaders, Prefer: "count=exact", Range: "0-0" },
      });
      const cr = res.headers.get("content-range") || "";
      const n = parseInt(cr.split("/")[1], 10);
      return Number.isFinite(n) ? n : 0;
    },
  };
}
