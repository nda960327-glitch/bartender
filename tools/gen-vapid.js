/* ============================================================
 *  푸시 키 만들기 (VAPID)
 *
 *  실행:  node tools/gen-vapid.js
 *
 *  npx 를 쓰지 않습니다. 윈도우 PowerShell 은 기본 설정에서 npx.ps1 같은
 *  스크립트 실행을 막아두는데, 키 두 개 만들자고 그 설정을 건드릴 이유가
 *  없어요. VAPID 키는 그냥 P-256 키쌍이라 node 에 이미 다 들어 있습니다.
 *
 *  ⚠️ Private Key 는 비밀입니다.
 *     Vercel > Settings > Environment Variables 에만 넣으세요.
 *     채팅창·이슈·커밋 어디에도 붙여넣지 마세요.
 * ============================================================ */

const { generateKeyPairSync } = require("crypto");

const b64url = (buf) => buf.toString("base64")
  .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });

/* 공개키: SPKI DER 의 맨 뒤 65바이트가 곧 좌표입니다 (0x04 || X || Y). */
const pubDer = publicKey.export({ type: "spki", format: "der" });
const pub = pubDer.subarray(pubDer.length - 65);

/* 비밀키: SEC1 DER 은 30 77 02 01 01 04 20 다음에 32바이트가 옵니다. */
const privDer = privateKey.export({ type: "sec1", format: "der" });
const at = privDer.indexOf(Buffer.from([0x04, 0x20])) + 2;
const priv = privDer.subarray(at, at + 32);

if (pub.length !== 65 || priv.length !== 32 || pub[0] !== 0x04) {
  console.error("키를 제대로 만들지 못했어요. node 버전을 확인해주세요.");
  process.exit(1);
}

console.log("");
console.log("Vercel > Settings > Environment Variables 에 아래 세 개를 넣으세요.");
console.log("넣은 뒤 Redeploy 해야 적용됩니다.");
console.log("");
console.log("VAPID_PUBLIC_KEY");
console.log("  " + b64url(pub));
console.log("");
console.log("VAPID_PRIVATE_KEY   ← 비밀. 아무 데도 붙여넣지 마세요");
console.log("  " + b64url(priv));
console.log("");
console.log("VAPID_SUBJECT");
console.log("  mailto:help@barapp.kr");
console.log("");
