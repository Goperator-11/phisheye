(function (global) {
  'use strict';

  const RULES = [
    {
      id: 'urgency',
      category: '심리 압박',
      label: '급하게 재촉하는 표현',
      weight: 14,
      patterns: [/즉시|당장|긴급/g, /오늘\s*내|오늘까지|마감\s*임박|마지막\s*기회/g,
                 /\d+\s*시간\s*(이내|안에|남았)/g, /자동\s*(결제|승인|해지)/g],
      explain: '사기 문자는 생각할 시간을 주지 않으려고 시간을 압박합니다. 진짜 기관은 문자로 몇 시간 안에 처리하라고 하지 않습니다.'
    },
    {
      id: 'threat',
      category: '심리 압박',
      label: '불이익·처벌을 암시',
      weight: 16,
      patterns: [/미납|연체|압류|고발|고소|수사|출석\s*요구|과태료|벌금/g,
                 /계정\s*(정지|잠금|해지|삭제)/g, /법적\s*(조치|책임)/g],
      explain: '겁을 줘서 링크를 누르게 만드는 전형적인 수법입니다.'
    },

    {
      id: 'credential',
      category: '정보 탈취',
      label: '개인정보·인증정보를 요구',
      weight: 22,
      patterns: [/주민(등록)?번호|계좌번호|카드번호|비밀번호|비번/g,
                 /인증번호|인증\s*코드|OTP/gi, /신분증|여권|학생증\s*사진/g],
      explain: '어떤 공공기관·은행·학교도 문자로 인증번호나 주민번호를 묻지 않습니다. 요구하는 순간 사기로 보면 됩니다.'
    },
    {
      id: 'money',
      category: '금전 요구',
      label: '송금·결제·상품권을 요구',
      weight: 20,
      patterns: [/송금|입금|이체|계좌로\s*보내/g, /문화상품권|문상|기프트카드|구글\s*기프트/g,
                 /선입금|보증금|수수료\s*(입금|결제)/g, /가상\s*계좌/g],
      explain: '문화상품권·기프트카드 코드를 요구하는 건 추적을 피하려는 사기의 대표 신호입니다.'
    },
    {
      id: 'app_install',
      category: '악성 앱',
      weight: 30,
      label: '앱 설치·원격제어를 유도',
      patterns: [/APK/gi, /설치\s*(파일|링크|후|하세요|해주세요|해줘)/g, /다운(로드)?\s*(받|하)/g,
                 /출처를?\s*알\s*수\s*없는\s*앱/g,
                 /원격\s*(제어|지원)|팀뷰어|TeamViewer|AnyDesk/gi],
      explain: 'APK 설치나 원격제어 앱은 휴대폰을 통째로 넘기는 행위입니다. 문자로 온 설치 요청은 무조건 거부하세요.'
    },

    {
      id: 'impersonation_gov',
      category: '기관 사칭',
      label: '공공기관·금융기관을 사칭',
      weight: 12,
      patterns: [/국세청|경찰청|검찰청|법원|질병관리청|교육청|금융감독원|건강보험/g,
                 /국민은행|국민연금|신한|우리은행|하나은행|농협|카카오뱅크|토스/g,
                 /택배|우체국|관세청/g],
      explain: '기관 이름은 누구나 문자에 적을 수 있습니다. 이름이 아니라 링크 도메인과 발신번호를 봐야 합니다.'
    },
    {
      id: 'impersonation_family',
      category: '지인 사칭',
      label: '가족·지인 사칭 (메신저피싱)',
      weight: 20,
      patterns: [/엄마\s*나야|아빠\s*나야|폰이?\s*고장|액정\s*깨/g,
                 /지금\s*통화\s*(안|못)\s*(돼|해)/g],
      explain: '"폰이 고장나서 문자로만 연락된다"는 메신저피싱의 1번 대사입니다. 반드시 직접 전화해서 확인하세요.'
    },
    {
      id: 'move_channel',
      category: '유인',
      label: '다른 메신저로 옮기자고 유도',
      weight: 12,
      patterns: [/카톡\s*(추가|아이디|으로)/g, /텔레그램|오픈\s*채팅|디엠|DM\s*(주|으로)/gi,
                 /1:1\s*(문의|상담)\s*(주|해)/g],
      explain: '기록이 남는 문자 대신 지우기 쉬운 메신저로 옮기려는 시도입니다. 사기는 대부분 이 단계에서 시작됩니다.'
    },

    {
      id: 'teen_job',
      category: '청소년 표적',
      label: '고수익 알바를 미끼로 사용',
      weight: 22,
      patterns: [/고수익|일당\s*\d+|단순\s*업무|하루\s*\d+\s*만\s*원/g,
                 /재택\s*알바|미성년\s*가능/g],
      explain: '"쉬운 일인데 돈은 많이 준다"는 조건은 현실에 거의 없습니다. 대부분 범죄에 이름을 빌려주는 자리입니다.'
    },
    {
      id: 'mule_account',
      category: '청소년 표적',
      label: '통장·체크카드를 빌려달라고 요구',
      weight: 30,
      patterns: [/통장\s*(대여|양도|빌려|명의)/g, /체크카드\s*(전달|양도|보내|택배)/g,
                 /계좌\s*(빌려|대여)/g],
      explain: '대포통장 모집입니다. 빌려주는 순간 청소년도 전자금융거래법 위반으로 처벌받고, 계좌가 전부 정지됩니다. 피해자가 아니라 공범이 됩니다.',
      alert: true
    },
    {
      id: 'teen_game',
      category: '청소년 표적',
      label: '게임 계정·아이템 거래 사기',
      weight: 22,
      patterns: [/아이템\s*(거래|교환|삽니다)|계정\s*(삽니다|판매|거래)/g,
                 /현질|현금\s*거래|무료\s*(캐시|다이아|젬)/g, /치트\s*프로그램/g],
      explain: '게임 아이템 직거래를 빌미로 개인정보나 선입금을 요구하는 사례가 청소년 피해의 큰 비중을 차지합니다.'
    },
    {
      id: 'teen_idol',
      category: '청소년 표적',
      label: '팬덤·굿즈·티켓 거래를 미끼로 사용',
      weight: 20,
      patterns: [/굿즈|포카|포토카드|양도합니다|콘서트\s*티켓|팬사인회/g,
                 /선입금\s*후\s*발송/g],
      explain: '오픈채팅·SNS 굿즈 양도 사기는 청소년 대상 사기 중 신고가 빠르게 늘고 있는 유형입니다.'
    },
    {
      id: 'teen_school',
      category: '청소년 표적',
      label: '학교·학사 사안을 사칭',
      weight: 18,
      patterns: [/학교폭력|학폭\s*(신고|접수)|생활기록부|생기부/g,
                 /수행평가|모의고사\s*성적|장학금\s*(신청|선정)/g],
      explain: '학교는 학생 개인 휴대폰으로 링크를 보내 성적·생기부를 확인시키지 않습니다.'
    },
    {
      id: 'sextortion',
      category: '청소년 표적',
      label: '몸캠피싱·협박 정황',
      weight: 30,
      patterns: [/영상\s*통화\s*(하자|할래)|화상\s*채팅/g,
                 /유포|퍼뜨리|친구들한테\s*보내|지인\s*목록/g, /알몸|노출\s*사진/g],
      explain: '몸캠피싱 정황입니다. 절대 돈을 보내지 말고 즉시 경찰(112) 또는 디지털성범죄피해자지원센터(02-735-8994)에 알리세요. 당신 잘못이 아닙니다.',
      alert: true
    },

    {
      id: 'prize',
      category: '미끼',
      label: '당첨·무료·환급을 미끼로 사용',
      weight: 14,
      patterns: [/당첨|경품|무료\s*(체험|증정|배송)|이벤트\s*선정/g,
                 /환급|지원금|보조금|미수령/g],
      explain: '신청한 적 없는 당첨·환급 안내는 링크를 누르게 하려는 미끼입니다.'
    },

    {
      id: 'obfuscation',
      category: '필터 우회',
      label: '글자를 변형해 스팸 필터를 회피',
      weight: 18,
      patterns: [/[ㄱ-ㅎㅏ-ㅣ]{2,}/g, /[０-９Ａ-Ｚａ-ｚ]{3,}/g],
      exclude: /^[ㅋㅎㅠㅜㅡㅇㅗㅏ]+$/,
      explain: '자음만 쓰거나 전각문자를 섞는 건 스팸 차단 필터를 피하려는 조작입니다. 정상 문자에는 거의 없습니다.'
    },
    {
      id: 'intl_sender',
      category: '발신 위장',
      label: '국제발신·발신번호 위장 표시',
      weight: 16,
      patterns: [/국제발신|해외발신/g, /web\s*발신/gi],
      explain: '국내 기관을 사칭하면서 국제발신으로 오는 건 명백한 모순입니다.'
    }
  ];

  const URL_RE = /((?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:\/[^\s]*)?)/gi;

  const SHORTENERS = ['bit.ly', 'me2.do', 'buly.kr', 'tinyurl.com', 'goo.gl', 'han.gl',
                      'url.kr', 'vo.la', 'abit.ly', 'is.gd', 'c11.kr', 'urlz.fr', 't.ly'];
  const RISKY_TLD = ['top', 'xyz', 'cc', 'icu', 'buzz', 'click', 'work', 'live',
                     'link', 'rest', 'online', 'site', 'cyou', 'sbs'];
  const BRANDS = ['kakao', 'naver', 'toss', 'kbstar', 'shinhan', 'wooribank', 'nonghyup',
                  'coupang', 'daangn', 'epost', 'apple', 'google'];
  const OFFICIAL = {
    kakao: ['kakao.com', 'kakaocorp.com', 'kakaobank.com'],
    naver: ['naver.com', 'navercorp.com'],
    toss: ['toss.im', 'tossbank.com'],
    kbstar: ['kbstar.com'], shinhan: ['shinhan.com'], wooribank: ['wooribank.com'],
    nonghyup: ['nonghyup.com'], coupang: ['coupang.com'], daangn: ['daangn.com'],
    epost: ['epost.go.kr'], apple: ['apple.com'], google: ['google.com', 'google.co.kr']
  };

  function isOfficial(host, brand) {
    return (OFFICIAL[brand] || []).some(d => host === d || host.endsWith('.' + d));
  }

  function analyzeUrls(text) {
    const found = [];
    let m;
    URL_RE.lastIndex = 0;
    while ((m = URL_RE.exec(text)) !== null) {
      const raw = m[1];
      const host = raw.replace(/^https?:\/\//i, '').split(/[/?#:]/)[0].toLowerCase();
      if (!host.includes('.')) continue;
      const tld = host.split('.').pop();
      const reasons = [];
      let weight = 0;

      if (SHORTENERS.includes(host)) {
        reasons.push('단축 URL이라 실제 목적지를 알 수 없음');
        weight += 20;
      }
      if (RISKY_TLD.includes(tld)) {
        reasons.push('.' + tld + ' 은 사기 사이트가 자주 쓰는 저가 도메인');
        weight += 18;
      }
      if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        reasons.push('도메인 대신 IP 주소를 직접 사용');
        weight += 25;
      }
      if (/^http:\/\//i.test(raw)) {
        reasons.push('암호화되지 않은 http 연결');
        weight += 8;
      }
      if ((host.match(/-/g) || []).length >= 2) {
        reasons.push('하이픈이 많은 도메인 (정상 기관은 드묾)');
        weight += 10;
      }
      for (const b of BRANDS) {
        if (host.includes(b) && !isOfficial(host, b)) {
          reasons.push('공식 도메인이 아니면서 ' + b + ' 를 흉내 냄');
          weight += 26;
          break;
        }
      }
      if (/kaka0|nav3r|t0ss|g00gle|c0upang|sh1nhan/i.test(host)) {
        reasons.push('숫자를 섞어 브랜드명을 흉내 냄');
        weight += 26;
      }

      if (weight > 0) {
        found.push({ raw, host, weight: Math.min(weight, 40), reasons, index: m.index });
      } else {
        found.push({ raw, host, weight: 0, reasons: ['특별한 위험 신호 없음'], index: m.index });
      }
    }
    return found;
  }

  function analyze(text) {
    const signals = [];
    const highlights = [];

    for (const rule of RULES) {
      const matches = [];
      for (const re of rule.patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
          if (m[0].length === 0) { re.lastIndex++; continue; }
          if (rule.exclude && rule.exclude.test(m[0])) continue;
          matches.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
        }
      }
      if (matches.length > 0) {
        signals.push({
          id: rule.id, category: rule.category, label: rule.label,
          weight: rule.weight, explain: rule.explain, alert: !!rule.alert,
          matches: matches
        });
        matches.forEach(function (mt) {
          highlights.push({ start: mt.start, end: mt.end, ruleId: rule.id, category: rule.category });
        });
      }
    }

    const urls = analyzeUrls(text);
    urls.forEach(function (u) {
      if (u.weight > 0) {
        signals.push({
          id: 'url:' + u.host,
          category: '의심 링크',
          label: '의심스러운 링크 (' + u.host + ')',
          weight: u.weight,
          explain: u.reasons.join(' · '),
          alert: false,
          matches: [{ start: u.index, end: u.index + u.raw.length, text: u.raw }]
        });
        highlights.push({ start: u.index, end: u.index + u.raw.length, ruleId: 'url', category: '의심 링크' });
      }
    });

    let score = signals.reduce(function (s, sig) { return s + sig.weight; }, 0);

    const cats = new Set(signals.map(function (s) { return s.category; }));
    const combo = cats.has('의심 링크') && cats.has('심리 압박')
      && (cats.has('정보 탈취') || cats.has('금전 요구') || cats.has('악성 앱'));
    if (combo) score += 15;

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score: score,
      level: levelOf(score),
      signals: signals.sort(function (a, b) { return b.weight - a.weight; }),
      highlights: mergeHighlights(highlights),
      urls: urls,
      combo: combo
    };
  }

  function levelOf(score) {
    if (score >= 70) return { key: 'danger', label: '매우 위험', desc: '사기 문자일 가능성이 매우 높습니다. 링크를 누르지 말고 삭제하세요.' };
    if (score >= 40) return { key: 'warn', label: '위험', desc: '사기 신호가 여러 개 발견됐습니다. 반드시 공식 경로로 다시 확인하세요.' };
    if (score >= 20) return { key: 'caution', label: '주의', desc: '의심스러운 부분이 있습니다. 링크를 누르기 전에 한 번 더 생각하세요.' };
    return { key: 'safe', label: '낮음', desc: '뚜렷한 사기 신호는 없습니다. 다만 100% 안전을 보장하지는 않습니다.' };
  }

  function mergeHighlights(list) {
    const sorted = list.slice().sort(function (a, b) { return a.start - b.start; });
    const out = [];
    for (const h of sorted) {
      const last = out[out.length - 1];
      if (last && h.start <= last.end) {
        last.end = Math.max(last.end, h.end);
      } else {
        out.push({ start: h.start, end: h.end, ruleId: h.ruleId, category: h.category });
      }
    }
    return out;
  }

  global.PhishEyeRules = { analyze: analyze, RULES: RULES, levelOf: levelOf };
})(window);
