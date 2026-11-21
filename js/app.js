import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const C = window.APP_CONFIG || {}, $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const paras = (t) => esc(t).split(/\n+/).filter(Boolean).map((p) => `<p>${p}</p>`).join("");
const img = (u, a) => (u ? `<img src="${esc(u)}" alt="${esc(a)}" loading="lazy">` : "");
const lnk = (u) => (/^https?:\/\//.test(u || "") ? esc(u) : "");
const connected = !!C.SUPABASE_URL && !C.SUPABASE_URL.includes("GANTI-DENGAN");
const EMPTY = `<p class="empty">Informasi ini sedang disiapkan.</p>`;

const R = {
  cards: (it) => `<div class="grid">${it.map((i) => `<article class="box">${img(i.image_url, i.title)}<div class="in"><h3>${esc(i.title)}</h3>${i.subtitle ? `<small>${esc(i.subtitle)}</small>` : ""}${paras(i.body)}</div></article>`).join("")}</div>`,
  timeline: (it) => `<ul class="tl">${it.map((i) => `<li><b>${esc(i.subtitle || i.title)}</b>${i.subtitle && i.title ? `<strong>${esc(i.title)}</strong>` : ""}${paras(i.body)}</li>`).join("")}</ul>`,
  steps: (it) => `<ol class="steps">${it.map((i) => `<li><h3>${esc(i.title)}</h3><p>${esc(i.body)}</p></li>`).join("")}</ol>`,
  numbered: (it) => `<ol class="misi">${it.map((i) => `<li><span>${esc(i.title || i.body)}${i.title && i.body ? `<br><small>${esc(i.body)}</small>` : ""}</span></li>`).join("")}</ol>`,
};
const box = (h, body) => `<div class="box"><div class="in"><h3>${h}</h3>${body}</div></div>`;

let S = {};
function build(secs, items) {
  const sec = (slug) => { const s = secs.find((x) => x.slug === slug); return { s, it: s ? items.filter((i) => i.section_id === s.id && (i.title || i.body)) : [], hidden: s && !s.visible }; };
  const out = [], add = (id, html, hidden) => !hidden && out.push({ id, html });
  const cardsSec = (id, title, lead) => { const x = sec(id); add(id, `<h2>${title}</h2><p class="lead">${esc(x.s?.intro || lead)}</p>${x.it.length ? R.cards(x.it) : EMPTY}`, x.hidden); };

  // Profil + sejarah
  const idn = [["Nama resmi", S.school_name || "Sekolah Kristen Tugu Bhakti"], ["Jenjang", S.jenjang], ["Akreditasi", S.akreditasi], ["NPSN", S.npsn], ["Berdiri sejak", S.tahun_berdiri]].filter((x) => x[1]);
  const sj = sec("sejarah");
  add("profil", `<h2>Mengenal sekolah kami</h2>
    <div class="lead">${S.profil_deskripsi ? paras(S.profil_deskripsi) : "<p>Tugu Bhakti adalah lembaga pendidikan Kristen. Sekolah ini ingin jadi tempat anak belajar dengan nyaman, dan tempat orang tua mendapat informasi yang jelas tanpa harus datang langsung.</p>"}</div>
    ${S.profil_foto ? `<img class="photo" style="margin-bottom:22px" src="${esc(S.profil_foto)}" alt="Foto sekolah">` : ""}
    <div class="grid">${box("Identitas", `<p>${idn.map(([k, v]) => `${k}: ${esc(v)}`).join("<br>")}</p>`)}${box("Naungan", "<p>Yayasan Pendidikan Kristen Tugu Bhakti. Informasi yayasan secara umum tersedia di situs yayasan pusat.</p>")}${box("Lokasi", S.address ? paras(S.address) : `<p class="empty">Alamat belum diisi.</p>`)}</div>
    ${sj.hidden ? "" : `<h2 class="sub">Sejarah singkat</h2><p class="lead">${esc(sj.s?.intro || "Awal berdirinya sekolah dan perjalanannya sampai sekarang.")}</p>${sj.it.length ? R.timeline(sj.it) : EMPTY}`}`);

  // Visi & misi
  const mi = sec("misi");
  add("visimisi", `<div class="two"><div><h2>Visi</h2>${S.visi ? `<p class="visi">${esc(S.visi)}</p>` : EMPTY}</div><div><h2>Misi</h2>${mi.it.length ? R.numbered(mi.it) : EMPTY}</div></div>`, mi.hidden);

  cardsSec("struktur", "Struktur organisasi", "Siapa yang mengurus sekolah, dari yayasan sampai guru.");
  cardsSec("program", "Program pendidikan", "Jenjang dan program yang tersedia untuk murid.");
  cardsSec("fasilitas", "Fasilitas", "Ruang dan sarana yang dipakai murid setiap hari.");
  cardsSec("kegiatan", "Kegiatan sekolah", "Kegiatan di dalam dan di luar kelas.");
  cardsSec("prestasi", "Prestasi", "Capaian murid dan sekolah.");

  // Penerimaan
  const pp = sec("ppdb"), info = [["Periode pendaftaran", S.ppdb_periode], ["Biaya", S.ppdb_biaya]].filter((x) => x[1]);
  const ppHas = pp.it.length || S.ppdb_status || info.length || S.ppdb_catatan || lnk(S.ppdb_link);
  add("ppdb", `<h2>Penerimaan peserta didik baru</h2><p class="lead">${esc(pp.s?.intro || "Alur pendaftaran supaya orang tua tahu apa yang perlu disiapkan.")}</p>
    ${S.ppdb_status ? `<p class="badge">Pendaftaran: ${esc(S.ppdb_status)}</p>` : ""}
    ${info.length ? `<div class="grid" style="margin-bottom:22px">${info.map(([k, v]) => box(k, paras(v))).join("")}</div>` : ""}
    ${pp.it.length ? R.steps(pp.it) : ""}${S.ppdb_catatan ? `<div class="prose" style="margin-top:20px">${paras(S.ppdb_catatan)}</div>` : ""}
    ${lnk(S.ppdb_link) ? `<p style="margin-top:20px"><a class="btn" href="${lnk(S.ppdb_link)}" target="_blank" rel="noopener">Isi formulir pendaftaran</a></p>` : ""}${ppHas ? "" : EMPTY}`, pp.hidden);

  // Kontak + peta
  const wa = (S.whatsapp || "").replace(/\D/g, "");
  const ct = [["Alamat", paras(S.address)], ["Telepon", paras(S.phone)], ["WhatsApp", wa && `<p><a href="https://wa.me/${wa}">${esc(S.whatsapp)}</a></p>`], ["Email", S.email && `<p><a href="mailto:${esc(S.email)}">${esc(S.email)}</a></p>`], ["Jam layanan", paras(S.hours)]].filter((x) => x[1]);
  const soc = [["Instagram", S.instagram], ["Facebook", S.facebook], ["YouTube", S.youtube]].filter((x) => lnk(x[1]));
  const embed = ((/src="([^"]+)"/.exec(S.maps_embed || "") || [, S.maps_embed || ""])[1] || "").trim().replace(/&amp;/g, "&");
  const mapOk = /^https:\/\/www\.google\.com\/maps\/embed/.test(embed);
  add("kontak", `<h2>Hubungi kami</h2><p class="lead">Ada pertanyaan soal sekolah? Hubungi kami lewat kontak di bawah.</p>
    ${ct.length ? `<div class="grid">${ct.map(([k, v]) => box(k, v)).join("")}</div>` : EMPTY}
    ${S.lokasi_petunjuk ? `<div class="prose" style="margin-top:20px">${paras(S.lokasi_petunjuk)}</div>` : ""}
    ${mapOk ? `<div class="map" style="margin-top:22px"><iframe src="${esc(embed)}" title="Peta lokasi sekolah" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>` : ""}
    ${S.address ? `<p style="margin-top:18px"><a class="btn" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.address)}" target="_blank" rel="noopener">Buka di Google Maps</a></p>` : ""}
    ${soc.length ? `<div class="social">${soc.map(([k, v]) => `<a href="${lnk(v)}" target="_blank" rel="noopener">${k}</a>`).join("")}</div>` : ""}`);

  const NAV = { profil: "Profil", visimisi: "Visi & Misi", struktur: "Struktur", program: "Program", fasilitas: "Fasilitas", kegiatan: "Kegiatan", prestasi: "Prestasi", ppdb: "Penerimaan", kontak: "Kontak" };
  return {
    html: out.map((x, n) => `<section id="${x.id}"${n % 2 ? ' class="tint"' : ""}><div class="wrap">${x.html}</div></section>`).join(""),
    nav: out.map((x) => `<a href="#${x.id}">${NAV[x.id]}</a>`).join(""),
  };
}

async function init() {
  let secs = [], items = [], problem = connected ? "" : "Pratinjau: website belum terhubung ke Supabase. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/config.js, lalu unggah ulang.";
  if (connected) {
    try {
      const sb = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
      const [a, b, c] = await Promise.all([sb.from("site_settings").select("*"), sb.from("sections").select("*").order("sort_order"), sb.from("items").select("*").order("sort_order")]);
      const err = a.error || b.error || c.error;
      if (err) problem = "Data belum bisa dimuat (" + err.message + "). Pastikan schema.sql sudah dijalankan di Supabase.";
      else { S = Object.fromEntries(a.data.map((r) => [r.key, r.value])); secs = b.data; items = c.data; }
    } catch (e) { problem = "Tidak bisa terhubung ke Supabase. Periksa js/config.js."; }
  }
  if (S.school_name) {
    document.title = S.school_name;
    $("#h-name").textContent = $("#f-name").textContent = S.school_name;
    $("#brand").textContent = S.school_name.replace(/^Sekolah( Kristen)? /i, "");
  }
  if (S.hero_text) $("#h-text").textContent = S.hero_text;
  if (S.tagline) $("#f-tag").textContent = S.tagline;
  const r = build(secs, items);
  $("#content").innerHTML = (problem ? `<div class="wrap"><p class="note">${esc(problem)}</p></div>` : "") + r.html;
  $("#nav").innerHTML = r.nav;
  if (problem) { $("#fab").hidden = true; return; }
  chat();
}

function chat() {
  const open = () => { $("#chat").hidden = false; $("#fab").hidden = true; $("#q").focus(); };
  if (S.ai_enabled === "false") { $("#fab").hidden = true; return; }
  const hist = [], box = $("#msgs");
  $("#ai-name").textContent = S.ai_name || "Asisten";
  const add = (t, who) => { const d = document.createElement("div"); d.className = "m " + who; d.textContent = t; box.append(d); box.scrollTop = box.scrollHeight; return d; };
  add(S.ai_welcome || "Halo! Ada yang bisa saya bantu?", "bot");
  $("#fab").onclick = open;
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
