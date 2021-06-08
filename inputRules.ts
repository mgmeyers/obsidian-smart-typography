export interface InputRule {
  matchTrigger: string;
  matchRegExp: RegExp;
  performUpdate: (
    instance: CodeMirror.Editor,
    delta: CodeMirror.EditorChangeCancellable
  ) => void;
  performRevert: (
    instance: CodeMirror.Editor,
    delta: CodeMirror.EditorChangeCancellable
  ) => void;
}

export const emDash: InputRule = {
  matchTrigger: "-",
  matchRegExp: /--$/,
  performUpdate: (instance, delta) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      "—",
    ]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "—") {
      delta.update(delta.from, delta.to, ["--"]);
    }
  },
};

export const ellipsis: InputRule = {
  matchTrigger: ".",
  matchRegExp: /\.\.\.$/,
  performUpdate: (instance, delta) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 2 }, delta.to, [
      "…",
    ]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "…") {
      delta.update(delta.from, delta.to, ["..."]);
    }
  },
};

export const openDoubleQuote: InputRule = {
  matchTrigger: '"',
  matchRegExp: /(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/,
  performUpdate: (instance, delta) => {
    delta.update(delta.from, delta.to, ["“"]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "“") {
      delta.update(delta.from, delta.to, ['"']);
    }
  },
};

export const closeDoubleQuote: InputRule = {
  matchTrigger: '"',
  matchRegExp: /"$/,
  performUpdate: (instance, delta) => {
    delta.update(delta.from, delta.to, ["”"]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "”") {
      delta.update(delta.from, delta.to, ['"']);
    }
  },
};

export const pairedDoubleQuote: InputRule = {
  matchTrigger: '""',
  matchRegExp: /""$/,
  performUpdate: (instance, delta) => {
    delta.update(delta.from, delta.to, ["“”"]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "“") {
      delta.update(delta.from, { ...delta.to, ch: delta.to.ch + 1 }, ['""']);
      setTimeout(() =>
        instance.setCursor({ ...delta.from, ch: delta.from.ch + 1 })
      );
    }
  },
};

export const openSingleQuote: InputRule = {
  matchTrigger: "'",
  matchRegExp: /(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/,
  performUpdate: (instance, delta) => {
    delta.update(delta.from, delta.to, ["‘"]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "‘") {
      delta.update(delta.from, delta.to, ["'"]);
    }
  },
};

export const closeSingleQuote: InputRule = {
  matchTrigger: "'",
  matchRegExp: /'$/,
  performUpdate: (instance, delta) => {
    delta.update(delta.from, delta.to, ["’"]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "’") {
      delta.update(delta.from, delta.to, ["'"]);
    }
  },
};

export const pairedSingleQuote: InputRule = {
  matchTrigger: "''",
  matchRegExp: /''$/,
  performUpdate: (instance, delta) => {
    delta.update(delta.from, delta.to, ["‘’"]);
  },
  performRevert: (instance, delta) => {
    if (instance.getRange(delta.from, delta.to) === "‘") {
      delta.update(delta.from, { ...delta.to, ch: delta.to.ch + 1 }, ["''"]);
      setTimeout(() =>
        instance.setCursor({ ...delta.from, ch: delta.from.ch + 1 })
      );
    }
  },
};

export const emDashRules = [emDash];
export const ellipsisRules = [ellipsis];
export const smartQuoteRules = [
  openDoubleQuote,
  closeDoubleQuote,
  pairedDoubleQuote,
  openSingleQuote,
  closeSingleQuote,
  pairedSingleQuote,
];
