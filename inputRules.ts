import { SmartTypographySettings } from "types";

export interface InputRule {
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

export const enDash: InputRule = {
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

export const emDash: InputRule = {
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

export const trippleDash: InputRule = {
  matchTrigger: dashChar,
  matchRegExp: /—-$/, // em-dash, dash
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      dashChar + dashChar + dashChar,
    ]);
  },
  performRevert: (instance, delta, settings) => {},
};

export const ellipsis: InputRule = {
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

export const openDoubleQuote: InputRule = {
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

export const closeDoubleQuote: InputRule = {
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

export const pairedDoubleQuote: InputRule = {
  matchTrigger: '""',
  matchRegExp: /""$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openDouble + settings.closeDouble,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.closeDouble) {
      delta.update(delta.from, { ...delta.to, ch: delta.to.ch + 1 }, ['""']);
      setTimeout(() =>
        instance.setCursor({ ...delta.from, ch: delta.from.ch + 1 })
      );
    }
  },
};

export const wrappedDoubleQuote: InputRule = {
  matchTrigger: /^".*"$/,
  matchRegExp: false,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openDouble + delta.text[0].slice(1, -1) + settings.closeDouble,
    ]);
  },
  performRevert: false,
};

export const openSingleQuote: InputRule = {
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

export const closeSingleQuote: InputRule = {
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

export const pairedSingleQuote: InputRule = {
  matchTrigger: "''",
  matchRegExp: /''$/,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openSingle + settings.closeSingle,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.closeSingle) {
      delta.update(delta.from, { ...delta.to, ch: delta.to.ch + 1 }, ["''"]);
      setTimeout(() =>
        instance.setCursor({ ...delta.from, ch: delta.from.ch + 1 })
      );
    }
  },
};

export const wrappedSingleQuote: InputRule = {
  matchTrigger: /^'.*'$/,
  matchRegExp: false,
  performUpdate: (instance, delta, settings) => {
    delta.update(delta.from, delta.to, [
      settings.openSingle + delta.text[0].slice(1, -1) + settings.closeSingle,
    ]);
  },
  performRevert: false,
};

export const rightArrow: InputRule = {
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

export const leftArrow: InputRule = {
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

export const greaterThanOrEqualTo: InputRule = {
  matchTrigger: "=",
  matchRegExp: />=$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.greaterThanOrEqualTo,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.greaterThanOrEqualTo) {
      delta.update(delta.from, delta.to, [">="]);
    }
  },
};

export const lessThanOrEqualTo: InputRule = {
  matchTrigger: "=",
  matchRegExp: /<=$/,
  performUpdate: (instance, delta, settings) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      settings.lessThanOrEqualTo,
    ]);
  },
  performRevert: (instance, delta, settings) => {
    if (instance.getRange(delta.from, delta.to) === settings.lessThanOrEqualTo) {
      delta.update(delta.from, delta.to, ["<="]);
    }
  },
};

export const notEqualTo: InputRule = {
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

export const rightGuillemet: InputRule = {
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

export const leftGuillemet: InputRule = {
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

export const dashRules = [enDash, emDash, trippleDash];
export const ellipsisRules = [ellipsis];
export const smartQuoteRules = [
  openDoubleQuote,
  closeDoubleQuote,
  pairedDoubleQuote,
  wrappedDoubleQuote,
  openSingleQuote,
  closeSingleQuote,
  pairedSingleQuote,
  wrappedSingleQuote,
];
export const comparisonRules = [
  lessThanOrEqualTo,
  greaterThanOrEqualTo,
  notEqualTo,
];
export const arrowRules = [leftArrow, rightArrow];
export const guillemetRules = [leftGuillemet, rightGuillemet];
