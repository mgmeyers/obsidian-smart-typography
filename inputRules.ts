import { SmartTypographySettings } from "types";
import { ChangeSpec, Transaction } from "@codemirror/state";

const dashChar = "-";
const enDashChar = "–";
const emDashChar = "—";

interface InputRuleParams {
  registerChange: (change: ChangeSpec, revert: ChangeSpec) => void;
  adjustSelection: (adjustment: number) => void;
  tr: Transaction;
  settings: SmartTypographySettings;
  from: number;
  to: number;
}

export interface InputRule {
  trigger: string;
  shouldReplace: (tr: Transaction, from: number, to: number) => boolean;
  replace: (params: InputRuleParams) => void;
}

// Dashes

export const enDash: InputRule = {
  trigger: dashChar,
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === dashChar;
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: enDashChar },
      {
        from: from - 1,
        to: to - 1,
        insert: dashChar + dashChar,
      }
    );

    adjustSelection(-1);
  },
};

export const emDash: InputRule = {
  trigger: dashChar,
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === enDashChar;
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: emDashChar },
      {
        from: from - 1,
        to: to - 1,
        insert: enDashChar + dashChar,
      }
    );

    adjustSelection(-1);
  },
};

export const trippleDash: InputRule = {
  trigger: dashChar,
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === emDashChar;
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: dashChar + dashChar + dashChar },
      {
        from: from - 1,
        to: to + 1,
        insert: emDashChar + dashChar,
      }
    );

    adjustSelection(1);
  },
};

export const dashRules = [enDash, emDash, trippleDash];

// Ellipsis

export const ellipsis: InputRule = {
  trigger: ".",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 2, to - 1);
    console.log(prev);
    return prev === "..";
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 2, to: to, insert: "…" },
      {
        from: from - 2,
        to: to - 2,
        insert: "...",
      }
    );

    adjustSelection(-2);
  },
};

export const ellipsisRules = [ellipsis];

// Quotes
export const doubleQuote: InputRule = {
  trigger: '"',
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    return true;
  },
  replace: ({ tr, registerChange, settings, from, to }: InputRuleParams) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);

    if (prev.length === 0 || /[\s\{\[\(\<'"\u2018\u201C]$/.test(prev)) {
      registerChange(
        {
          from: from,
          to: to,
          insert: settings.openDouble,
        },
        { from: from, to: to, insert: '"' }
      );
    } else {
      registerChange(
        {
          from: from,
          to: to,
          insert: settings.closeDouble,
        },
        { from: from, to: to, insert: '"' }
      );
    }
  },
};

export const pairedDoubleQuote: InputRule = {
  trigger: '""',
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    return true;
  },
  replace: ({ tr, registerChange, settings, from, to }: InputRuleParams) => {
    registerChange(
      {
        from: from,
        to: to,
        insert: settings.openDouble + settings.closeDouble,
      },
      { from: from, to: to, insert: '""' }
    );
  },
};

export const singleQuote: InputRule = {
  trigger: "'",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    return true;
  },
  replace: ({ tr, registerChange, settings, from, to }: InputRuleParams) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);

    if (prev.length === 0 || /[\s\{\[\(\<'"\u2018\u201C]$/.test(prev)) {
      registerChange(
        {
          from: from,
          to: to,
          insert: settings.openSingle,
        },
        { from: from, to: to, insert: "'" }
      );
    } else {
      registerChange(
        {
          from: from,
          to: to,
          insert: settings.closeSingle,
        },
        { from: from, to: to, insert: "'" }
      );
    }
  },
};

export const pairedSingleQuote: InputRule = {
  trigger: "''",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    return true;
  },
  replace: ({ tr, registerChange, settings, from, to }: InputRuleParams) => {
    registerChange(
      {
        from: from,
        to: to,
        insert: settings.openSingle + settings.closeSingle,
      },
      { from: from, to: to, insert: "''" }
    );
  },
};

export const smartQuoteRules = [
  doubleQuote,
  pairedDoubleQuote,
  singleQuote,
  pairedSingleQuote,
];

// Arrows

export const leftArrow: InputRule = {
  trigger: dashChar,
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === "<";
  },
  replace: ({
    settings,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: settings.leftArrow },
      {
        from: from - 1,
        to: to - 1,
        insert: "<" + dashChar,
      }
    );

    adjustSelection(-1);
  },
};

export const rightArrow: InputRule = {
  trigger: ">",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === dashChar;
  },
  replace: ({
    settings,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: settings.rightArrow },
      {
        from: from - 1,
        to: to - 1,
        insert: dashChar + ">",
      }
    );

    adjustSelection(-1);
  },
};

export const arrowRules = [leftArrow, rightArrow];

// Guillemet

export const leftGuillemet: InputRule = {
  trigger: "<",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === "<";
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: "«" },
      {
        from: from - 1,
        to: to - 1,
        insert: "<<",
      }
    );

    adjustSelection(-1);
  },
};

export const rightGuillemet: InputRule = {
  trigger: ">",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === ">";
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: "»" },
      {
        from: from - 1,
        to: to - 1,
        insert: ">>",
      }
    );

    adjustSelection(-1);
  },
};

export const guillemetRules = [leftGuillemet, rightGuillemet];

export const greaterThanOrEqualTo: InputRule = {
  trigger: "=",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === ">";
  },
  replace: ({
    settings,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: settings.greaterThanOrEqualTo },
      {
        from: from - 1,
        to: to - 1,
        insert: ">=",
      }
    );

    adjustSelection(-1);
  },
};

export const lessThanOrEqualTo: InputRule = {
  trigger: "=",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === "<";
  },
  replace: ({
    settings,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: settings.lessThanOrEqualTo },
      {
        from: from - 1,
        to: to - 1,
        insert: "<=",
      }
    );

    adjustSelection(-1);
  },
};

export const notEqualTo: InputRule = {
  trigger: "=",
  shouldReplace: (tr: Transaction, from: number, to: number) => {
    const prev = tr.newDoc.sliceString(from - 1, to - 1);
    return prev === "/";
  },
  replace: ({
    settings,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    registerChange(
      { from: from - 1, to: to, insert: settings.notEqualTo },
      {
        from: from - 1,
        to: to - 1,
        insert: "/=",
      }
    );

    adjustSelection(-1);
  },
};

export const comparisonRules = [
  lessThanOrEqualTo,
  greaterThanOrEqualTo,
  notEqualTo,
];
