import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
const C = window.APP_CONFIG, $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sb = createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);

// Tiap menu = form pengaturan [kunci, label, tipe, petunjuk] dan/atau daftar isi {slug, label kolom [judul, sub, isi], foto}
const MENU = [
  { id: "profil", t: "Profil Sekolah", form: [["school_name", "Nama sekolah"], ["tagline", "Kalimat singkat di bawah nama"], ["hero_text", "Pengantar di halaman depan", "ta"], ["jenjang", "Jenjang (mis. SD, SMP, SMA)"], ["akreditasi", "Akreditasi"], ["npsn", "NPSN"], ["tahun_berdiri", "Tahun berdiri"], ["profil_deskripsi", "Profil sekolah", "ta", "Pisahkan paragraf dengan baris kosong."], ["profil_foto", "Foto sekolah", "img"]] },
  { id: "lokasi", t: "Lokasi", form: [["address", "Alamat lengkap", "ta"], ["lokasi_petunjuk", "Petunjuk arah / akses (opsional)", "ta"], ["maps_embed", "Peta Google Maps (opsional)", "ta", "Di Google Maps: Bagikan > Sematkan peta > Salin HTML, lalu tempel di sini. Tombol \"Buka di Google Maps\" tetap muncul dari alamat."]] },
  { id: "sejarah", t: "Sejarah Singkat", items: { slug: "sejarah", h: ["Peristiwa", "Tahun", "Cerita"] } },
  { id: "visimisi", t: "Visi dan Misi", form: [["visi", "Visi sekolah", "ta"]], items: { slug: "misi", h: ["Poin misi", 0, "Penjelasan (opsional)"], head: "Misi" } },
  { id: "struktur", t: "Struktur Organisasi", items: { slug: "struktur", h: ["Nama", "Jabatan", "Keterangan (opsional)"], img: 1 } },
  { id: "program", t: "Program Pendidikan", items: { slug: "program", h: ["Nama program / jenjang", "Keterangan singkat", "Penjelasan"], img: 1 } },
  { id: "fasilitas", t: "Fasilitas", items: { slug: "fasilitas", h: ["Nama fasilitas", 0, "Penjelasan"], img: 1 } },
  { id: "kegiatan", t: "Kegiatan Sekolah", items: { slug: "kegiatan", h: ["Nama kegiatan", "Waktu / tanggal", "Penjelasan"], img: 1 } },
  { id: "prestasi", t: "Prestasi", items: { slug: "prestasi", h: ["Nama prestasi", "Tahun / tingkat", "Keterangan (juara, nama murid)"], img: 1 } },
  { id: "ppdb", t: "Penerimaan Peserta Baru", form: [["ppdb_status", "Status pendaftaran", "sel:|Belum dibuka|Dibuka|Ditutup"], ["ppdb_periode", "Periode pendaftaran"], ["ppdb_biaya", "Biaya pendaftaran", "ta"], ["ppdb_link", "Tautan formulir pendaftaran (opsional)"], ["ppdb_catatan", "Catatan tambahan (persyaratan, dll.)", "ta"]], items: { slug: "ppdb", h: ["Langkah", 0, "Penjelasan"], head: "Langkah pendaftaran" } },
  { id: "kontak", t: "Hubungi Kami", form: [["phone", "Telepon"], ["whatsapp", "WhatsApp (mis. 62812xxxxxxx)"], ["email", "Email"], ["hours", "Jam layanan"], ["instagram", "Instagram (tautan)"], ["facebook", "Facebook (tautan)"], ["youtube", "YouTube (tautan)"]] },
  { id: "ai", t: "Asisten AI", form: [["ai_enabled", "Asisten AI", "sw"], ["ai_name", "Nama asisten"], ["ai_welcome", "Sapaan pertama", "ta"], ["ai_suggestions", "Contoh pertanyaan (satu per baris)", "ta"], ["ai_extra_instructions", "Instruksi tambahan untuk AI (opsional)", "ta"]] },
  { id: "log", t: "Riwayat Tanya AI" },
];
let S = {}, cur = "profil", sec = null, items = [];

