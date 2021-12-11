import { SmartTypographySettings } from "types";

export interface LegacyInputRule {
  matchTrigger: string | RegExp;
  matchRegExp: RegExp | false;
  performUpdate: (
    instance: CodeMirror.Editor,
    delta: CodeMirror.EditorChangeCancellable,
    settings: SmartTypographySettings
  ) => void;
  performRevert:
    | ((
        instance: CodeMirror.Editor,
        delta: CodeMirror.EditorChangeCancellable,
        settings: SmartTypographySettings
      ) => void)
    | false;
}

const dashChar = "-";
const enDashChar = "–";
const emDashChar = "—";

export const enDash: LegacyInputRule = {
  matchTrigger: dashChar,
  matchRegExp: /--$/, // dash, dash
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      enDashChar,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === enDashChar) {
      delta.update(delta.from, delta.to, [dashChar + dashChar]);
    }
  },
};

export const emDash: LegacyInputRule = {
  matchTrigger: dashChar,
  matchRegExp: /–-$/, // en-dash, dash
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      emDashChar,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === emDashChar) {
      delta.update(delta.from, delta.to, [enDashChar + dashChar]);
    }
  },
};

export const trippleDash: LegacyInputRule = {
  matchTrigger: dashChar,
  matchRegExp: /—-$/, // em-dash, dash
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      dashChar + dashChar + dashChar,
    ]);
  },
  performRevert: (instance, delta, settings) => {},
};

export const ellipsis: LegacyInputRule = {
  matchTrigger: ".",
  matchRegExp: /\.\.\.$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 2 }, delta.to, [
      "…",
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === "…") {
      delta.update(delta.from, delta.to, ["..."]);
    }
  },
};

export const openDoubleQuote: LegacyInputRule = {
  matchTrigger: '"',
  matchRegExp: /(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [settings.openDouble]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.openDouble) {
      delta.update(delta.from, delta.to, ['"']);
    }
  },
};

export const closeDoubleQuote: LegacyInputRule = {
  matchTrigger: '"',
  matchRegExp: /"$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [settings.closeDouble]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.closeDouble) {
      delta.update(delta.from, delta.to, ['"']);
    }
  },
};

export const pairedDoubleQuote: LegacyInputRule = {
  matchTrigger: '""',
  matchRegExp: /""$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openDouble + settings.closeDouble,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.openDouble) {
      delta.update(delta.from, { ...delta.to, ch: delta.to.ch + 1 }, ['""']);
      setTimeout(() =>
        instance.setCursor({ ...delta.from, ch: delta.from.ch + 1 })
      );
    }
  },
};

export const wrappedDoubleQuote: LegacyInputRule = {
  matchTrigger: /^".*"$/,
  matchRegExp: false,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openDouble + delta.text[0].slice(1, -1) + settings.closeDouble,
    ]);
  },
  performRevert: false,
};

export const openSingleQuote: LegacyInputRule = {
  matchTrigger: "'",
  matchRegExp: /(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [settings.openSingle]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.openSingle) {
      delta.update(delta.from, delta.to, ["'"]);
    }
  },
};

export const closeSingleQuote: LegacyInputRule = {
  matchTrigger: "'",
  matchRegExp: /'$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [settings.closeSingle]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.closeSingle) {
      delta.update(delta.from, delta.to, ["'"]);
    }
  },
};

export const pairedSingleQuote: LegacyInputRule = {
  matchTrigger: "''",
  matchRegExp: /''$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openSingle + settings.closeSingle,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.openSingle) {
      delta.update(delta.from, { ...delta.to, ch: delta.to.ch + 1 }, ["''"]);
      setTimeout(() =>
        instance.setCursor({ ...delta.from, ch: delta.from.ch + 1 })
      );
    }
  },
};

export const wrappedSingleQuote: LegacyInputRule = {
  matchTrigger: /^'.*'$/,
  matchRegExp: false,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openSingle + delta.text[0].slice(1, -1) + settings.closeSingle,
    ]);
  },
  performRevert: false,
};

export const rightArrow: LegacyInputRule = {
  matchTrigger: ">",
  matchRegExp: /->$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.rightArrow,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.rightArrow) {
      delta.update(delta.from, delta.to, ["->"]);
    }
  },
};

export const leftArrow: LegacyInputRule = {
  matchTrigger: "-",
  matchRegExp: /<-$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.leftArrow,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.leftArrow) {
      delta.update(delta.from, delta.to, ["<-"]);
    }
  },
};

export const greaterThanOrEqualTo: LegacyInputRule = {
  matchTrigger: "=",
  matchRegExp: />=$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.greaterThanOrEqualTo,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (
      instance.getRange(delta.from, delta.to) === settings.greaterThanOrEqualTo
    ) {
      delta.update(delta.from, delta.to, [">="]);
    }
  },
};

export const lessThanOrEqualTo: LegacyInputRule = {
  matchTrigger: "=",
  matchRegExp: /<=$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.lessThanOrEqualTo,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (
      instance.getRange(delta.from, delta.to) === settings.lessThanOrEqualTo
    ) {
      delta.update(delta.from, delta.to, ["<="]);
    }
  },
};

export const notEqualTo: LegacyInputRule = {
  matchTrigger: "=",
  matchRegExp: /\/=$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.notEqualTo,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.notEqualTo) {
      delta.update(delta.from, delta.to, ["/="]);
    }
  },
};

export const rightGuillemet: LegacyInputRule = {
  matchTrigger: ">",
  matchRegExp: />>$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      "»",
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === "»") {
      delta.update(delta.from, delta.to, [">>"]);
    }
  },
};

export const leftGuillemet: LegacyInputRule = {
  matchTrigger: "<",
  matchRegExp: /<<$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      "«",
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === "«") {
      delta.update(delta.from, delta.to, ["<<"]);
    }
  },
};

export const legacyDashRules = [enDash, emDash, trippleDash];
export const legacyEllipsisRules = [ellipsis];
export const legacySmartQuoteRules = [
  openDoubleQuote,
  closeDoubleQuote,
  pairedDoubleQuote,
  wrappedDoubleQuote,
  openSingleQuote,
  closeSingleQuote,
  pairedSingleQuote,
  wrappedSingleQuote,
];
export const legacyComparisonRules = [
  lessThanOrEqualTo,
  greaterThanOrEqualTo,
  notEqualTo,
];
export const legacyArrowRules = [leftArrow, rightArrow];
export const legacyGuillemetRules = [leftGuillemet, rightGuillemet];
