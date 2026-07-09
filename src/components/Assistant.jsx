import { useState, useEffect, useRef } from "react";
import { Ic } from "../icons.jsx";
import { analyze, QUICK_PROMPTS } from "../lib/assistant.js";

/**
 * Lab Assistant side panel. Answers are produced locally by analyze() from the
 * active dataset's extracted metrics. No network calls, no API keys. (made for absolute data privacy)
 */
export function Assistant(props) {
  const t = props.t;
  const [chats, setChats] = useState([
    { id: 1, title: "New Chat", msgs: [{ r: "a", t: "Welcome! I analyse your active dataset directly.\n\nTry: \"Summarize\" · \"Compare\" · \"Fill factor\" · \"Resistances\" · \"Next steps\"" }] },
  ]);
  const [active, setActive] = useState(1);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [thinkMsg, setThinkMsg] = useState("");
  const endRef = useRef(null);
  const inRef = useRef(null);
  const chat = chats.find((c) => c.id === active) || chats[0];

  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [chat.msgs.length, loading]);
  useEffect(() => { if (props.open) setTimeout(() => { if (inRef.current) inRef.current.focus(); }, 150); }, [props.open]);

  const steps = ["Reading dataset…", "Extracting metrics…", "Composing answer…"];

  function send(text) {
    const msg = (text != null ? text : input).trim();
    if (!msg || loading) return;
    setInput("");
    setChats((p) => p.map((c) => (c.id === active ? { ...c, msgs: c.msgs.concat([{ r: "u", t: msg }]) } : c)));
    setLoading(true);
    let s = 0; setThinkMsg(steps[0]);
    const iv = setInterval(() => { s++; if (s < steps.length) setThinkMsg(steps[s]); }, 280);
    // Compute synchronously, but show a brief "thinking" beat for feel.
    const resp = analyze(msg, { dataset: props.datasets[props.activeDs] || props.datasets[0] || null, allMetrics: props.allMetrics, efficiency: props.efficiency });
    setTimeout(() => {
      clearInterval(iv); setThinkMsg("");
      setChats((p) => p.map((c) => (c.id !== active ? c : { ...c, title: c.msgs.length <= 2 ? msg.slice(0, 22) + (msg.length > 22 ? "…" : "") : c.title, msgs: c.msgs.concat([{ r: "a", t: resp }]) })));
      setLoading(false);
    }, 420);
  }

  function newChat() {
    const id = Date.now();
    setChats((p) => p.concat([{ id, title: "New Chat", msgs: [{ r: "a", t: "New session — ask me about the active dataset." }] }]));
    setActive(id); setShowHist(false);
  }

  if (!props.open) return null;
  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 370, maxWidth: "100vw", background: t.chatBg, borderLeft: "1px solid " + t.border, display: "flex", flexDirection: "column", zIndex: 200, boxShadow: "-16px 0 48px rgba(0,0,0,.3)" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid " + t.border, display: "flex", alignItems: "center", justifyContent: "space-between", background: t.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg," + t.accent + ",#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic.Bot s={14} c="#fff" /></div>
          <div><div style={{ fontWeight: 600, fontSize: 12 }}>Lab Assistant</div><div style={{ fontSize: 8, color: t.success }}>Analysing locally</div></div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setShowHist(!showHist)} style={{ background: showHist ? t.accentS : "none", border: "1px solid " + (showHist ? t.accent + "33" : t.border), borderRadius: 6, padding: "3px 8px", color: t.textM, fontSize: 9 }}>History</button>
          <button onClick={newChat} style={{ background: "none", border: "1px solid " + t.border, borderRadius: 6, padding: 3, color: t.textM }}><Ic.Plus s={13} /></button>
          <button onClick={props.onClose} style={{ background: "none", border: "none", color: t.textM, padding: 3 }}><Ic.Xx s={15} /></button>
        </div>
      </div>
      {showHist && (
        <div style={{ borderBottom: "1px solid " + t.border, background: t.card, maxHeight: 150, overflow: "auto", padding: 5 }}>
          {chats.map((c) => <div key={c.id} onClick={() => { setActive(c.id); setShowHist(false); }} style={{ padding: "6px 9px", borderRadius: 5, marginBottom: 1, fontSize: 10, color: c.id === active ? t.accent : t.textM, background: c.id === active ? t.accentS : "transparent", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>)}
        </div>
      )}
      <div style={{ flex: 1, overflow: "auto", padding: 13 }}>
        {chat.msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: m.r === "u" ? "flex-end" : "flex-start", animation: "fadein .3s" }}>
            <div style={{ maxWidth: "85%", padding: "10px 13px", borderRadius: m.r === "u" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.r === "u" ? "linear-gradient(135deg," + t.accent + ",#7c3aed)" : t.card, color: m.r === "u" ? "#fff" : t.text, border: m.r === "u" ? "none" : "1px solid " + t.border, fontSize: 12, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.t}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: t.textM, fontSize: 10, padding: "10px 12px", background: t.card, borderRadius: 11, border: "1px solid " + t.border, animation: "fadein .3s" }}>
            <div style={{ display: "flex", gap: 3 }}>{[0, 1, 2].map((j) => <div key={j} style={{ width: 4, height: 4, borderRadius: 2, background: t.accent, animation: "pulsedot 1.2s ease " + j * 0.25 + "s infinite" }} />)}</div>
            <span style={{ fontStyle: "italic", color: t.textD }}>{thinkMsg}</span>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "0 12px 4px", display: "flex", gap: 4, flexWrap: "wrap" }}>{QUICK_PROMPTS.map((q) => <button key={q} onClick={() => send(q)} style={{ padding: "3px 8px", borderRadius: 7, border: "1px solid " + t.border, background: "transparent", color: t.textM, fontSize: 9 }}>{q}</button>)}</div>
      <div style={{ padding: 9, borderTop: "1px solid " + t.border, background: t.card, display: "flex", gap: 6, alignItems: "flex-end" }}>
        <textarea ref={inRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about the active dataset…" rows={2} style={{ flex: 1, padding: "8px 10px", borderRadius: 9, border: "1px solid " + t.border, background: t.inputBg, color: t.text, fontSize: 12, outline: "none", resize: "none", lineHeight: 1.3 }} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{ width: 34, height: 34, borderRadius: 9, border: "none", flexShrink: 0, background: input.trim() && !loading ? "linear-gradient(135deg," + t.accent + ",#7c3aed)" : t.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Ic.Snd s={14} /></button>
      </div>
    </div>
  );
}
