/* 공개 정책 페이지 렌더러. js/legal.js 의 내용을 그대로 표시해요. */
(function () {
  var L = window.BARTALK_LEGAL;
  var key = document.body.dataset.doc;
  var d = L && L.docs[key];
  var meta = (L && L.meta) || {};

  if (!d) {
    document.getElementById("doc").innerHTML = "<p>문서를 찾을 수 없습니다.</p>";
    return;
  }
  document.title = d.title + " · " + (meta.appName || "바텐톡");
  document.getElementById("doc-title").textContent = d.title;
  document.getElementById("doc").innerHTML = d.html;

  var OTHERS = [
    ["terms", "이용약관", "terms.html"],
    ["privacy", "개인정보처리방침", "privacy.html"],
    ["deletion", "계정 및 데이터 삭제", "account-deletion.html"],
    ["opensource", "오픈소스 라이선스", "opensource.html"],
  ];
  document.getElementById("other").innerHTML = OTHERS
    .filter(function (o) { return o[0] !== key; })
    .map(function (o) { return '<a href="' + o[2] + '">' + o[1] + "</a>"; })
    .join("");
  document.getElementById("foot").textContent =
    (meta.appName || "바텐톡") + " v" + (meta.version || "") + " · " + (meta.operator || "") + " · " + (meta.email || "");
})();
