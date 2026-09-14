/* 토스페이먼츠 빌링(정기결제) 호출. 비밀키는 이 파일 밖으로 나가지 않아요.
 * 문서: https://docs.tosspayments.com/reference#빌링키-발급 · #빌링키로-결제 */
const SECRET = process.env.TOSS_SECRET_KEY || "";
const BASE = "https://api.tosspayments.com/v1";

const enabled = () => !!SECRET;
const auth = () => "Basic " + Buffer.from(SECRET + ":").toString("base64");

async function call(path, body) {
  const r = await fetch(BASE + path, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: j.message || ("토스 오류 " + r.status), code: j.code };
  return { ok: true, data: j };
}

/* 카드 인증(authKey) → 빌링키 */
async function issue(authKey, customerKey) {
  const r = await call("/billing/authorizations/issue", { authKey, customerKey });
  if (!r.ok) return r;
  const c = r.data.card || {};
  return { ok: true, billingKey: r.data.billingKey, cardLabel: `${c.company || r.data.cardCompany || "카드"} ****${String(c.number || r.data.cardNumber || "").slice(-4)}` };
}

/* 빌링키로 결제 */
async function charge(billingKey, { customerKey, amount, orderId, orderName }) {
  const r = await call("/billing/" + encodeURIComponent(billingKey), { customerKey, amount, orderId, orderName });
  if (!r.ok) return r;
  return { ok: true, paymentKey: r.data.paymentKey, receiptUrl: r.data.receipt && r.data.receipt.url };
}

/* 주문번호: 영문·숫자·-·_ 로 6~64자 */
const orderId = (passId) => `pass-${passId || "new"}-${Date.now().toString(36)}`;

module.exports = { enabled, issue, charge, orderId };
