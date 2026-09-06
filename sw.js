/*
 * 피싱아이 서비스워커
 *
 * 목적은 단 하나 — 인터넷이 없어도 판별이 되게 하는 것.
 * 탐지 엔진이 전부 브라우저 안에서 돌기 때문에, 파일만 캐시해두면
 * 데이터가 끊긴 상태에서도 앱이 그대로 작동한다.
 *
 * 파일을 고칠 때마다 VERSION 을 올려야 한다. 안 올리면 사용자는
 * 옛날 캐시를 계속 본다.
 */
const VERSION = 'phisheye-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/style.css',
  './assets/rules.js',
  './assets/samples.js',
  './assets/app.js',
  './assets/icon.svg',
  './assets/icon-app.svg',
  './assets/icon-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      // 하나라도 실패하면 설치 전체가 실패하므로 개별로 담는다
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // GET 이 아니거나 다른 출처면 손대지 않는다.
  // 특히 Anthropic API 응답은 절대 캐시하면 안 된다 —
  // 사용자가 넣은 문자와 그 분석 결과가 디스크에 남는다.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // 페이지 이동(공유 시트로 들어온 ?text=... 포함)은 항상 index.html 로 받는다
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // 정적 파일은 캐시 우선. 없으면 받아오고 조용히 캐시에 넣는다.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
