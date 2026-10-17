import { useEffect, useRef, useState } from "react";
import { authApi } from "@/api/endpoints/auth";
import { toApiError } from "@/api/errors";
import { useAuth } from "@/auth/AuthContext";
import { BotChat } from "./BotChat";
import { tr, toBotLang } from "./copy";

/**
 * Entry for the WhatsApp-style chat. The link (sent after the real WhatsApp chat collected name, language and role) is
 * /bot?mobile=98xxxxxxxx&name=Ramesh&lang=mr&role=demand. The backend returns a normal session, creating the demand user
 * on first use, and the chat then runs on the same JWT API as the rest of the app. No signature or OTP in the MVP.
 */
export function BotPage() {
  const { user, signIn } = useAuth();
  const q = new URLSearchParams(window.location.search);
  const [link] = useState(() => ({
    mobile: q.get("mobile") ?? "",
    name: (q.get("name") ?? "").trim(),
    lang: toBotLang(q.get("lang")),
    role: q.get("role") === "labour" ? ("labour" as const) : ("demand" as const),
  }));
  const [state, setState] = useState<"loading" | "ready" | "error">(
    link.role === "labour" || (!link.mobile && user) ? "ready" : "loading",
  );
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || state !== "loading") return;
    ran.current = true;
    if (!link.mobile) {
      setState("error");
      return;
    }
    authApi
      .botSession({ mobile: link.mobile, name: link.name, role: "demand", lang: link.lang })
      .then((session) => {
        signIn(session);
        // The mobile number should not linger in the address bar or history.
        window.history.replaceState(null, "", "/bot");
        setState("ready");
      })
      .catch((e) => {
        setError(toApiError(e).message);
        setState("error");
      });
  }, [link, signIn, state]);

  if (state === "ready") return <BotChat role={link.role} name={link.name} lang={link.lang} />;

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
      <p>{state === "loading" ? "…" : error || tr(link.lang, "err")}</p>
    </div>
  );
}