const toast = (t) => { const e = $("#toast"); e.textContent = t; e.className = "on"; setTimeout(() => (e.className = ""), 1800); };
const must = (r) => { if (r.error) { alert("Gagal: " + r.error.message); throw r.error; } return r; };
const upsert = (rows) => sb.from("site_settings").upsert(rows);
async function reorder(list, id, dir) {
  const ids = list.map((x) => x.id), i = ids.indexOf(id), j = i + dir; if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((x, k) => sb.from("items").update({ sort_order: k }).eq("id", x)));
}
async function upload(f) {
  const path = `${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
  toast("Mengunggah…"); must(await sb.storage.from("media").upload(path, f));
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

// ---------- Login ----------
async function enter() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { $("#login").hidden = false; $("#app").hidden = true; return; }
  const { data } = await sb.from("admins").select("user_id");
  if (!data?.length) { await sb.auth.signOut(); $("#le").textContent = "Akun ini belum terdaftar sebagai admin."; $("#login").hidden = false; return; }
  $("#login").hidden = true; $("#app").hidden = false; go(cur);
}
$("#lf").onsubmit = async (e) => {
  e.preventDefault(); $("#le").textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email: $("#em").value, password: $("#pw").value });
  if (error) $("#le").textContent = "Email atau kata sandi salah."; else enter();
};
$("#out").onclick = async () => { await sb.auth.signOut(); location.reload(); };

// ---------- Halaman ----------
const field = ([k, l, t, hint]) => {
  const v = S[k] ?? "", note = hint ? `<span class="muted">${hint}</span>` : "";
  if (t === "img") return `<div><strong>${l}</strong><br>${v ? `<img class="thumb" src="${esc(v)}" alt=""><br>` : ""}<input type="file" accept="image/*" data-upk="${k}">${v ? ` <button class="b" data-a="rmk" data-k="${k}">Hapus foto</button>` : ""}</div>`;
  if (t === "sw") return `<label><span><input type="checkbox" data-k="${k}" style="width:auto"${v !== "false" ? " checked" : ""}> ${l} aktif</span></label>`;
  if (t === "ta") return `<label>${l}<textarea data-k="${k}">${esc(v)}</textarea>${note}</label>`;
  if (t?.startsWith("sel:")) return `<label>${l}<select data-k="${k}">${t.slice(4).split("|").map((o) => `<option value="${o}"${o === v ? " selected" : ""}>${o || "(belum diatur)"}</option>`).join("")}</select></label>`;
  return `<label>${l}<input data-k="${k}" value="${esc(v)}">${note}</label>`;
};
const itemsHtml = (m, sc) => {
  const { h, img, head } = m.items;
  return `<h3 style="margin:8px 0">${head || m.t}</h3><div class="card" id="sc"><label>Pengantar singkat (opsional)<textarea id="si">${esc(sc.intro)}</textarea></label>
  <label><span><input type="checkbox" id="sv" style="width:auto"${sc.visible ? " checked" : ""}> Tampilkan bagian ini di website</span></label>
  <div class="acts"><button class="b p" data-a="ssave">Simpan</button></div></div>
  ${items.map((i) => `<div class="card" data-i="${i.id}"><label>${h[0]}<input data-f="title" value="${esc(i.title)}"></label>
   ${h[1] ? `<label>${h[1]}<input data-f="subtitle" value="${esc(i.subtitle)}"></label>` : ""}
   <label>${h[2]}<textarea data-f="body">${esc(i.body)}</textarea></label>
   ${img ? `<div>${i.image_url ? `<img class="thumb" src="${esc(i.image_url)}" alt=""><br>` : ""}<label>Foto (opsional)<input type="file" accept="image/*" data-up></label>${i.image_url ? `<button class="b" data-a="rmimg">Hapus foto</button>` : ""}</div>` : ""}
   <div class="acts"><button class="b p" data-a="isave">Simpan</button><button class="b" data-a="iup">↑ Naik</button><button class="b" data-a="idn">↓ Turun</button><button class="b d" data-a="idel">Hapus</button></div></div>`).join("")}
  ${items.length ? "" : `<p class="muted">Belum ada isi.</p>`}<button class="b p" data-a="iadd">+ Tambah</button>`;
};
async function go(id) {
  cur = id; const m = MENU.find((x) => x.id === id);
  $("#side").innerHTML = MENU.map((x) => `${x.id === "ai" ? '<div class="sep"></div>' : ""}<button data-m="${x.id}" class="${x.id === id ? "on" : ""}">${x.t}</button>`).join("");
  S = Object.fromEntries(must(await sb.from("site_settings").select("*")).data.map((r) => [r.key, r.value]));
  if (id === "log") return viewLog();
  let h = `<h2>${m.t}</h2>`;
  if (m.form) h += `<div class="card" id="fc">${m.form.map(field).join("")}<div class="acts"><button class="b p" data-a="fsave">Simpan</button></div></div>`;
  if (m.items) {
    sec = must(await sb.from("sections").select("*").eq("slug", m.items.slug)).data[0];
    if (!sec) h += `<div class="card">Bagian ini belum ada di database. Jalankan ulang supabase/schema.sql.</div>`;
    else { items = must(await sb.from("items").select("*").eq("section_id", sec.id).order("sort_order")).data; h += itemsHtml(m, sec); }
  }
  $("#view").innerHTML = h;
}
async function viewLog() {
  const d = must(await sb.from("chat_logs").select("*").order("created_at", { ascending: false }).limit(100)).data;
  $("#view").innerHTML = `<h2>Riwayat Tanya AI</h2><div class="card"><p class="muted">Pertanyaan pengunjung. Berguna untuk tahu informasi apa yang masih kurang di website.</p>${d.length ? d.map((l) => `<div class="log" data-l="${l.id}"><strong>${esc(l.question)}</strong><p>${esc(l.answer)}</p><span class="muted">${new Date(l.created_at).toLocaleString("id-ID")}</span> <button class="b d" data-a="ldel">Hapus</button></div>`).join("") : "<p>Belum ada pertanyaan.</p>"}</div>`;
}

// ---------- Aksi ----------
$("#side").onclick = (e) => e.target.dataset.m && go(e.target.dataset.m);
$("#view").onclick = async (e) => {
  const t = e.target, a = t.dataset.a; if (!a) return;
  const card = t.closest("[data-i]"), id = card && +card.dataset.i;
  if (a === "fsave") {
    const rows = [...$("#fc").querySelectorAll("[data-k]")].map((f) => ({ key: f.dataset.k, value: f.type === "checkbox" ? String(f.checked) : f.value.trim() }));
    must(await upsert(rows)); return toast("Tersimpan");
  }
  if (a === "rmk") { must(await upsert([{ key: t.dataset.k, value: "" }])); return go(cur); }
  if (a === "ssave") { must(await sb.from("sections").update({ intro: $("#si").value, visible: $("#sv").checked }).eq("id", sec.id)); return toast("Tersimpan"); }
  if (a === "iadd") { must(await sb.from("items").insert({ section_id: sec.id, sort_order: items.length })); return go(cur); }
  if (a === "isave") { const v = {}; card.querySelectorAll("[data-f]").forEach((f) => (v[f.dataset.f] = f.value)); must(await sb.from("items").update(v).eq("id", id)); return toast("Tersimpan"); }
  if (a === "iup" || a === "idn") { await reorder(items, id, a === "iup" ? -1 : 1); return go(cur); }
  if (a === "idel") { if (confirm("Hapus isi ini?")) { must(await sb.from("items").delete().eq("id", id)); go(cur); } return; }
  if (a === "rmimg") { must(await sb.from("items").update({ image_url: "" }).eq("id", id)); return go(cur); }
  if (a === "ldel") { must(await sb.from("chat_logs").delete().eq("id", +t.closest("[data-l]").dataset.l)); return viewLog(); }
};
$("#view").onchange = async (e) => {
  const t = e.target, f = t.files?.[0]; if (!f) return;
  if (t.dataset.upk) { must(await upsert([{ key: t.dataset.upk, value: await upload(f) }])); return go(cur); }
  if (t.hasAttribute("data-up")) { const id = +t.closest("[data-i]").dataset.i; must(await sb.from("items").update({ image_url: await upload(f) }).eq("id", id)); go(cur); }
};
enter();
