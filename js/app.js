import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const C = window.APP_CONFIG, $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const paras = (t) => esc(t).split(/\n+/).filter(Boolean).map((p) => `<p>${p}</p>`).join("");
const img = (u, a) => (u ? `<img src="${esc(u)}" alt="${esc(a)}" loading="lazy">` : "");
const ok = !C.SUPABASE_URL.includes("GANTI-DENGAN");

const R = {
  text: (it) => `<div class="prose">${it.map((i) => `${i.title ? `<h3>${esc(i.title)}</h3>` : ""}${img(i.image_url, i.title)}${paras(i.body)}`).join("")}</div>`,
  cards: (it) => `<div class="grid">${it.map((i) => `<article class="box">${img(i.image_url, i.title)}<div class="in"><h3>${esc(i.title)}</h3>${i.subtitle ? `<small>${esc(i.subtitle)}</small>` : ""}${paras(i.body)}</div></article>`).join("")}</div>`,
  timeline: (it) => `<ul class="tl">${it.map((i) => `<li><b>${esc(i.subtitle || i.title)}</b>${i.subtitle && i.title ? `<strong>${esc(i.title)}</strong>` : ""}${paras(i.body)}</li>`).join("")}</ul>`,
  steps: (it) => `<ol class="steps">${it.map((i) => `<li><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></li>`).join("")}</ol>`,
  numbered: (it) => `<ol class="misi">${it.map((i) => `<li><span>${esc(i.title || i.body)}${i.title && i.body ? `<br><small>${esc(i.body)}</small>` : ""}</span></li>`).join("")}</ol>`,
};

let S = {};
async function init() {
  if (!ok) { $("#content").innerHTML = `<section><div class="wrap"><p class="lead">Website belum terhubung ke Supabase. Isi js/config.js dulu.</p></div></section>`; return; }
  const sb = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  const [a, b, c] = await Promise.all([
    sb.from("site_settings").select("*"),
    sb.from("sections").select("*").eq("visible", true).order("sort_order"),
    sb.from("items").select("*").order("sort_order"),
  ]);
  const err = a.error || b.error || c.error;
  if (err) { $("#content").innerHTML = `<section><div class="wrap"><p class="lead">Gagal memuat data: ${esc(err.message)}</p></div></section>`; return; }
  S = Object.fromEntries(a.data.map((r) => [r.key, r.value]));
  document.title = S.school_name || "Sekolah";
  $("#h-name").textContent = $("#f-name").textContent = S.school_name || "";
  $("#brand").textContent = S.school_name || "Sekolah";
  $("#h-text").textContent = S.hero_text || S.tagline || "";
  $("#f-tag").textContent = S.tagline || "";
  const secs = b.data.filter((s) => c.data.some((i) => i.section_id === s.id));
  $("#content").innerHTML = secs.length
    ? secs.map((s, n) => `<section id="bagian-${s.id}"${n % 2 ? ' class="tint"' : ""}><div class="wrap"><h2>${esc(s.title)}</h2>${s.intro ? `<p class="lead">${esc(s.intro)}</p>` : ""}${R[s.layout](c.data.filter((i) => i.section_id === s.id))}</div></section>`).join("")
    : `<section><div class="wrap"><p class="lead">Informasi sekolah sedang disiapkan.</p></div></section>`;
  const wa = (S.whatsapp || "").replace(/\D/g, "");
  const ct = [["Alamat", S.address], ["Telepon", S.phone], ["WhatsApp", wa && `<a href="https://wa.me/${wa}">${esc(S.whatsapp)}</a>`, 1], ["Email", S.email && `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`, 1], ["Jam layanan", S.hours]].filter((x) => x[1]);
  if (ct.length) { $("#kontak").hidden = false; $("#contact").innerHTML = ct.map(([k, v, raw]) => `<div class="box"><div class="in"><h3>${k}</h3><p>${raw ? v : esc(v)}</p></div></div>`).join(""); }
  $("#nav").innerHTML = secs.map((s) => `<a href="#bagian-${s.id}">${esc(s.title)}</a>`).join("") + (ct.length ? `<a href="#kontak">Kontak</a>` : "");
  chat();
}

function chat() {
  if (S.ai_enabled === "false") { $("#fab").hidden = true; $("#ask-open").hidden = true; return; }
  const hist = [], box = $("#msgs");
  $("#ai-name").textContent = S.ai_name || "Asisten";
  const add = (t, who) => { const d = document.createElement("div"); d.className = "m " + who; d.textContent = t; box.append(d); box.scrollTop = box.scrollHeight; return d; };
  add(S.ai_welcome || "Halo! Ada yang bisa saya bantu?", "bot");
  const open = () => { $("#chat").hidden = false; $("#fab").hidden = true; $("#q").focus(); };
  $("#fab").onclick = $("#ask-open").onclick = open;
  $("#chat-x").onclick = () => { $("#chat").hidden = true; $("#fab").hidden = false; };
  async function ask(q) {
    q = q.trim(); if (!q) return;
    $("#sugs").innerHTML = ""; add(q, "me"); $("#q").value = "";
    const w = add("Sebentar, saya cari tahu…", "bot");
    try {
      const r = await fetch(C.SUPABASE_URL + "/functions/v1/ask-ai", { method: "POST", headers: { "Content-Type": "application/json", apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + C.SUPABASE_ANON_KEY }, body: JSON.stringify({ question: q, history: hist }) });
      const d = await r.json();
      w.textContent = d.answer || d.error || "Maaf, ada kendala. Coba lagi sebentar.";
      if (d.answer) hist.push({ role: "user", content: q }, { role: "assistant", content: d.answer });
    } catch { w.textContent = "Maaf, koneksi bermasalah. Coba lagi sebentar."; }
  }
  $("#chat-form").onsubmit = (e) => { e.preventDefault(); ask($("#q").value); };
  $("#sugs").innerHTML = (S.ai_suggestions || "").split("\n").filter(Boolean).map((t) => `<button type="button">${esc(t)}</button>`).join("");
  $("#sugs").onclick = (e) => e.target.tagName === "BUTTON" && ask(e.target.textContent);
}
init();
