// Edge Function ask-ai: menjawab pertanyaan pengunjung dari isi website di database.
// Secret: ANTHROPIC_API_KEY (opsional AI_MODEL)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Gunakan POST." }, 405);
  try {
    const { question, history } = await req.json();
    const q = String(question ?? "").trim().slice(0, 800);
    if (!q) return json({ error: "Pertanyaan kosong." }, 400);
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY belum diatur." }, 500);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [st, sec, it] = await Promise.all([
      sb.from("site_settings").select("key,value"),
      sb.from("sections").select("*").eq("visible", true).order("sort_order"),
      sb.from("items").select("*").order("sort_order"),
    ]);
    const err = st.error || sec.error || it.error;
    if (err) throw new Error(err.message);
    const s: Record<string, string> = Object.fromEntries(st.data!.map((r: any) => [r.key, r.value]));
    if (s.ai_enabled === "false") return json({ error: "Asisten sedang dinonaktifkan." }, 403);

    const lines: string[] = [`Nama sekolah: ${s.school_name}`, s.tagline, s.hero_text];
    [["Jenjang", s.jenjang], ["Akreditasi", s.akreditasi], ["NPSN", s.npsn], ["Tahun berdiri", s.tahun_berdiri], ["Profil", s.profil_deskripsi],
     ["Alamat", s.address], ["Petunjuk arah", s.lokasi_petunjuk], ["Visi", s.visi],
     ["Status pendaftaran", s.ppdb_status], ["Periode pendaftaran", s.ppdb_periode], ["Biaya", s.ppdb_biaya], ["Tautan pendaftaran", s.ppdb_link], ["Catatan pendaftaran", s.ppdb_catatan],
     ["Telepon", s.phone], ["WhatsApp", s.whatsapp], ["Email", s.email], ["Jam layanan", s.hours], ["Instagram", s.instagram], ["Facebook", s.facebook], ["YouTube", s.youtube]]
      .forEach(([k, v]) => v && lines.push(`${k}: ${v}`));
    for (const sc of sec.data!) {
      const rows = it.data!.filter((i: any) => i.section_id === sc.id && (i.title || i.body));
      if (!rows.length) continue;
      lines.push(`\n## ${sc.title}`, sc.intro);
      rows.forEach((i: any) => lines.push(`- ${[i.title, i.subtitle, i.body].filter(Boolean).join(" | ")}`));
    }
    const context = lines.filter(Boolean).join("\n");

    const system = `Kamu adalah "${s.ai_name || "Asisten Sekolah"}", asisten di website ${s.school_name}. Jawab pertanyaan pengunjung (biasanya calon orang tua murid) memakai informasi di bawah saja.
- Bahasa Indonesia yang ramah, jelas, dan ringkas, tanpa format markdown berat.
- Jika informasinya tidak ada, katakan belum tersedia di website dan arahkan ke kontak sekolah bila ada. Jangan mengarang angka, tanggal, biaya, atau nama.
${s.ai_extra_instructions ? `\nInstruksi tambahan admin:\n${s.ai_extra_instructions}\n` : ""}
=== INFORMASI SEKOLAH ===
${context || "(Admin belum mengisi data sekolah.)"}
=== AKHIR ===`;

    const msgs = (Array.isArray(history) ? history : []).slice(-6)
      .filter((m: any) => ["user", "assistant"].includes(m?.role) && typeof m.content === "string" && m.content.trim())
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 1500) }));
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    msgs.push({ role: "user", content: q });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("AI_MODEL") || "claude-sonnet-5-5", max_tokens: 700, system, messages: msgs }),
    });
    const d = await res.json();
    if (!res.ok) return json({ error: d?.error?.message || "AI gagal merespons." }, 502);
    const answer = (d.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trim();
    await sb.from("chat_logs").insert({ question: q, answer });
    return json({ answer });
  } catch (e) {
    return json({ error: (e as Error).message || "Terjadi kesalahan." }, 500);
  }
});
