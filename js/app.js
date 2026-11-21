import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const C = window.APP_CONFIG, $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const paras = (t) => esc(t).split(/\n+/).filter(Boolean).map((p) => `<p>${p}</p>`).join("");
const img = (u, a) => (u ? `<img src="${esc(u)}" alt="${esc(a)}" loading="lazy">` : "");
const lnk = (u) => (/^https?:\/\//.test(u || "") ? esc(u) : "");
const ok = !C.SUPABASE_URL.includes("GANTI-DENGAN");

const R = {
  cards: (it) => `<div class="grid">${it.map((i) => `<article class="box">${img(i.image_url, i.title)}<div class="in"><h3>${esc(i.title)}</h3>${i.subtitle ? `<small>${esc(i.subtitle)}</small>` : ""}${paras(i.body)}</div></article>`).join("")}</div>`,
  timeline: (it) => `<ul class="tl">${it.map((i) => `<li><b>${esc(i.subtitle || i.title)}</b>${i.subtitle && i.title ? `<strong>${esc(i.title)}</strong>` : ""}${paras(i.body)}</li>`).join("")}</ul>`,
  steps: (it) => `<ol class="steps">${it.map((i) => `<li><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></li>`).join("")}</ol>`,
  numbered: (it) => `<ol class="misi">${it.map((i) => `<li><span>${esc(i.title || i.body)}${i.title && i.body ? `<br><small>${esc(i.body)}</small>` : ""}</span></li>`).join("")}</ol>`,
};
const msg = (t) => ($("#content").innerHTML = `<section><div class="wrap"><p class="lead">${t}</p></div></section>`);

let S = {};
async function init() {
  if (!ok) return msg("Website belum terhubung ke Supabase. Isi js/config.js dulu.");
  const sb = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
  const [a, b, c] = await Promise.all([sb.from("site_settings").select("*"), sb.from("sections").select("*").order("sort_order"), sb.from("items").select("*").order("sort_order")]);
  const err = a.error || b.error || c.error;
  if (err) return msg("Gagal memuat data: " + esc(err.message));
  S = Object.fromEntries(a.data.map((r) => [r.key, r.value]));
  document.title = S.school_name || "Sekolah";
  $("#h-name").textContent = $("#f-name").textContent = S.school_name || "";
  $("#brand").textContent = S.school_name || "Sekolah";
  $("#h-text").textContent = S.hero_text || S.tagline || "";
  $("#f-tag").textContent = S.tagline || "";

  const sec = (slug) => { const s = b.data.find((x) => x.slug === slug && x.visible); const it = s ? c.data.filter((i) => i.section_id === s.id && (i.title || i.body)) : []; return it.length ? { s, it } : null; };
  const blocks = [], add = (id, title, html, intro = "") => blocks.push({ id, title, html, intro });

  const facts = [["Jenjang", S.jenjang], ["Akreditasi", S.akreditasi], ["NPSN", S.npsn], ["Berdiri sejak", S.tahun_berdiri]].filter((f) => f[1]);
  if (S.profil_deskripsi || facts.length || S.profil_foto)
    add("profil", "Profil Sekolah", `<div class="two"><div class="prose">${paras(S.profil_deskripsi)}${facts.length ? `<dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}</div>${S.profil_foto ? `<img class="photo" src="${esc(S.profil_foto)}" alt="Foto ${esc(S.school_name)}">` : ""}</div>`);

  const embed = ((/src="([^"]+)"/.exec(S.maps_embed || "") || [, S.maps_embed || ""])[1] || "").trim().replace(/&amp;/g, "&");
  const mapOk = /^https:\/\/www\.google\.com\/maps\/embed/.test(embed);
  if (S.address || mapOk)
    add("lokasi", "Lokasi", `<div class="two"><div class="prose">${paras(S.address)}${paras(S.lokasi_petunjuk)}${S.address ? `<a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.address)}" target="_blank" rel="noopener">Buka di Google Maps</a>` : ""}</div>${mapOk ? `<div class="map"><iframe src="${esc(embed)}" title="Peta lokasi sekolah" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ""}</div>`);

  const sj = sec("sejarah"); if (sj) add("sejarah", sj.s.title, R.timeline(sj.it), sj.s.intro);
  const mi = sec("misi");
  if (S.visi || mi) add("visimisi", "Visi dan Misi", `<div class="two">${S.visi ? `<div><h3>Visi</h3><p class="visi">${esc(S.visi)}</p></div>` : ""}${mi ? `<div><h3>Misi</h3>${R.numbered(mi.it)}</div>` : ""}</div>`, mi?.s.intro || "");
  for (const k of ["struktur", "program", "fasilitas", "kegiatan", "prestasi"]) { const x = sec(k); if (x) add(k, x.s.title, R.cards(x.it), x.s.intro); }

  const pp = sec("ppdb"), info = [["Periode pendaftaran", S.ppdb_periode], ["Biaya", S.ppdb_biaya]].filter((x) => x[1]);
  if (pp || S.ppdb_status || info.length || lnk(S.ppdb_link))
    add("ppdb", "Penerimaan Peserta Baru", `${S.ppdb_status ? `<p class="badge">Pendaftaran: ${esc(S.ppdb_status)}</p>` : ""}${info.length ? `<div class="grid" style="margin-bottom:22px">${info.map(([k, v]) => `<div class="box"><div class="in"><h3>${k}</h3>${paras(v)}</div></div>`).join("")}</div>` : ""}${pp ? R.steps(pp.it) : ""}${S.ppdb_catatan ? `<div class="prose" style="margin-top:20px">${paras(S.ppdb_catatan)}</div>` : ""}${lnk(S.ppdb_link) ? `<p style="margin-top:20px"><a class="btn" href="${lnk(S.ppdb_link)}" target="_blank" rel="noopener">Isi formulir pendaftaran</a></p>` : ""}`, pp?.s.intro || "");

  const wa = (S.whatsapp || "").replace(/\D/g, "");
  const ct = [["Telepon", esc(S.phone)], ["WhatsApp", wa && `<a href="https://wa.me/${wa}">${esc(S.whatsapp)}</a>`], ["Email", S.email && `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>`], ["Jam layanan", esc(S.hours)]].filter((x) => x[1]);
  const soc = [["Instagram", S.instagram], ["Facebook", S.facebook], ["YouTube", S.youtube]].filter((x) => lnk(x[1]));
  if (ct.length || soc.length) add("kontak", "Hubungi Kami", `<div class="grid">${ct.map(([k, v]) => `<div class="box"><div class="in"><h3>${k}</h3><p>${v}</p></div></div>`).join("")}</div>${soc.length ? `<div class="social">${soc.map(([k, v]) => `<a href="${lnk(v)}" target="_blank" rel="noopener">${k}</a>`).join("")}</div>` : ""}`);
  else $("#h-contact").hidden = true;

  $("#content").innerHTML = blocks.length
    ? blocks.map((x, n) => `<section id="${x.id}"${n % 2 ? ' class="tint"' : ""}><div class="wrap"><h2>${esc(x.title)}</h2>${x.intro ? `<p class="lead">${esc(x.intro)}</p>` : ""}${x.html}</div></section>`).join("")
    : `<section><div class="wrap"><p class="lead">Informasi sekolah sedang disiapkan.</p></div></section>`;
  $("#nav").innerHTML = blocks.map((x) => `<a href="#${x.id}">${esc(x.title)}</a>`).join("");
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
