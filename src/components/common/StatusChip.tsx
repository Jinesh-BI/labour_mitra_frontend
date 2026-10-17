import CancelIcon from "@mui/icons-material/CancelRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassIcon from "@mui/icons-material/HourglassTopRounded";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalkRounded";
import SearchIcon from "@mui/icons-material/ManageSearchRounded";
import Chip from "@mui/material/Chip";
import { useTranslation } from "react-i18next";
import type { BookingStatus, CallSession, JobStatus } from "@/api/types";
import { bookingStatusMeta, callStatusMeta, jobStatusMeta } from "@/lib/status";

type Color = "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info";

// Colour is never the only signal: every status also carries an icon and a text label.
const iconFor = (color: Color) => {
  switch (color) {
    case "success":
      return <CheckCircleIcon />;
    case "error":
      return <CancelIcon />;
    case "warning":
      return <HourglassIcon />;
    case "info":
      return <SearchIcon />;
    default:
      return undefined;
  }
};

type Props =
  | { kind: "job"; status: JobStatus; size?: "small" | "medium" }
  | { kind: "booking"; status: BookingStatus; size?: "small" | "medium" }
  | { kind: "call"; status: CallSession["status"]; size?: "small" | "medium" };

export function StatusChip(props: Props) {
  const { t } = useTranslation();
  const { size = "small" } = props;

  let label: string;
  let color: Color;
  if (props.kind === "job") {
    label = t(`status.job.${props.status}`);
    color = jobStatusMeta[props.status].color;
  } else if (props.kind === "booking") {
    label = t(`status.booking.${props.status}`);
    color = bookingStatusMeta[props.status].color;
  } else {
    label = t(`status.call.${props.status}`);
    color = callStatusMeta[props.status].color;
  }
  const icon = props.kind === "call" && props.status === "in_progress" ? <PhoneInTalkIcon /> : iconFor(color);

  return <Chip size={size} color={color} variant={color === "default" ? "outlined" : "filled"} icon={icon} label={label} sx={{ "& .MuiChip-icon": { fontSize: 18 } }} />;
}
