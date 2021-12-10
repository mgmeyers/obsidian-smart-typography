import { SmartTypographySettings } from "types";
import { Transaction } from "@codemirror/state";

const dashChar = "-";
const enDashChar = "–";
const emDashChar = "—";

export function enDash(
  tr: Transaction,
  settings: SmartTypographySettings
): Transaction | false {
  return false;
}
