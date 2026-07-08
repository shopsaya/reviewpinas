import { useMemo, useState } from "react";
import numerical from "./data/banks/numerical.json";
import verbal from "./data/banks/verbal.json";
import analytical from "./data/banks/analytical.json";
import geninfo from "./data/banks/general-info.json";
import letGened from "./data/banks/let-gened.json";
import letProfed from "./data/banks/let-profed.json";
import crim from "./data/banks/crim.json";

const EXAMS = [
  { id: "csc", name: "Civil Service Exam", agency: "CSC",
    desc: "Professional level — numerical, analytical, verbal, general info.",
    banks: [numerical, analytical, verbal, geninfo] },
  { id: "let", name: "Teachers (LET)", agency: "PRC",
    desc: "Licensure Examination for Teachers — Gen Ed and Prof Ed.",
    banks: [letGened, letProfed] },
  { id: "crim", name: "Criminology (CLE)", agency: "PRC",
    desc: "Criminologists Licensure Examination fundamentals.",
    banks: [crim] },
  { id: "nursing", name: "Nursing (NLE)", agency: "PRC", soon: true,
    desc: "Nurse Licensure Examination — coming soon.", banks: [] },
  { id: "engg", name: "Civil Engineering", agency: "PRC", soon: true,
    desc: "CE Board Examination — coming soon.", banks: [] },
  { id: "cpa", name: "Accountancy (CPALE)", agency: "PRC", soon: true,
    desc: "CPA Licensure Examination — coming soon.", banks: [] },
];
const PASS = 80; // CSC Professional passing rate

const HKEY = "rp-history";
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HKEY)) || []; } catch { return []; }
}
function saveHistory(list) {
  try { localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 50))); } catch { /* private mode */ }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Score gauge ───────────────────────────────────────────────────────────────
