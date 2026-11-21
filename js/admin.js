import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const C = window.APP_CONFIG, $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sb = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const LAYOUT = { cards: "Kartu (foto + teks)", text: "Teks biasa", timeline: "Garis waktu", steps: "Langkah-langkah", numbered: "Daftar bernomor" };
const HINT = { cards: ["Judul", "Keterangan singkat (mis. jabatan)", "Isi"], text: ["Judul kecil (opsional)", "—", "Isi"], timeline: ["Judul peristiwa", "Tahun", "Cerita"], steps: ["Nama langkah", "—", "Penjelasan"], numbered: ["Poin", "—", "Penjelasan (opsional)"] };
const SET = [["school_name", "Nama sekolah"], ["tagline", "Kalimat singkat di bawah nama"], ["hero_text", "Pengantar di halaman depan", 1], ["address", "Alamat", 1], ["phone", "Telepon"], ["whatsapp", "WhatsApp (contoh: 62812xxxxxxx)"], ["email", "Email"], ["hours", "Jam layanan"],
  ["ai_enabled", "Asisten AI", "sw"], ["ai_name", "Nama asisten"], ["ai_welcome", "Sapaan pertama asisten", 1], ["ai_suggestions", "Contoh pertanyaan (satu per baris)", 1], ["ai_extra_instructions", "Instruksi tambahan untuk AI (opsional)", 1]];
let secs = [], cur = null, items = [], tab = "isi";

const toast = (t) => { const e = $("#toast"); e.textContent = t; e.className = "on"; setTimeout(() => (e.className = ""), 1800); };
const must = (r) => { if (r.error) { alert("Gagal: " + r.error.message); throw r.error; } return r; };
async function reorder(table, list, id, dir) {
  const ids = list.map((x) => x.id), i = ids.indexOf(id), j = i + dir; if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((x, k) => sb.from(table).update({ sort_order: k }).eq("id", x)));
}

// ---------- Login ----------
async function enter() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { $("#login").hidden = false; $("#app").hidden = true; return; }
  const { data } = await sb.from("admins").select("user_id");
  if (!data?.length) { await sb.auth.signOut(); $("#le").textContent = "Akun ini belum terdaftar sebagai admin."; $("#login").hidden = false; return; }
  $("#login").hidden = true; $("#app").hidden = false; show();
}
$("#lf").onsubmit = async (e) => {
  e.preventDefault(); $("#le").textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email: $("#em").value, password: $("#pw").value });
  if (error) $("#le").textContent = "Email atau kata sandi salah."; else enter();
};
$("#out").onclick = async () => { await sb.auth.signOut(); location.reload(); };
$("#tabs").onclick = (e) => { if (!e.target.dataset.t) return; tab = e.target.dataset.t; document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b === e.target)); show(); };
const show = () => ({ isi: viewIsi, set: viewSet, log: viewLog }[tab]());

