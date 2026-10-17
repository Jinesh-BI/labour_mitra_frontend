import { Fragment, useEffect, useRef, useState } from "react";
import { bookingsApi } from "@/api/endpoints/bookings";
import { callsApi } from "@/api/endpoints/calls";
import { catalogApi } from "@/api/endpoints/catalog";
import { demandApi } from "@/api/endpoints/demand";
import { jobsApi } from "@/api/endpoints/jobs";
import { toApiError } from "@/api/errors";
import { queryClient } from "@/api/queryClient";
import { queryKeys } from "@/api/queryKeys";
import type { Activity, CrewCandidate, Crop, JobCreateBody, Village } from "@/api/types";
import { defaultDetails, type Details } from "@/features/wizard/WizardContext";
import { activityName, pickName } from "@/i18n/catalog";
import { cropLook } from "@/lib/crops";
import { toNumber } from "@/lib/format";
import { readJson, writeJson } from "@/lib/safeStorage";
import { tr, type BotLang } from "./copy";
import { JobSheet, ListSheet, TickSheet, type Row } from "./Sheets";
import "./bot.css";

type Btn = { id: string; title: string };
type Msg = {
  id: number; from: "bot" | "me"; time: string;
  type: "text" | "sys" | "buttons" | "list" | "flow" | "locreq" | "loc" | "resp" | "mcall";
  text?: string; buttons?: Btn[];
  listBtn?: string; title?: string; rows?: Row[];
  flow?: "work" | "job" | "pick"; flowBtn?: string;
  btn?: string; sub?: string; name?: string; ini?: string; color?: string; crewId?: string;
};
type NewMsg = Omit<Msg, "id" | "time" | "from"> & { from?: "bot" | "me" };
type Ov = { kind: "list"; mid: number } | { kind: "work" } | { kind: "job" } | { kind: "pick" } | null;
type CallState = { name: string; stage: 0 | 1 } | null;