function Gauge({ pct }) {
  const angle = Math.min(100, Math.max(0, pct)) * 1.8; // 0..180deg
  const passAngle = PASS * 1.8;
  const polar = (deg, r) => {
    const rad = ((180 - deg) * Math.PI) / 180;
    return [100 + r * Math.cos(rad), 100 - r * Math.sin(rad)];
  };
  const [nx, ny] = polar(angle, 74);
  const [px1, py1] = polar(passAngle, 60);
  const [px2, py2] = polar(passAngle, 92);
  const passed = pct >= PASS;
  return (
    <svg viewBox="0 0 200 118" className="gauge" role="img"
      aria-label={`Score ${pct}%, passing is ${PASS}%`}>
      <path d="M 12 100 A 88 88 0 0 1 188 100" fill="none"
        stroke="var(--line)" strokeWidth="14" strokeLinecap="round" />
      <path d="M 12 100 A 88 88 0 0 1 188 100" fill="none"
        stroke={passed ? "var(--sun)" : "var(--ph-blue)"} strokeWidth="14"
        strokeLinecap="round" strokeDasharray={`${(angle / 180) * 276} 276`} />
      <line x1={px1} y1={py1} x2={px2} y2={py2}
        stroke="var(--ink-soft)" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="100" y1="100" x2={nx} y2={ny}
        stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="100" r="6" fill="var(--ink)" />
      <text x={px2 + (passAngle < 90 ? -2 : 2)} y={py2 - 4} className="gauge-pass"
        textAnchor={passAngle < 90 ? "end" : "start"}>{PASS}%</text>
    </svg>
  );
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
function Quiz({ bank, onExit, onFinish }) {
  const [round, setRound] = useState(0);
  // fresh shuffle of BOTH question order and option order every attempt
  const questions = useMemo(() => {
    return shuffle(bank.questions).map((q) => {
      const order = shuffle(q.options.map((_, idx) => idx));
      return {
        ...q,
        options: order.map((oi) => q.options[oi]),
        answer: order.indexOf(q.answer),
      };
    });
  }, [bank, round]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]); // { picked, correct }
  const [done, setDone] = useState(false);

  const restart = () => {
    setRound((r) => r + 1);
    setI(0); setPicked(null); setAnswers([]); setDone(false);
  };

  const next = () => {
    if (picked === null) return;
    const record = [...answers, { picked, correct: picked === questions[i].answer }];
    setAnswers(record);
    setPicked(null);
    if (i + 1 >= questions.length) {
      const right = record.filter((a) => a.correct).length;
      onFinish({
        id: bank.id, subject: bank.subject,
        right, total: questions.length,
        pct: Math.round((right / questions.length) * 100),
        ts: Date.now(),
      });
      setDone(true);
    } else {
      setI(i + 1);
    }
  };

  if (done) {
    const right = answers.filter((a) => a.correct).length;
    const pct = Math.round((right / questions.length) * 100);
    const passed = pct >= PASS;
    const share = async () => {
      const text = passed
        ? `I scored ${pct}% on the ${bank.subject} practice test — cleared the 80% passing mark! 🇵🇭 Try it, it's free:`
        : `Practicing ${bank.subject} on ReviewPinas. It's free — try it too:`;
      const url = "https://reviewpinas.com";
      if (navigator.share) {
        try { await navigator.share({ title: "ReviewPinas", text, url }); return; } catch (e) { /* cancelled */ }
      }
      window.open(
        "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) +
        "&quote=" + encodeURIComponent(text),
        "_blank", "noopener,width=600,height=480"
      );
    };
    return (
      <section className="card result">
        <p className="eyebrow">{bank.subject}</p>
        <Gauge pct={pct} />
        <h2 className="score">{pct}%</h2>
        <p className="tally">{right} correct out of {questions.length}</p>
        <p className={passed ? "verdict pass" : "verdict"}>
          {passed
            ? "You passed! You cleared the 80% passing mark. Great work!"
            : `Almost there — passing is ${PASS}%. Review your answers below, then try again.`}
        </p>
        <div className="row">
          <button className="btn share" onClick={share}>Share my score</button>
          <button className="btn" onClick={restart}>Retake</button>
          <button className="btn ghost" onClick={onExit}>All subjects</button>
        </div>

        <div className="review">
          <p className="pick">ANSWER REVIEW</p>
          {questions.map((q, qi) => {
            const a = answers[qi];
            return (
              <div key={qi} className={a.correct ? "rev-item good" : "rev-item"}>
                <p className="rev-q"><span className="rev-num">{qi + 1}.</span> {q.q}</p>
                <p className="rev-a">
                  Your answer: <strong>{"ABCD"[a.picked]}. {q.options[a.picked]}</strong>
                  {a.correct ? " ✓" : " ✗"}
                </p>
                {!a.correct && (
                  <p className="rev-a correct-a">
                    Correct answer: <strong>{"ABCD"[q.answer]}. {q.options[q.answer]}</strong>
                  </p>
                )}
                <p className="rev-x">{q.explanation}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const q = questions[i];
  return (
    <section className="card">
      <div className="quiz-top">
        <button className="linklike" onClick={onExit}>← Back</button>
        <span className="counter">{i + 1} / {questions.length}</span>
      </div>
      <div className="progress"><div style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      <p className="eyebrow">{bank.subject}</p>
      <h2 className="question">{q.q}</h2>
      <div className="options">
        {q.options.map((opt, idx) => (
          <button key={idx}
            className={idx === picked ? "option selected" : "option"}
            onClick={() => setPicked(idx)}>
            <span className="opt-letter">{"ABCD"[idx]}</span> {opt}
          </button>
        ))}
      </div>
      <button className="btn wide" onClick={next} disabled={picked === null}>
        {i + 1 >= questions.length ? "Submit answers" : "Next question"}
      </button>
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [exam, setExam] = useState(null);
  const [bank, setBank] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const total = EXAMS.reduce((n, e) => n + e.banks.reduce((m, b) => m + b.questions.length, 0), 0);
  const addResult = (entry) => {
    setHistory((h) => { const next = [entry, ...h]; saveHistory(next); return next; });
  };
  const clearHistory = () => { setHistory([]); saveHistory([]); };
  const bestFor = (id) => {
    const scores = history.filter((h) => h.id === id).map((h) => h.pct);
    return scores.length ? Math.max(...scores) : null;
  };
  const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric" });

  return (
    <div className="page">
      <header className="masthead">
        <div className="seal" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="16" />
            <g>
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                <polygon key={deg} points="50,4 45,26 55,26"
                  transform={`rotate(${deg} 50 50)`} />
              ))}
            </g>
          </svg>
        </div>
        <div>
          <h1>ReviewPinas</h1>
          <p className="tagline">Free PH exam reviewers · no sign-up · works offline</p>
        </div>
      </header>

      {bank ? (
        <Quiz bank={bank} onExit={() => setBank(null)} onFinish={addResult} />
      ) : exam ? (
        <main>
          <div className="quiz-top">
            <button className="linklike" onClick={() => setExam(null)}>← All exams</button>
            <span className="counter">{exam.agency}</span>
          </div>
          <section className="hero">
            <p className="eyebrow">{exam.agency} · {exam.name}</p>
            <h2>Pass at <span className="gold">80%</span>.</h2>
            <p className="sub">{exam.desc}</p>
          </section>
          <p className="pick">PICK A SUBJECT</p>
          <section className="grid">
            {exam.banks.map((b, i) => (
              <button key={b.id} className="subject card" onClick={() => setBank(b)}>
                <span className="sbubble" aria-hidden="true">{"ABCD"[i % 4]}</span>
                {bestFor(b.id) !== null && (
                  <span className={bestFor(b.id) >= PASS ? "best pass" : "best"}>
                    Best: {bestFor(b.id)}%
                  </span>
                )}
                <h3>{b.subject}</h3>
                <p>{b.description}</p>
                <span className="count">{b.questions.length} questions →</span>
              </button>
            ))}
          </section>
        </main>
      ) : (
        <main>
          <section className="hero">
            <p className="eyebrow">Philippine Licensure &amp; Government Exams</p>
            <h2>You&rsquo;ve got this.<br />Pass at <span className="gold">80%</span>.</h2>
            <p className="sub">
              Free practice quizzes with explanations for Philippine board and
              government exams. Pick your exam — shuffled every time.
            </p>
            <svg className="flagmark" viewBox="0 0 300 200" aria-hidden="true">
              <rect x="0" y="0" width="300" height="100" fill="#0038A8" />
              <rect x="0" y="100" width="300" height="100" fill="#CE1126" />
              <polygon points="0,0 173,100 0,200" fill="#ffffff" />
              <g fill="#FCD116">
                <circle cx="62" cy="100" r="17" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
                  <polygon key={d} points="62,68 58,84 66,84" transform={`rotate(${d} 62 100)`} />
                ))}
                <polygon points="20.0,13.0 22.1,19.1 28.6,19.2 23.4,23.1 25.3,29.3 20.0,25.5 14.7,29.3 16.6,23.1 11.4,19.2 17.9,19.1" />
                <polygon points="20.0,169.0 22.1,175.1 28.6,175.2 23.4,179.1 25.3,185.3 20.0,181.5 14.7,185.3 16.6,179.1 11.4,175.2 17.9,175.1" />
                <polygon points="140.0,91.0 142.1,97.1 148.6,97.2 143.4,101.1 145.3,107.3 140.0,103.5 134.7,107.3 136.6,101.1 131.4,97.2 137.9,97.1" />
              </g>
            </svg>
            <div className="sheet" aria-hidden="true">
              {["A", "B", "C", "D"].map((l, i) => (
                <span key={l} className={i === 2 ? "bubble shade" : "bubble"}>{l}</span>
              ))}
              <span className="sheet-note">shade your answer</span>
            </div>
            <div className="stats">
              <span>{total} questions</span><span>{EXAMS.filter(e=>!e.soon).length} exams live</span><span>80% passing</span><span>100% free</span>
            </div>
          </section>
          <p className="pick">PICK YOUR EXAM</p>
          <section className="grid">
            {EXAMS.map((e) => (
              <button key={e.id} className="subject card exam-card" disabled={e.soon}
                onClick={() => !e.soon && setExam(e)}>
                <span className="agency">{e.agency}</span>
                {e.soon && <span className="best">Coming soon</span>}
                <h3>{e.name}</h3>
                <p>{e.desc}</p>
                {!e.soon && (
                  <span className="count">
                    {e.banks.reduce((n, b) => n + b.questions.length, 0)} questions →
                  </span>
                )}
              </button>
            ))}
          </section>
          {history.length > 0 && (
            <section className="card progress-card">
              <div className="progress-head">
                <p className="eyebrow">Your progress</p>
                <button className="linklike" onClick={clearHistory}>Clear</button>
              </div>
              <ul className="attempts">
                {history.slice(0, 6).map((h, idx) => (
                  <li key={idx}>
                    <span className={h.pct >= PASS ? "dot pass" : "dot"} aria-hidden="true" />
                    <span className="a-subj">{h.subject}</span>
                    <span className="a-score">{h.pct}%</span>
                    <span className="a-meta">{h.right}/{h.total} · {fmtDate(h.ts)}</span>
                  </li>
                ))}
              </ul>
              <p className="a-note">Saved on this device only — no account needed.</p>
            </section>
          )}
        </main>
      )}

      <footer>
        <div className="tricolor" aria-hidden="true"><span /><span /><span /></div>
        <p>
          ReviewPinas is a free, independent reviewer. Not affiliated with the
          Civil Service Commission or the Professional Regulation Commission.
        </p>
      </footer>
    </div>
  );
}