// ---------- Isi website ----------
async function viewIsi() {
  secs = must(await sb.from("sections").select("*").order("sort_order")).data;
  if (!secs.find((s) => s.id === cur)) cur = secs[0]?.id ?? null;
  items = cur ? must(await sb.from("items").select("*").eq("section_id", cur).order("sort_order")).data : [];
  const s = secs.find((x) => x.id === cur), h = HINT[s?.layout] || HINT.cards;
  $("#view").innerHTML = `<div class="row"><div class="side">${secs.map((x) => `<button data-s="${x.id}" class="${x.id === cur ? "on" : ""}">${esc(x.title)}${x.visible ? "" : " (disembunyikan)"}</button>`).join("")}<button id="ns">+ Bagian baru</button></div>
  <div>${s ? `<div class="card" id="sc"><h2>Bagian: ${esc(s.title)}</h2>
   <label>Judul bagian<input id="st" value="${esc(s.title)}"></label>
   <label>Pengantar singkat (opsional)<textarea id="si">${esc(s.intro)}</textarea></label>
   <label>Tampilan<select id="sl">${Object.entries(LAYOUT).map(([k, v]) => `<option value="${k}"${k === s.layout ? " selected" : ""}>${v}</option>`).join("")}</select></label>
   <label><span><input type="checkbox" id="sv" style="width:auto"${s.visible ? " checked" : ""}> Tampilkan di website</span></label>
   <div class="acts"><button class="b p" data-a="ssave">Simpan bagian</button><button class="b" data-a="sup">↑ Naik</button><button class="b" data-a="sdn">↓ Turun</button><button class="b d" data-a="sdel">Hapus bagian</button></div>
   <p class="muted">Bagian yang belum punya isi tidak muncul di website.</p></div>
   ${items.map((i) => `<div class="card" data-i="${i.id}"><label>${h[0]}<input data-f="title" value="${esc(i.title)}"></label>
     ${h[1] !== "—" ? `<label>${h[1]}<input data-f="subtitle" value="${esc(i.subtitle)}"></label>` : ""}
     <label>${h[2]}<textarea data-f="body">${esc(i.body)}</textarea></label>
     ${s.layout === "cards" || s.layout === "text" ? `<div>${i.image_url ? `<img class="thumb" src="${esc(i.image_url)}" alt=""><br>` : ""}<label>Foto (opsional)<input type="file" accept="image/*" data-up></label>${i.image_url ? `<button class="b" data-a="rmimg">Hapus foto</button>` : ""}</div>` : ""}
     <div class="acts"><button class="b p" data-a="isave">Simpan</button><button class="b" data-a="iup">↑</button><button class="b" data-a="idn">↓</button><button class="b d" data-a="idel">Hapus</button></div></div>`).join("")}
   <button class="b p" data-a="iadd">+ Tambah isi</button>` : `<p>Belum ada bagian. Tambahkan lewat tombol di kiri.</p>`}</div></div>`;
}
$("#view").onclick = async (e) => {
  const t = e.target, a = t.dataset.a, card = t.closest("[data-i]"), id = card && +card.dataset.i;
  if (t.id === "ns") { const n = prompt("Nama bagian baru:"); if (n) { const r = must(await sb.from("sections").insert({ title: n, sort_order: secs.length }).select()); cur = r.data[0].id; viewIsi(); } return; }
  if (t.dataset.s) { cur = +t.dataset.s; return viewIsi(); }
  if (!a) return;
  if (a === "ssave") { must(await sb.from("sections").update({ title: $("#st").value, intro: $("#si").value, layout: $("#sl").value, visible: $("#sv").checked }).eq("id", cur)); toast("Tersimpan"); return viewIsi(); }
  if (a === "sup" || a === "sdn") { await reorder("sections", secs, cur, a === "sup" ? -1 : 1); return viewIsi(); }
  if (a === "sdel") { if (confirm("Hapus bagian ini beserta semua isinya?")) { must(await sb.from("sections").delete().eq("id", cur)); cur = null; viewIsi(); } return; }
  if (a === "iadd") { must(await sb.from("items").insert({ section_id: cur, title: "Judul baru", sort_order: items.length })); return viewIsi(); }
  if (a === "isave") { const v = {}; card.querySelectorAll("[data-f]").forEach((f) => (v[f.dataset.f] = f.value)); must(await sb.from("items").update(v).eq("id", id)); return toast("Tersimpan"); }
  if (a === "iup" || a === "idn") { await reorder("items", items, id, a === "iup" ? -1 : 1); return viewIsi(); }
  if (a === "idel") { if (confirm("Hapus isi ini?")) { must(await sb.from("items").delete().eq("id", id)); viewIsi(); } return; }
  if (a === "rmimg") { must(await sb.from("items").update({ image_url: "" }).eq("id", id)); viewIsi(); }
};
$("#view").onchange = async (e) => {
  if (!e.target.hasAttribute("data-up") || !e.target.files[0]) return;
  const f = e.target.files[0], id = +e.target.closest("[data-i]").dataset.i, path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
  toast("Mengunggah…"); must(await sb.storage.from("media").upload(path, f));
  must(await sb.from("items").update({ image_url: sb.storage.from("media").getPublicUrl(path).data.publicUrl }).eq("id", id)); viewIsi();
};

// ---------- Pengaturan ----------
async function viewSet() {
  const v = Object.fromEntries(must(await sb.from("site_settings").select("*")).data.map((r) => [r.key, r.value]));
  $("#view").innerHTML = `<div class="card" id="sf"><h2>Pengaturan</h2>${SET.map(([k, l, t]) => t === "sw" ? `<label><span><input type="checkbox" data-k="${k}" style="width:auto"${v[k] !== "false" ? " checked" : ""}> ${l} aktif</span></label>` : `<label>${l}${t ? `<textarea data-k="${k}">${esc(v[k])}</textarea>` : `<input data-k="${k}" value="${esc(v[k])}">`}</label>`).join("")}<div class="acts"><button class="b p" data-a="setsave">Simpan pengaturan</button></div></div>`;
  $("#sf").onclick = async (e) => {
    if (e.target.dataset.a !== "setsave") return;
    const rows = [...document.querySelectorAll("[data-k]")].map((f) => ({ key: f.dataset.k, value: f.type === "checkbox" ? String(f.checked) : f.value }));
    must(await sb.from("site_settings").upsert(rows)); toast("Tersimpan");
  };
}

// ---------- Riwayat AI ----------
async function viewLog() {
  const d = must(await sb.from("chat_logs").select("*").order("created_at", { ascending: false }).limit(100)).data;
  $("#view").innerHTML = `<div class="card"><h2>Riwayat tanya AI</h2><p class="muted">Pertanyaan pengunjung, berguna untuk tahu informasi apa yang masih kurang di website.</p>${d.length ? d.map((l) => `<div class="log" data-l="${l.id}"><strong>${esc(l.question)}</strong><p>${esc(l.answer)}</p><span class="muted">${new Date(l.created_at).toLocaleString("id-ID")}</span> <button class="b d" data-a="ldel">Hapus</button></div>`).join("") : "<p>Belum ada pertanyaan.</p>"}</div>`;
  $("#view").querySelectorAll('[data-a="ldel"]').forEach((b) => (b.onclick = async () => { must(await sb.from("chat_logs").delete().eq("id", +b.closest("[data-l]").dataset.l)); viewLog(); }));
}
enter();
