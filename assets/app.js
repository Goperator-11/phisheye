(function () {
  'use strict';

  const $ = function (sel) { return document.querySelector(sel); };
  const CIRC = 2 * Math.PI * 44;

  document.querySelectorAll('.tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tabs button').forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
      });
      document.querySelectorAll('.panel').forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + btn.dataset.tab);
      });
    });
  });

  const chipBox = $('#samples');
  window.PhishEyeData.SAMPLES.forEach(function (s) {
    const b = document.createElement('button');
    b.className = 'chip';
    b.type = 'button';
    b.textContent = s.name;
    b.addEventListener('click', function () {
      $('#input').value = s.text;
      analyze();
    });
    chipBox.appendChild(b);
  });

  $('#run').addEventListener('click', analyze);
  $('#clear').addEventListener('click', function () {
    $('#input').value = '';
    $('#result').classList.remove('show');
    $('#ai-out').hidden = true;
    $('#input').focus();
  });
  $('#input').addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyze();
  });

  let lastText = '';

  function analyze() {
    const text = $('#input').value.trim();
    if (!text) {
      $('#input').focus();
      return;
    }
    lastText = text;
    const r = window.PhishEyeRules.analyze(text);
    render(text, r);
    $('#result').classList.add('show');
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function render(text, r) {
    const lv = r.level.key;
    const gauge = $('#gauge-arc');
    gauge.parentElement.parentElement.className = 'gauge lv-' + lv;
    gauge.style.strokeDashoffset = String(CIRC * (1 - r.score / 100));
    $('#score').textContent = String(r.score);
    $('#score').className = 'num lv-' + lv;

    const badge = $('#level');
    badge.textContent = '위험도 ' + r.level.label;
    badge.className = 'badge bg-' + lv;
    $('#verdict-desc').textContent = r.level.desc;

    $('#excerpt').innerHTML = highlight(text, r.highlights);

    const box = $('#signals');
    box.innerHTML = '';
    if (r.signals.length === 0) {
      box.innerHTML = '<p class="empty">알려진 위험 신호가 발견되지 않았습니다. ' +
        '다만 새로운 수법은 규칙만으로 잡히지 않을 수 있으니, 링크를 누르기 전에 ' +
        '보낸 곳에 직접 전화해 확인하는 습관을 지키세요.</p>';
    }
    r.signals.forEach(function (s) {
      const el = document.createElement('div');
      el.className = 'signal' + (s.alert ? ' alert' : '');
      const hits = s.matches.slice(0, 4).map(function (m) {
        return '<span class="hit">' + esc(m.text) + '</span>';
      }).join('');
      el.innerHTML =
        '<div class="w">+' + s.weight + '</div>' +
        '<div>' +
          '<div class="cat">' + esc(s.category) + '</div>' +
          '<div class="ttl">' + esc(s.label) + '</div>' +
          '<p class="exp">' + esc(s.explain) + '</p>' +
          hits +
        '</div>';
      box.appendChild(el);
    });
    if (r.combo) {
      const el = document.createElement('div');
      el.className = 'signal alert';
      el.innerHTML =
        '<div class="w">+15</div>' +
        '<div>' +
          '<div class="cat">복합 판정</div>' +
          '<div class="ttl">사기의 3요소가 한 문자에 모두 있음</div>' +
          '<p class="exp">의심스러운 링크 + 심리적 압박 + 정보/금전 요구가 동시에 나타났습니다. ' +
          '이 조합은 정상 문자에서는 거의 나오지 않습니다.</p>' +
        '</div>';
      box.appendChild(el);
    }

    renderTodo(r);
  }

  function renderTodo(r) {
    const cats = new Set(r.signals.map(function (s) { return s.category; }));
    const items = [];

    if (r.score >= 40) {
      items.push('링크를 누르지 말고, 이미 눌렀다면 즉시 비행기모드로 전환하세요.');
      items.push('보낸 곳이 진짜인지 확인하려면 문자 속 번호가 아니라 <b>공식 홈페이지에 나온 대표번호</b>로 직접 전화하세요.');
    } else if (r.score >= 20) {
      items.push('링크를 누르기 전에 도메인이 공식 주소가 맞는지 검색해서 확인하세요.');
    } else {
      items.push('뚜렷한 위험 신호는 없지만, 링크는 항상 앱이나 공식 홈페이지로 직접 들어가서 확인하는 게 안전합니다.');
    }

    if (cats.has('정보 탈취')) items.push('인증번호·주민번호·비밀번호는 <b>어떤 상황에서도</b> 문자로 보내지 마세요.');
    if (cats.has('금전 요구')) items.push('이미 송금했다면 지금 바로 <b>112</b> 또는 은행 콜센터에 지급정지를 요청하세요.');
    if (cats.has('악성 앱')) items.push('설치한 앱이 있다면 삭제하고, 삭제가 안 되면 안전모드로 부팅해 지우세요.');
    if (cats.has('지인 사칭')) items.push('가족이 맞는지 <b>원래 알던 번호로 직접 전화</b>해서 확인하세요.');
    if (cats.has('청소년 표적')) items.push('혼자 판단하지 말고 부모님이나 선생님께 문자를 그대로 보여주세요.');
    if (r.signals.some(function (s) { return s.id === 'mule_account'; })) {
      items.push('통장·체크카드는 <b>절대 넘기지 마세요.</b> 넘기면 피해자가 아니라 공범으로 처벌받고 모든 계좌가 정지됩니다.');
    }
    if (r.signals.some(function (s) { return s.id === 'sextortion'; })) {
      items.push('협박을 받고 있다면 돈을 보내지 말고 <b>112</b> 또는 디지털성범죄피해자지원센터(02-735-8994)에 연락하세요. 당신 잘못이 아닙니다.');
    }

    if (r.score >= 40) {
      items.push('스팸 신고: 문자 앱에서 신고하거나 <b>118</b>(한국인터넷진흥원)로 전화하세요.');
    }

    const ul = $('#todo');
    ul.innerHTML = '';
    items.forEach(function (t, i) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="n">' + (i + 1) + '</span><span>' + t + '</span>';
      ul.appendChild(li);
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function highlight(text, spans) {
    if (!spans.length) return esc(text);
    let out = '';
    let cursor = 0;
    spans.forEach(function (s) {
      if (s.start < cursor) return;
      out += esc(text.slice(cursor, s.start));
      out += '<mark>' + esc(text.slice(s.start, s.end)) + '</mark>';
      cursor = s.end;
    });
    out += esc(text.slice(cursor));
    return out;
  }

  const KEY_STORE = 'phisheye.apikey';
  try {
    const saved = localStorage.getItem(KEY_STORE);
    if (saved) $('#apikey').value = saved;
  } catch (e) {}

  $('#run-ai').addEventListener('click', async function () {
    const key = $('#apikey').value.trim();
    const text = $('#input').value.trim() || lastText;
    const out = $('#ai-out');

    if (!text) { $('#input').focus(); return; }
    if (!key) {
      out.hidden = false;
      out.textContent = 'API 키를 입력해야 AI 정밀 분석을 쓸 수 있습니다. 키 없이도 위의 규칙 분석은 그대로 동작합니다.';
      return;
    }
    try { localStorage.setItem(KEY_STORE, key); } catch (e) {}

    out.hidden = false;
    out.textContent = '분석 중...';
    $('#run-ai').disabled = true;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-opus-5',
          max_tokens: 1500,
          output_config: { effort: 'low' },
          system: '너는 한국 청소년에게 사기 문자를 설명해주는 보안 도우미다. ' +
            '전문용어를 피하고 고등학생이 이해할 수 있는 말로, 반드시 한국어로 답한다. ' +
            '겁을 주기보다 무엇을 하면 되는지 알려준다. ' +
            '아래 형식으로만 답하고 다른 말은 붙이지 마라.\n' +
            '판정: (안전 / 주의 / 위험 / 매우 위험 중 하나)\n' +
            '이유: (2~3문장)\n' +
            '수법: (이 문자가 쓰는 사기 수법 이름)\n' +
            '할 일: (구체적인 행동 1~3개)',
          messages: [{ role: 'user', content: '다음 문자를 분석해줘.\n\n---\n' + text + '\n---' }]
        })
      });

      if (!res.ok) {
        const detail = await res.text();
        console.warn('[피싱아이] API 응답', res.status, detail);
        throw new Error(explainHttpError(res.status));
      }
      const data = await res.json();
      const answer = (data.content || [])
        .filter(function (b) { return b.type === 'text'; })
        .map(function (b) { return b.text; })
        .join('\n')
        .trim();
      out.textContent = answer || '응답이 비어 있습니다.';
    } catch (err) {
      const isNetwork = (err instanceof TypeError);
      out.textContent = (isNetwork
        ? '인터넷 연결이 끊겼거나 요청이 차단됐습니다.'
        : err.message) +
        '\n\nAI 분석은 보조 기능입니다. 위의 규칙 분석 결과는 그대로 유효합니다.';
    } finally {
      $('#run-ai').disabled = false;
    }
  });

  function explainHttpError(status) {
    if (status === 401) return 'API 키가 올바르지 않습니다. 키를 다시 확인해주세요.';
    if (status === 403) return '이 키로는 요청할 권한이 없습니다.';
    if (status === 429) return '요청이 너무 몰렸습니다. 잠시 후 다시 시도해주세요.';
    if (status === 400) return '요청 형식에 문제가 있습니다. 문자가 너무 길지 않은지 확인해주세요.';
    if (status >= 500) return 'AI 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
    return 'AI 분석을 불러오지 못했습니다. (오류 ' + status + ')';
  }

  const QUIZ = window.PhishEyeData.QUIZ;
  let qOrder = [];
  let qIndex = 0;
  let qScore = 0;
  let answered = false;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function startQuiz() {
    qOrder = shuffle(QUIZ);
    qIndex = 0;
    qScore = 0;
    $('#quiz-done').hidden = true;
    $('#quiz-live').hidden = false;
    showQuestion();
  }

  function showQuestion() {
    answered = false;
    const q = qOrder[qIndex];
    $('#quiz-text').textContent = q.text;
    $('#quiz-count').textContent = (qIndex + 1) + ' / ' + qOrder.length;
    $('#quiz-score').textContent = '맞힌 개수 ' + qScore;
    $('#quiz-bar').style.width = (qIndex / qOrder.length * 100) + '%';
    $('#quiz-feedback').hidden = true;
    $('#quiz-next-row').hidden = true;
    document.querySelectorAll('.quiz-actions .btn').forEach(function (b) { b.disabled = false; });
  }

  document.querySelectorAll('.quiz-actions .btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (answered) return;
      answered = true;
      const q = qOrder[qIndex];
      const said = btn.dataset.ans === 'scam';
      const correct = said === q.isScam;
      if (correct) qScore++;

      const fb = $('#quiz-feedback');
      fb.className = 'feedback ' + (correct ? 'ok' : 'no');
      fb.innerHTML = '<b>' + (correct ? '정답' : '오답') + ' · ' +
        (q.isScam ? '사기 문자입니다' : '정상 문자입니다') + '</b>' +
        '<div style="font-size:13px;opacity:.75;margin-bottom:6px">핵심 단서: ' + esc(q.key) + '</div>' +
        esc(q.explain);
      fb.hidden = false;

      $('#quiz-score').textContent = '맞힌 개수 ' + qScore;
      $('#quiz-next-row').hidden = false;
      $('#quiz-next').textContent = (qIndex + 1 >= qOrder.length) ? '결과 보기' : '다음 문제';
      document.querySelectorAll('.quiz-actions .btn').forEach(function (b) { b.disabled = true; });
    });
  });

  $('#quiz-next').addEventListener('click', function () {
    qIndex++;
    if (qIndex >= qOrder.length) {
      finishQuiz();
    } else {
      showQuestion();
    }
  });

  function finishQuiz() {
    $('#quiz-live').hidden = true;
    $('#quiz-done').hidden = false;
    $('#quiz-bar').style.width = '100%';
    $('#quiz-count').textContent = qOrder.length + ' / ' + qOrder.length;
    $('#quiz-score').textContent = '맞힌 개수 ' + qScore;

    const rate = qScore / qOrder.length;
    let title, desc;
    if (rate === 1) {
      title = qOrder.length + '문제 전부 정답';
      desc = '사기 문자를 정확히 구분하고 있습니다. 주변 친구들에게도 알려주세요.';
    } else if (rate >= 0.7) {
      title = qOrder.length + '문제 중 ' + qScore + '개 정답';
      desc = '대체로 잘 구분합니다. 틀린 문제의 단서를 다시 한 번 확인해보세요.';
    } else if (rate >= 0.4) {
      title = qOrder.length + '문제 중 ' + qScore + '개 정답';
      desc = '아직 헷갈리는 유형이 있습니다. 링크·개인정보 요구·시간 압박, 이 세 가지를 먼저 보는 습관을 들이세요.';
    } else {
      title = qOrder.length + '문제 중 ' + qScore + '개 정답';
      desc = '지금 상태로는 실제 문자를 받으면 위험합니다. 한 번 더 풀어보면서 해설을 꼭 읽어보세요.';
    }
    $('#quiz-result-title').textContent = title;
    $('#quiz-result-desc').textContent = desc;
  }

  $('#quiz-restart').addEventListener('click', startQuiz);
  startQuiz();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) {
        console.warn('[피싱아이] 오프라인 준비 실패', e);
      });
    });
  }

  const params = new URLSearchParams(location.search);
  const shared = [params.get('title'), params.get('text'), params.get('url')]
    .filter(Boolean).join('\n').trim();
  if (shared) {
    $('#input').value = shared;
    analyze();
    history.replaceState(null, '', location.pathname);
  }

  const tab = params.get('tab');
  if (tab) {
    const btn = document.querySelector('.tabs button[data-tab="' + tab + '"]');
    if (btn) btn.click();
  }

  function showNetworkState() {
    const note = $('#privacy-note');
    if (navigator.onLine) {
      note.textContent = '입력한 문자는 서버로 전송되지 않습니다';
      note.classList.remove('offline');
    } else {
      note.textContent = '오프라인 — 인터넷 없이도 판별됩니다';
      note.classList.add('offline');
    }
  }
  window.addEventListener('online', showNetworkState);
  window.addEventListener('offline', showNetworkState);
  showNetworkState();
})();
