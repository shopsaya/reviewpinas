import { useMemo, useState } from "react";
import numerical from "./data/banks/numerical.json";
import verbal from "./data/banks/verbal.json";
import analytical from "./data/banks/analytical.json";
import geninfo from "./data/banks/general-info.json";

const BANKS = [numerical, analytical, verbal, geninfo];
const PASS = 80; // CSC Professional passing rate

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
function Quiz({ bank, onExit }) {
  const questions = useMemo(() => shuffle(bank.questions), [bank]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [answers, setAnswers] = useState([]); // {correct: bool}
  const [done, setDone] = useState(false);

  const q = questions[i];
  const answered = picked !== null;

  const choose = (idx) => {
    if (answered) return;
    setPicked(idx);
    setAnswers((a) => [...a, { correct: idx === q.answer }]);
  };
  const next = () => {
    if (i + 1 >= questions.length) return setDone(true);
    setI(i + 1);
    setPicked(null);
  };

  if (done) {
    const right = answers.filter((a) => a.correct).length;
    const pct = Math.round((right / questions.length) * 100);
    const passed = pct >= PASS;
    return (
      <section className="card result">
        <p className="eyebrow">{bank.subject}</p>
        <Gauge pct={pct} />
        <h2 className="score">{pct}%</h2>
        <p className={passed ? "verdict pass" : "verdict"}>
          {passed
            ? "Pasado! You cleared the 80% CSC passing mark on this set."
            : `${right} of ${questions.length} correct. The CSC passing rate is ${PASS}% — keep practicing.`}
        </p>
        <div className="row">
          <button className="btn" onClick={() => { setI(0); setPicked(null); setAnswers([]); setDone(false); }}>
            Retake this subject
          </button>
          <button className="btn ghost" onClick={onExit}>All subjects</button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <div className="quiz-top">
        <button className="linklike" onClick={onExit}>← Subjects</button>
        <span className="counter">{i + 1} / {questions.length}</span>
      </div>
      <div className="progress"><div style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      <p className="eyebrow">{bank.subject}</p>
      <h2 className="question">{q.q}</h2>
      <div className="options">
        {q.options.map((opt, idx) => {
          let cls = "option";
          if (answered && idx === q.answer) cls += " correct";
          else if (answered && idx === picked) cls += " wrong";
          return (
            <button key={idx} className={cls} onClick={() => choose(idx)} disabled={answered}>
              <span className="opt-letter">{"ABCD"[idx]}</span> {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={picked === q.answer ? "explain good" : "explain"}>
          <strong>{picked === q.answer ? "Tama!" : "Not quite."}</strong> {q.explanation}
        </div>
      )}
      {answered && (
        <button className="btn wide" onClick={next}>
          {i + 1 >= questions.length ? "See my score" : "Next question"}
        </button>
      )}
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [bank, setBank] = useState(null);
  const total = BANKS.reduce((n, b) => n + b.questions.length, 0);

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
          <p className="tagline">Libreng CSC reviewer · walang sign-up · works offline</p>
        </div>
      </header>

      {bank ? (
        <Quiz bank={bank} onExit={() => setBank(null)} />
      ) : (
        <main>
          <section className="hero card">
            <p className="eyebrow">Civil Service Examination</p>
            <h2>Practice like the real thing. Pass at <span className="gold">80%</span>.</h2>
            <p className="sub">
              {total} original questions with explanations, patterned after the CSC
              Professional exam scope. Pick a subject to start — your quiz is
              shuffled every time.
            </p>
          </section>
          <section className="grid">
            {BANKS.map((b) => (
              <button key={b.id} className="subject card" onClick={() => setBank(b)}>
                <h3>{b.subject}</h3>
                <p>{b.description}</p>
                <span className="count">{b.questions.length} questions →</span>
              </button>
            ))}
          </section>
        </main>
      )}

      <footer>
        <p>
          ReviewPinas is an independent study tool by MSB IT Solutions. It is
          not affiliated with or endorsed by the Civil Service Commission. All
          questions are original practice material.
        </p>
      </footer>
    </div>
  );
}
