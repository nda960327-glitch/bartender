/* ============================================================
 *  발행 시각 잡기 (한국 시간 기준)
 *
 *  정각에 딱딱 올라가면 기계가 하는 티가 납니다. 그래서
 *    · 사람이 앱을 보는 시간대에 가중치를 주고
 *    · 분 단위는 무작위로 흩고
 *    · 하루 개수와 최소 간격을 지킵니다.
 *
 *  한국은 서머타임이 없어서 UTC+9 고정으로 계산해도 정확합니다.
 * ============================================================ */

const KST_OFFSET_MIN = 9 * 60;

export function kstParts(date = new Date()) {
  const t = new Date(new Date(date).getTime() + KST_OFFSET_MIN * 60000);
  return {
    y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(),
    h: t.getUTCHours(), mi: t.getUTCMinutes(),
  };
}

export function fromKst(y, m, d, h, mi) {
  return new Date(Date.UTC(y, m, d, h, mi) - KST_OFFSET_MIN * 60000);
}

export function fmtKst(date) {
  const p = kstParts(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`;
}

/* 바텐더는 오후(출근 전)와 늦은 밤(마감 후)에 앱을 봅니다. */
const HOUR_WEIGHT = {
  9: 1, 10: 2, 11: 3, 12: 3, 13: 4, 14: 5, 15: 5, 16: 4, 17: 3,
  18: 2, 19: 2, 20: 3, 21: 4, 22: 5, 23: 4, 0: 3, 1: 2,
};

export function isQuiet(hour, from, to) {
  if (from === to) return false;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

function weightedPick(pool) {
  const total = pool.reduce((s, h) => s + HOUR_WEIGHT[h], 0);
  let r = Math.random() * total;
  for (const h of pool) {
    r -= HOUR_WEIGHT[h];
    if (r <= 0) return h;
  }
  return pool[pool.length - 1];
}

/** 0시·1시는 "그 날 밤"이므로 정렬할 때 뒤로 보냅니다. */
const dayOrder = (h) => (h < 6 ? h + 24 : h);

/**
 * @param {number} count  잡아야 할 개수
 * @param {object} opts
 *   perDay      하루 최대 몇 건
 *   minGapMin   직전 발행과 최소 몇 분 간격
 *   quietFrom   조용한 시간 시작 (시)
 *   quietTo     조용한 시간 끝 (시)
 *   startAfter  이 시각 이후부터 (Date)
 *   existing    이미 예약된 시각들 (ISO 문자열 배열)
 * @returns {Date[]} 오름차순
 */
export function makeSchedule(count, opts) {
  const {
    perDay = 3,
    minGapMin = 90,
    quietFrom = 2,
    quietTo = 9,
    startAfter = new Date(),
    existing = [],
  } = opts || {};

  const allowed = Object.keys(HOUR_WEIGHT).map(Number)
    .filter((h) => !isQuiet(h, quietFrom, quietTo))
    .sort((a, b) => dayOrder(a) - dayOrder(b));

  if (!allowed.length) {
    throw new Error("발행 가능한 시간대가 없습니다. 조용한 시간 설정을 확인하세요.");
  }
  if (perDay < 1) throw new Error("하루 발행 개수는 1 이상이어야 합니다.");

  // 이미 예약된 것들과도 간격을 지켜야 합니다.
  const taken = existing.map((t) => new Date(t).getTime()).filter(Number.isFinite).sort((a, b) => a - b);
  const perDayCount = new Map();
  const dayKeyOf = (ms) => {
    const p = kstParts(new Date(ms));
    return `${p.y}-${p.m}-${p.d}`;
  };
  for (const t of taken) perDayCount.set(dayKeyOf(t), (perDayCount.get(dayKeyOf(t)) || 0) + 1);

  const floor = Math.max(new Date(startAfter).getTime(), Date.now() + 3 * 60000);
  const out = [];
  let last = -Infinity;
  for (const t of taken) if (t <= floor) last = t;

  const start = kstParts(new Date(floor));

  for (let offset = 0; offset < 400 && out.length < count; offset++) {
    const base = kstParts(fromKst(start.y, start.m, start.d + offset, 12, 0));
    const dayKey = `${base.y}-${base.m}-${base.d}`;
    const room = perDay - (perDayCount.get(dayKey) || 0);
    if (room <= 0) continue;

    // 그날 쓸 시간대를 겹치지 않게 뽑습니다
    const pool = allowed.slice();
    const hours = [];
    while (hours.length < room && pool.length) {
      const h = weightedPick(pool);
      hours.push(h);
      pool.splice(pool.indexOf(h), 1);
    }
    hours.sort((a, b) => dayOrder(a) - dayOrder(b));

    for (const h of hours) {
      if (out.length >= count) break;
      const t = fromKst(base.y, base.m, base.d + (h < 6 ? 1 : 0), h, Math.floor(Math.random() * 60)).getTime();

      if (t < floor) continue;
      if (t - last < minGapMin * 60000) continue;   // 간격이 안 되면 이 자리는 포기
      if (taken.some((x) => Math.abs(x - t) < minGapMin * 60000)) continue;

      out.push(new Date(t));
      perDayCount.set(dayKey, (perDayCount.get(dayKey) || 0) + 1);
      last = t;
    }
  }

  return out;
}