const INTERACTIVE = ["buttons", "list", "flow", "locreq"];
const AVC = ["#1E6B3B", "#5A2A80", "#BF2E1C", "#A87F06", "#97405F", "#2D5D8A", "#6B4A2E"];
const NOTIFY_KEY = "lm_bot_notify";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toLowerCase();
const initials = (n: string) => n.split(" ").map((x) => x[0]).slice(0, 2).join("");
const VB = (
  <svg className="vb" viewBox="0 0 24 24" aria-label="verified">
    <circle cx="12" cy="12" r="11" fill="#25D366" />
    <path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** *bold*, _italic_, line breaks: the WhatsApp formatting the bot uses. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.length > 2 && p.startsWith("*") && p.endsWith("*")) return <b key={i}>{p.slice(1, -1)}</b>;
        if (p.length > 2 && p.startsWith("_") && p.endsWith("_")) return <i key={i}>{p.slice(1, -1)}</i>;
        return (
          <Fragment key={i}>
            {p.split("\n").map((line, j) => (
              <Fragment key={j}>{j > 0 && <br />}{line}</Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

type Flow = {
  lang: BotLang; name: string; expect: "name" | null;
  crops: Crop[]; crop: Crop | null; stage: "pre" | "post" | null;
  activities: Activity[]; actIds: string[];
  job: Details; jobId: string; cands: CrewCandidate[]; picked: string[]; hasLoc: boolean;
};

type Props = { role: "demand" | "labour"; name: string; lang: BotLang };

/** WhatsApp-Business clone of the LabourNow bot. The user is already signed in, so every step calls the normal REST API. */
export function BotChat({ role, name, lang: initialLang }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [actId, setActId] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [ov, setOv] = useState<Ov>(null);
  const [villages, setVillages] = useState<Row[] | null>(null);
  const [call, setCall] = useState<CallState>(null);
  const [draft, setDraft] = useState("");
  const [, rerender] = useState(0);

  const S = useRef<Flow>({
    lang: initialLang, name, expect: null, crops: [], crop: null, stage: null, activities: [], actIds: [],
    job: defaultDetails(), jobId: "", cands: [], picked: [], hasLoc: false,
  });
  const mid = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const lg = () => S.current.lang;
  const t = (k: string, ...a: unknown[]) => tr(lg(), k, ...a);
  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(lg() === "mr" ? "mr-IN-u-nu-latn" : "en-IN", { weekday: "short", day: "numeric", month: "short" });
  const cropLabel = (c: { name: string; name_mr?: string }) => pickName(c, lg(), "crop");
  const money = (v: string | null | undefined) => (v ? String(Math.round(Number(v))) : "—");

  const push = (m: NewMsg) => {
    const id = ++mid.current;
    const full: Msg = { from: "bot", ...m, id, time: now() };
    setMsgs((l) => [...l, full]);
    if (full.from === "bot" && INTERACTIVE.includes(full.type)) setActId(id);
    return id;
  };
  const me = (m: NewMsg) => push({ ...m, from: "me" });

  /** Queue bot messages behind a typing indicator, like the real chat. A producer can fetch data first. */
  const enqueue = (producer: () => NewMsg[] | Promise<NewMsg[]>) => {
    queue.current = queue.current.then(async () => {
      setTyping(true);
      let list: NewMsg[];
      try {
        list = await producer();
      } catch (e) {
        list = [{ type: "text", text: toApiError(e).message || t("err") }];
      }
      for (const m of list) {
        setTyping(true);
        await sleep(420 + Math.min(950, (m.text || "").length * 6));
        setTyping(false);
        push(m);
      }
      setTyping(false);
    });
    return queue.current;
  };
  const bot = (...m: NewMsg[]) => enqueue(() => m);
  const btns = (text: string, ids: string[], titles: string[]): NewMsg => ({
    type: "buttons", text, buttons: ids.map((id, i) => ({ id, title: titles[i] })),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, typing]);

  // ---------- message builders ----------
  const menuMsg = (): NewMsg => ({
    type: "list", text: t("menuText"), listBtn: t("menuBtn"), title: t("menuBtn"),
    rows: (t("menuRows") as string[][]).map((r) => ({ id: r[0], title: r[1], desc: r[2] })),
  });
  const askKind = () => bot(btns(t("askKind"), ["k_agri", "k_cons", "k_shop"], t("kinds")));
  const jobFlowMsg = (): NewMsg => ({ type: "flow", flow: "job", text: t("askJob"), flowBtn: t("jobBtn") });
  const workFlowMsg = (): NewMsg => ({ type: "flow", flow: "work", text: t("askWork"), flowBtn: t("workBtn") });

  const askCrop = () =>
    enqueue(async () => {
      const s = S.current;
      if (!s.crops.length) s.crops = await catalogApi.crops();
      return [{
        type: "list", text: t("askCrop"), listBtn: t("cropBtn"), title: t("cropBtn"),
        rows: s.crops.map((c) => ({
          id: `c_${c.id}`,
          title: `${cropLook(c.name).emoji} ${cropLabel(c)}`,
          desc: lg() === "mr" ? c.name : pickName(c, "mr", "crop"),
        })),
      }];
    });

  const payText = (d: Details) =>
    d.wageType === "per_day" ? t("payDay", d.wage) : d.wageType === "per_acre" ? t("payAcre", d.wage, d.acres || "1") : t("payLump", d.wage);

  const suggestion = (): [number, number] | null => {
    const picked = S.current.activities.filter((a) => S.current.actIds.includes(a.id));
    let lo = 0;
    let hi = 0;
    picked.forEach((a) => {
      lo = Math.max(lo, toNumber(a.typical_wage_min) ?? 0);
      hi = Math.max(hi, toNumber(a.typical_wage_max) ?? 0);
    });
    return hi > 0 ? [lo, hi] : null;
  };

  const rowOf = (c: CrewCandidate): Row => ({
    id: `w_${c.crew_team.id}`,
    title: c.crew_team.leader_name + (c.crew_team.is_group ? ` (${c.crew_team.team_size})` : ""),
    desc: t("rowDesc", c.crew_team.village_name, Math.max(1, Math.round(c.distance_km)), money(c.crew_team.daily_rate), c.crew_team.rating ?? "—"),
  });

  /** Creates the job, asks the backend who matches, and shows the prototype's summary with the hire options. */
  const summary = () =>
    enqueue(async () => {
      const s = S.current;
      const d = s.job;
      const crop = s.crop!;
      const body: JobCreateBody = {
        activity_ids: s.actIds,
        required_workers: Number(d.workers),
        start_date: d.startDate,
        duration_days: Number(d.days),
        reporting_time: `${d.reportingTime}:00`,
        gender_preference: d.gender,
        max_distance_km: d.distance,
        experienced_only: d.experienced,
        wage_type: d.wageType,
        wage_amount: d.wage,
        acres: d.wageType === "per_acre" ? d.acres : null,
        facilities: d.facilities,
      };
      if (s.jobId) await jobsApi.cancel(s.jobId, "edited").catch(() => undefined);
      s.jobId = "";
      try {
        const job = await jobsApi.create(body);
        s.jobId = job.id;
        void queryClient.invalidateQueries({ queryKey: queryKeys.jobsAll });
      } catch (e) {
        return [{ type: "text", text: toApiError(e).message }, jobFlowMsg()];
      }
      s.cands = await jobsApi.candidates(s.jobId);
      s.picked = [];

      const extras = d.facilities.map((x) => t(`x_${x}`)).join(", ");
      const lines = [
        t("jobHead"),
        `${cropLook(crop.name).emoji} ${cropLabel(crop)}, ${t("stageN")[s.stage!]}`,
        `🛠️ ${s.activities.filter((a) => s.actIds.includes(a.id)).map((a) => pickName(a, lg(), "activity")).join(", ")}`,
        `📅 ${fmtDate(d.startDate)}, ${d.days} ${t("dayU", Number(d.days))}, ${t("reportAt", parseInt(d.reportingTime, 10))}`,
        `👷 ${t("workersN", Number(d.workers), t(`g_${d.gender}`))}`,
        `💰 ${payText(d)}`,
      ];
      if (extras) lines.push(`🍽️ ${extras}`);
      if (!s.cands.length) {
        return [{ type: "text", text: lines.join("\n") }, btns(t("noWorkers"), ["h_edit", "menu"], t("noBtns"))];
      }
      lines.push("", t("found", s.cands.length, d.distance ?? 100), "", t("howHire"));
      return [btns(lines.join("\n"), ["h_browse", "h_send", "h_edit"], t("hireBtns"))];
    });

  const workerList = () =>
    bot(
      S.current.cands.length
        ? {
            type: "list", text: t("workerList", Math.min(10, S.current.cands.length)), listBtn: t("listBtn"), title: t("listBtn"),
            rows: S.current.cands.slice(0, 10).map(rowOf),
          }
        : btns(t("noWorkers"), ["h_edit", "menu"], t("noBtns")),
    );

  const profile = (crewId: string) => {
    const c = S.current.cands.find((x) => x.crew_team.id === crewId);
    if (!c) return;
    const k = c.crew_team;
    const text = t("prof", {
      name: k.leader_name, type: k.is_group ? t("grp", k.team_size) : t("ind"), g: t("gx")[k.gender],
      v: k.village_name, km: Math.max(1, Math.round(c.distance_km)), rating: k.rating ?? "—", jobs: c.jobs_completed,
      rate: money(k.daily_rate), skills: c.matched_activities.map((n) => `*${activityName(n, lg())}*`).join(", "),
    });
    return bot(btns(text, [`p_call_${crewId}`, `p_add_${crewId}`, "h_browse"], t("profBtns")));
  };

  const showContact = (crewId: string) => {
    const c = S.current.cands.find((x) => x.crew_team.id === crewId);
    if (!c) return;
    const name = c.crew_team.leader_name;
    const idx = S.current.cands.indexOf(c);
    return bot(
      { type: "text", text: t("contactIntro", name) },
      { type: "mcall", name, ini: initials(name), color: AVC[idx % AVC.length], sub: t("mcallSub"), btn: t("callBtn"), crewId },
      btns(t("whatNext"), ["h_browse", "h_send", "menu"], t("afterBtns")),
    );
  };

  const myReqs = () =>
    enqueue(async () => {
      const page = await jobsApi.list({ page_size: 10 });
      if (!page.results.length) return [{ type: "text", text: t("noReqs") }];
      const lines = [
        t("reqHead"),
        ...page.results.map((j, i) =>
          t("reqLine", i + 1, `${cropLook(j.crop).emoji} ${cropLabel({ name: j.crop })}`, fmtDate(j.start_date), j.filled_headcount, j.required_workers, j.filled_headcount >= j.required_workers),
        ),
      ];
      return [{ type: "text", text: lines.join("\n") }, btns(t("whatNext"), ["m_new", "menu"], [t("menuRows")[0][1], t("noBtns")[1]])];
    });

  const afterLocation = () => {
    const s = S.current;
    s.hasLoc = true;
    return s.actIds.length && s.crop && s.job.wage ? summary() : askKind();
  };

  const askVillage = async () => {
    const list = await catalogApi.villages().catch(() => [] as Village[]);
    setVillages(list.map((v) => ({ id: `v_${v.id}`, title: v.name, desc: v.district })));
    return bot({ type: "list", text: t("locFail"), listBtn: t("villageBtn"), title: t("villageBtn"), rows: list.map((v) => ({ id: `v_${v.id}`, title: v.name, desc: v.district })) });
  };

  const saveLocation = (body: { latitude: number; longitude: number } | { village_id: string }, village?: string) =>
    enqueue(async () => {
      const p = await demandApi.updateMe("village_id" in body ? body : { ...body, location_source: "gps" });
      queryClient.setQueryData(queryKeys.demandMe, p);
      let place = village || p.village_name || "";
      if (!place && "latitude" in body) place = (await catalogApi.nearestVillages(body.latitude, body.longitude).catch(() => []))[0]?.name ?? "";
      S.current.hasLoc = true;
      return [{ type: "text", text: place ? t("gotLoc", place) : t("gotLocPlain") }];
    }).then(afterLocation);

  const sendLoc = () => {
    setActId(null);
    let fired = false;
    const done = (pos: GeolocationPosition | null) => {
      if (fired) return;
      fired = true;
      if (!pos) return void askVillage();
      const { latitude: lat, longitude: lng } = pos.coords;
      me({ type: "loc", title: t("locTitle"), sub: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      void saveLocation({ latitude: lat, longitude: lng });
    };
    if (!navigator.geolocation) return done(null);
    setTimeout(() => done(null), 7000);
    navigator.geolocation.getCurrentPosition(done, () => done(null), { timeout: 6500, maximumAge: 60_000 });
  };

  // ---------- conversation ----------
  const handle = (bid: string) => {
    const s = S.current;
    if (bid.startsWith("lang_")) {
      s.lang = bid.slice(5) as BotLang;
      rerender((n) => n + 1);
      bot({ type: "text", text: t("langSet") }, menuMsg());
      return;
    }
    if (bid === "k_agri") return void askCrop();
    if (bid === "k_cons" || bid === "k_shop") {
      const i = bid === "k_cons" ? 1 : 2;
      return void bot(btns(t("soon", (t("kinds")[i] as string).slice(3)), [`nt_${bid}`, "k_agri"], t("soonBtns")));
    }
    if (bid.startsWith("nt_")) {
      const prev = readJson<string[]>(NOTIFY_KEY) ?? [];
      writeJson(NOTIFY_KEY, [...new Set([...prev, bid.slice(3)])]);
      return void bot({ type: "text", text: t("notified") }, menuMsg());
    }
    if (bid.startsWith("c_")) {
      s.crop = s.crops.find((c) => c.id === bid.slice(2)) ?? null;
      s.actIds = [];
      if (!s.crop) return;
      return void bot(btns(t("askStage", cropLabel(s.crop)), ["s_pre", "s_post"], t("stageBtns")));
    }
    if (bid === "s_pre" || bid === "s_post") {
      s.stage = bid === "s_pre" ? "pre" : "post";
      s.job = defaultDetails();
      s.job.workers = 5;
      s.job.reportingTime = "08:00";
      return void enqueue(async () => {
        s.activities = await catalogApi.activities({ crop: s.crop!.id, stage: s.stage === "pre" ? "pre_harvest" : "post_harvest" });
        return [workFlowMsg()];
      });
    }
    if (bid === "h_edit") return void bot(jobFlowMsg());
    if (bid === "h_browse") return void workerList();
    if (bid === "h_send") {
      const k = s.picked.length;
      return void bot({ type: "flow", flow: "pick", text: k ? t("pickIntroK", k) : t("pickIntro"), flowBtn: t("pickBtn") });
    }
    if (bid.startsWith("w_")) return void profile(bid.slice(2));
    if (bid.startsWith("p_call_")) return void showContact(bid.slice(7));
    if (bid.startsWith("p_add_")) {
      const id = bid.slice(6);
      const c = s.cands.find((x) => x.crew_team.id === id);
      if (!c) return;
      const n = c.crew_team.leader_name;
      if (s.picked.includes(id)) return void bot(btns(t("already", n), ["h_send", "h_browse"], t("addedBtns")));
      s.picked.push(id);
      return void bot(btns(t("added", n, s.picked.length), ["h_send", "h_browse"], t("addedBtns")));
    }
    if (bid.startsWith("v_")) {
      const row = villages?.find((r) => r.id === bid);
      return void saveLocation({ village_id: bid.slice(2) }, row?.title);
    }
    if (bid === "menu") return void bot(menuMsg());
    if (bid === "m_new") return void askKind();
    if (bid === "m_reqs") return void myReqs();
    if (bid === "m_lang") return void bot(btns(t("langAsk"), ["lang_en", "lang_mr"], ["English", "मराठी"]));
    if (bid === "m_help") return void bot({ type: "text", text: t("help") });
  };

  const sendRequest = (ids: string[]) =>
    enqueue(async () => {
      const s = S.current;
      const sent = await bookingsApi.invite(s.jobId, ids);
      void queryClient.invalidateQueries({ queryKey: queryKeys.job(s.jobId) });
      s.picked = [];
      s.jobId = "";
      return [
        { type: "text", text: t("reqSent", sent.length) } as NewMsg,
        btns(t("whatNext"), ["m_reqs", "menu"], [`📋 ${t("menuRows")[1][1]}`, t("noBtns")[1]]),
      ];
    });

  const onText = (txt: string) => {
    me({ type: "text", text: txt });
    const s = S.current;
    if (role === "labour") return void bot({ type: "text", text: t("workerSoon") });
    if (s.expect === "name") {
      s.name = txt.trim().slice(0, 40);
      s.expect = null;
      void demandApi.updateMe({ full_name: s.name }).catch(() => undefined);
      void bot({ type: "text", text: t("thanksName", s.name) });
      return void askKind();
    }
    if (["menu", "मेनू", "hi", "hii", "hello", "namaskar", "नमस्कार", "हाय"].includes(txt.trim().toLowerCase())) return void bot(menuMsg());
    void bot({ type: "text", text: t("typeHint") });
  };

  // First load: welcome by name, then straight to "What kind of workers do you need?"
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const s = S.current;
    if (role === "labour") {
      void bot({ type: "text", text: t("welcome", s.name) }, { type: "text", text: t("workerSoon") });
      return;
    }
    void (async () => {
      try {
        const p = await demandApi.me();
        queryClient.setQueryData(queryKeys.demandMe, p);
        s.hasLoc = p.latitude != null || !!p.village;
        if (!s.name && p.full_name && p.full_name !== "Farmer") s.name = p.full_name;
      } catch {
        /* the chat still starts; the first API step shows any error */
      }
      if (s.name) {
        void bot({ type: "text", text: t("welcome", s.name) });
        void askKind();
      } else {
        s.expect = "name";
        void bot({ type: "text", text: t("welcome", "") }, { type: "text", text: t("askName") });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- calls ----------
  const startCall = (name: string, crewId: string) => {
    setCall({ name, stage: 0 });
    setTimeout(() => setCall((c) => (c ? { ...c, stage: 1 } : c)), 1400);
    callsApi.start({ labour_request_id: S.current.jobId, crew_team_id: crewId }).catch((e) => {
      setCall(null);
      void bot({ type: "text", text: `${t("callFail")}\n${toApiError(e).message}` });
    });
  };

  // ---------- render ----------
  const live = (m: Msg) => actId === m.id;
  const msgById = (id: number) => msgs.find((m) => m.id === id);

  const onButton = (m: Msg, b: Btn) => {
    if (!live(m)) return;
    setActId(null);
    me({ type: "text", text: b.title });
    handle(b.id);
  };

  const listOv = ov?.kind === "list" ? msgById(ov.mid) : undefined;

  return (
    <div className="wa">
      <div className="wh">
        <div className="wav" aria-hidden="true">🌾</div>
        <div className="wn">
          <b>LabourNow {VB}</b>
          <span>{typing ? t("typing") : t("biz")}</span>
        </div>
        <div className="wi" aria-hidden="true">⋮</div>
      </div>

      <div className="body" role="log" aria-live="polite">
        {msgs.map((m) => (
          <Bubble key={m.id} m={m} live={live(m)} t={t}
            onButton={(b) => onButton(m, b)}
            onList={() => setOv({ kind: "list", mid: m.id })}
            onFlow={() => m.flow && setOv({ kind: m.flow })}
            onLoc={() => live(m) && sendLoc()}
            onCall={() => m.crewId && startCall(m.name ?? "", m.crewId)}
          />
        ))}
        {typing && (
          <div className="row in"><div className="bub typing" aria-label={t("typing")}><i /><i /><i /></div></div>
        )}
        <div ref={endRef} />
      </div>

      <form className="inbar" onSubmit={(e) => { e.preventDefault(); const x = draft.trim(); if (x) { setDraft(""); onText(x); } }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} autoComplete="off" placeholder={t("ph")} aria-label={t("ph")} />
        <button type="submit" className="snd" aria-label="Send">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z" /></svg>
        </button>
      </form>

      {listOv?.rows && (
        <ListSheet title={listOv.title ?? ""} rows={listOv.rows} lang={lg()} onClose={() => setOv(null)}
          onSend={(id) => {
            const r = listOv.rows!.find((x) => x.id === id)!;
            setOv(null);
            setActId(null);
            me({ type: "text", text: r.title + (r.desc ? `\n${r.desc}` : "") });
            handle(id);
          }} />
      )}
      {ov?.kind === "work" && (
        <TickSheet title={t("flowWork")} lang={lg()} errText={t("errActs")} initial={S.current.actIds}
          rows={S.current.activities.map((a) => {
            const lo = toNumber(a.typical_wage_min);
            const hi = toNumber(a.typical_wage_max);
            return { id: a.id, title: pickName(a, lg(), "activity"), desc: lo && hi ? `₹${lo}–₹${hi} ${t("perDay")}` : undefined };
          })}
          onClose={() => setOv(null)}
          onSubmit={(ids) => {
            S.current.actIds = ids;
            setOv(null);
            setActId(null);
            me({ type: "resp", title: t("flowWork"), sub: t("respSent") });
            void bot(jobFlowMsg());
          }} />
      )}
      {ov?.kind === "job" && (
        <JobSheet initial={S.current.job} lang={lg()} suggestion={suggestion()} onClose={() => setOv(null)}
          onSubmit={(d) => {
            S.current.job = d;
            setOv(null);
            setActId(null);
            me({ type: "resp", title: t("flowJob"), sub: t("respSent") });
            if (S.current.hasLoc) void summary();
            else void bot({ type: "locreq", text: t("askLoc"), btn: t("locBtn") });
          }} />
      )}
      {ov?.kind === "pick" && (
        <TickSheet title={t("flowPick")} hint={t("pickHint")} lang={lg()} errText={t("errPick")} initial={S.current.picked}
          rows={S.current.cands.map((c) => ({ ...rowOf(c), id: c.crew_team.id }))}
          onClose={() => setOv(null)}
          onSubmit={(ids) => {
            setOv(null);
            setActId(null);
            me({ type: "resp", title: t("flowPick"), sub: `${t("respSent")} (${ids.length})` });
            void sendRequest(ids);
          }} />
      )}

      {call && (
        <div className="callscr" role="dialog" aria-modal="true" aria-label={t("callTitle")}>
          <div className="cs-top">🔒 {t("callTitle")}</div>
          <div className="cs-av" aria-hidden="true">{initials(call.name)}</div>
          <div className="cs-name">{call.name}</div>
          <div className="cs-st" aria-live="polite">{call.stage === 0 ? t("callConnecting") : t("callRinging")}</div>
          <div className="cs-no">{t("maskedNo")}</div>
          <div className="cs-hide">{t("callHidden", call.name)}</div>
          <button type="button" className="cs-end" onClick={() => setCall(null)} aria-label={t("callEnd")}><span>📞</span></button>
          <div className="cs-endl">{t("callEnd")}</div>
        </div>
      )}
    </div>
  );
}

function Bubble(props: {
  m: Msg; live: boolean; t: (k: string, ...a: unknown[]) => any;
  onButton: (b: Btn) => void; onList: () => void; onFlow: () => void; onLoc: () => void; onCall: () => void;
}) {
  const { m, live, t } = props;
  if (m.type === "sys") return <div className="sys"><Rich text={m.text ?? ""} /></div>;
  const tm = (
    <span className="tm">{m.time}{m.from === "me" && <span className="ticks"> ✓✓</span>}</span>
  );
  let inner;
  switch (m.type) {
    case "loc":
      inner = (
        <>
          <div className="map"><span className="pin">📍</span></div>
          <div className="loclbl"><b>{m.title}</b><br /><span>{m.sub}</span></div>
        </>
      );
      break;
    case "resp":
      inner = <div className="resp">📝 <b>{m.title}</b><br /><span>{m.sub}</span></div>;
      break;
    case "mcall":
      inner = (
        <div className="ct">
          <div className="cav" style={{ background: m.color }}>{m.ini}</div>
          <div><b>{m.name}</b><div className="ctn">{m.sub}</div></div>
        </div>
      );
      break;
    default:
      inner = <div><Rich text={m.text ?? ""} /></div>;
  }

  let actions: React.ReactNode = null;
  if (m.type === "buttons") {
    actions = m.buttons!.map((b) => (
      <button key={b.id} type="button" className="ib" disabled={!live} onClick={() => props.onButton(b)}>{b.title}</button>
    ));
  } else if (m.type === "list") {
    actions = <button type="button" className="ib" disabled={!live} onClick={props.onList}>☰ {m.listBtn}</button>;
  } else if (m.type === "flow") {
    actions = <button type="button" className="ib" disabled={!live} onClick={props.onFlow}>{m.flowBtn}</button>;
  } else if (m.type === "locreq") {
    actions = <button type="button" className="ib" disabled={!live} onClick={props.onLoc}>📍 {m.btn}</button>;
  } else if (m.type === "mcall") {
    actions = <button type="button" className="ib" onClick={props.onCall}>{m.btn}</button>;
  }
  void t;
  return (
    <div className={`row ${m.from === "me" ? "out" : "in"}`}>
      <div className="bw">
        <div className="bub">{inner}{tm}</div>
        {actions && <div className="ibs">{actions}</div>}
      </div>
    </div>
  );
}
