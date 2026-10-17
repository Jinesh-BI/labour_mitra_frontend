import { useState } from "react";
import { todayInput, toNumber } from "@/lib/format";
import type { Details, Distance, Facility, GenderPref, WageType } from "@/features/wizard/WizardContext";
import { tr, type BotLang } from "./copy";

export type Row = { id: string; title: string; desc?: string };

const Header = ({ title, sub, onClose }: { title: string; sub?: string; onClose?: () => void }) => (
  <div className="shh">
    {onClose && (
      <button type="button" className="x" aria-label="Close" onClick={onClose}>
        ✕
      </button>
    )}
    <span>
      {title}
      {sub && <small>{sub}</small>}
    </span>
  </div>
);

/** WhatsApp list message: radio rows and a Send button that enables once a row is chosen. */
export function ListSheet(props: { title: string; rows: Row[]; lang: BotLang; onSend: (id: string) => void; onClose: () => void }) {
  const [sel, setSel] = useState<string | null>(null);
  return (
    <div className="ov" onClick={props.onClose}>
      <div className="sh" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <Header title={props.title} onClose={props.onClose} />
        <div className="shb">
          {props.rows.map((r) => (
            <button type="button" key={r.id} className={`lr${sel === r.id ? " on" : ""}`} onClick={() => setSel(r.id)}>
              <span className="tx">
                <b>{r.title}</b>
                {r.desc && <small>{r.desc}</small>}
              </span>
              <span className="rd" />
            </button>
          ))}
        </div>
        <div className="shf">
          <button type="button" className="go" disabled={!sel} onClick={() => sel && props.onSend(sel)}>
            {tr(props.lang, "send")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Full-screen "Flow" with tick rows: used to choose the work and to choose which workers get the request. */
export function TickSheet(props: {
  title: string;
  hint?: string;
  rows: Row[];
  initial?: string[];
  errText: string;
  lang: BotLang;
  onSubmit: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState<string[]>(props.initial ?? []);
  const [err, setErr] = useState(false);
  const toggle = (id: string) => {
    setErr(false);
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  return (
    <div className="ov">
      <div className="sh full" role="dialog" aria-modal="true">
        <Header title={props.title} sub={tr(props.lang, "flowBy")} onClose={props.onClose} />
        <div className="shb">
          {props.hint && <p className="hint" style={{ fontSize: 14 }}>{props.hint}</p>}
          {props.rows.map((r) => (
            <button type="button" key={r.id} className={`lr${sel.includes(r.id) ? " on" : ""}`} onClick={() => toggle(r.id)}>
              <span className="cb">✓</span>
              <span className="tx">
                <b>{r.title}</b>
                {r.desc && <small>{r.desc}</small>}
              </span>
            </button>
          ))}
          {err && <div className="ferr">{props.errText}</div>}
        </div>
        <div className="shf">
          <button type="button" className="go" onClick={() => (sel.length ? props.onSubmit(sel) : setErr(true))}>
            {tr(props.lang, "submit")}
            {props.hint && sel.length ? ` (${sel.length})` : ""}
          </button>
          <small>{tr(props.lang, "flowBy")}</small>
        </div>
      </div>
    </div>
  );
}

function Stepper(props: { value: number | ""; min: number; max: number; onChange: (n: number) => void }) {
  const v = props.value === "" ? props.min : props.value;
  return (
    <div className="stp">
      <button type="button" aria-label="−" onClick={() => props.onChange(Math.max(props.min, v - 1))}>−</button>
      <b>{v}</b>
      <button type="button" aria-label="+" onClick={() => props.onChange(Math.min(props.max, v + 1))}>+</button>
    </div>
  );
}

function Chip<T>({ on, label, onClick }: { on: boolean; label: string; onClick: () => void } & { value?: T }) {
  return (
    <button type="button" className={`cp${on ? " on" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

/** The prototype's "Job details" Flow. The work itself is chosen in the previous step, so it is not repeated here. */
export function JobSheet(props: {
  initial: Details;
  lang: BotLang;
  suggestion: [number, number] | null;
  onSubmit: (d: Details) => void;
  onClose: () => void;
}) {
  const { lang } = props;
  const t = (k: string, ...a: unknown[]) => tr(lang, k, ...a);
  const [d, setD] = useState<Details>(props.initial);
  const [err, setErr] = useState("");
  const set = (p: Partial<Details>) => setD((x) => ({ ...x, ...p }));
  const sg = props.suggestion;

  const submit = () => {
    if (!d.startDate || d.startDate < todayInput()) return setErr(t("errDate"));
    const wage = toNumber(d.wage);
    if (wage === null || wage <= 0) return setErr(t("errWage"));
    if (d.wageType === "per_acre" && !((toNumber(d.acres) ?? 0) > 0)) return setErr(t("errAcres"));
    props.onSubmit(d);
  };

  const hours = [7, 8, 9];
  const extras: Facility[] = ["tea", "lunch", "transport", "stay"];
  const genders: GenderPref[] = ["any", "men", "women"];
  const distances: Distance[] = [10, 25, 50, null];
  const wageTypes: [WageType, string][] = [["per_day", "wDay"], ["per_acre", "wAcre"], ["fixed", "wLump"]];

  return (
    <div className="ov">
      <div className="sh full" role="dialog" aria-modal="true">
        <Header title={t("flowJob")} sub={t("flowBy")} onClose={props.onClose} />
        <div className="shb">
          <div className="fl">
            <label htmlFor="wa-date">{t("fDate")}</label>
            <input id="wa-date" type="date" className="fi" min={todayInput()} value={d.startDate} onChange={(e) => set({ startDate: e.target.value })} />
            <div className="two">
              <div>
                <label>{t("fDays")}</label>
                <Stepper value={d.days} min={1} max={30} onChange={(n) => set({ days: n })} />
              </div>
              <div>
                <label>{t("fWorkers")}</label>
                <Stepper value={d.workers} min={1} max={50} onChange={(n) => set({ workers: n })} />
              </div>
            </div>
            <label>{t("fTime")}</label>
            <div className="cps">
              {hours.map((h) => (
                <Chip key={h} on={d.reportingTime === `0${h}:00`} label={t("timeL", h)} onClick={() => set({ reportingTime: `0${h}:00` })} />
              ))}
            </div>
            <label>{t("fGender")}</label>
            <div className="cps">
              {genders.map((g) => (
                <Chip key={g} on={d.gender === g} label={t(g === "any" ? "anyone" : g)} onClick={() => set({ gender: g })} />
              ))}
            </div>
            <label>{t("fRadius")}</label>
            <div className="cps">
              {distances.map((r) => (
                <Chip key={String(r)} on={d.distance === r} label={r === null ? t("any") : `${r} ${t("km")}`} onClick={() => set({ distance: r })} />
              ))}
            </div>
            <label>{t("fPay")}</label>
            <div className="cps">
              {wageTypes.map(([w, k]) => (
                <Chip key={w} on={d.wageType === w} label={t(k)} onClick={() => set({ wageType: w })} />
              ))}
            </div>
            {d.wageType === "per_acre" && (
              <>
                <label>{t("fAcres")}</label>
                <Stepper value={Number(d.acres) || 1} min={1} max={100} onChange={(n) => set({ acres: String(n) })} />
              </>
            )}
            <label htmlFor="wa-wage">{t("fAmount")}</label>
            <input
              id="wa-wage" className="fi" inputMode="numeric" value={d.wage}
              placeholder={sg && d.wageType === "per_day" ? String(sg[0]) : ""}
              onChange={(e) => set({ wage: e.target.value.replace(/\D/g, "") })}
            />
            {sg && d.wageType === "per_day" && <div className="hint">{t("typical", sg[0], sg[1])}</div>}
            <label>{t("fExtras")}</label>
            <div className="cps">
              {extras.map((x) => (
                <Chip
                  key={x} on={d.facilities.includes(x)} label={t(`x_${x}`)}
                  onClick={() => set({ facilities: d.facilities.includes(x) ? d.facilities.filter((f) => f !== x) : [...d.facilities, x] })}
                />
              ))}
            </div>
            {err && <div className="ferr" role="alert">{err}</div>}
          </div>
        </div>
        <div className="shf">
          <button type="button" className="go" onClick={submit}>{t("submit")}</button>
          <small>{t("flowBy")}</small>
        </div>
      </div>
    </div>
  );
}
