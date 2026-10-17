import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import type { Invitation } from "@/api/types";
import { Avatar } from "@/components/common/Avatar";
import { useFormat } from "@/lib/format";

const colors: Record<Invitation["response_status"], "default" | "success" | "warning" | "error" | "info"> = {
  awaiting: "info",
  interested: "success",
  unavailable: "error",
  needs_discussion: "warning",
  no_response: "default",
};

type Props = { invitation: Invitation; booked: boolean; canBook: boolean; onRecord: () => void; onBook: () => void };

/** A crew we contacted and what they said, as one row. "Interested" is a reply, never a booking. */
export function ReplyCard({ invitation: i, booked, canBook, onRecord, onBook }: Props) {
  const { t } = useTranslation();
  const f = useFormat();
  const canRecord = i.response_status === "awaiting" || i.response_status === "no_response";
  const canBookNow = (i.response_status === "interested" || i.response_status === "needs_discussion") && !booked && canBook;

  return (
    <Box sx={{ py: 1.25 }}>
      <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
        <Avatar name={i.crew_team.team_name} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2, overflowWrap: "anywhere" }}>{i.crew_team.team_name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {i.proposed_headcount ? `${t("reply.offers", { count: i.proposed_headcount })}${i.available_date ? ` · ${t("reply.onDate", { date: f.date(i.available_date) })}` : ""}` : t("reply.invitedOn", { when: f.ago(i.invited_at) })}
          </Typography>
          {i.notes && (
            <Typography variant="body2" color="text.secondary">
              “{i.notes}”
            </Typography>
          )}
        </Box>
        <Chip size="small" color={colors[i.response_status]} variant={i.response_status === "no_response" ? "outlined" : "filled"} label={t(`reply.status_${i.response_status}`)} />
      </Box>
      {(canRecord || canBookNow || booked) && (
        <Box sx={{ display: "flex", gap: 1, mt: 1, ml: 6.5 }}>
          {canRecord && (
            <Button size="small" variant="outlined" onClick={onRecord}>
              {t("reply.record")}
            </Button>
          )}
          {canBookNow && (
            <Button size="small" variant="contained" onClick={onBook}>
              {t("crews.book")}
            </Button>
          )}
          {booked && (
            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
              {t("crews.alreadyBooked")}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
