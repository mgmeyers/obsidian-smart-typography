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
  context: string;
}

export interface InputRule {
  trigger: string;
  shouldReplace: (context: string) => boolean;
  replace: (params: InputRuleParams) => void;
}

function getLastChar(context: string) {
  return context && context[context.length - 1];
}

// Dashes

export const enDash: InputRule = {
  trigger: dashChar,
  shouldReplace: (context: string) => {
    return getLastChar(context) === dashChar;
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === enDashChar;
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === emDashChar;
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
  shouldReplace: (context: string) => {
    return context && context.endsWith("..");
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
  shouldReplace: (context: string) => {
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
  shouldReplace: (context: string) => {
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
  shouldReplace: (context: string) => {
    return true;
  },
  replace: ({
    registerChange,
    settings,
    from,
    to,
    context,
  }: InputRuleParams) => {
    if (context.length === 0 || /[\s\{\[\(\<'"\u2018\u201C]$/.test(context)) {
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
  shouldReplace: (context: string) => {
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === "<";
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === dashChar;
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === "<";
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === ">";
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === ">";
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === "<";
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
  shouldReplace: (context: string) => {
    return getLastChar(context) === "/";
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

// Fractions

export const frac2: InputRule = {
  trigger: "2",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)1\/$/.test(context);
  },
  replace: ({ registerChange, adjustSelection, from, to }: InputRuleParams) => {
    registerChange(
      { from: from - 2, to: to, insert: "½" },
      {
        from: from - 2,
        to: to - 2,
        insert: "1/2",
      }
    );

    adjustSelection(-2);
  },
};

export const frac3: InputRule = {
  trigger: "3",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)[12]\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅓";
    let revert = "1/3";

    if (context.endsWith("2/")) {
      insert = "⅔";
      revert = "2/3";
    }

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac4: InputRule = {
  trigger: "4",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)[13]\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "¼";
    let revert = "1/4";

    if (context.endsWith("3/")) {
      insert = "¾";
      revert = "3/4";
    }

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac5: InputRule = {
  trigger: "5",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)[1234]\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅕";
    let revert = "1/5";

    if (context.endsWith("2/")) {
      insert = "⅖";
      revert = "2/5";
    } else if (context.endsWith("3/")) {
      insert = "⅗";
      revert = "3/5";
    } else if (context.endsWith("4/")) {
      insert = "⅘";
      revert = "4/5";
    }

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac6: InputRule = {
  trigger: "6",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)[15]\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅙";
    let revert = "1/6";

    if (context.endsWith("5/")) {
      insert = "⅚";
      revert = "5/6";
    }

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac7: InputRule = {
  trigger: "7",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)1\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅐";
    let revert = "1/7";

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac8: InputRule = {
  trigger: "8",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)[1357]\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅛";
    let revert = "1/8";

    if (context.endsWith("3/")) {
      insert = "⅜";
      revert = "3/8";
    } else if (context.endsWith("5/")) {
      insert = "⅝";
      revert = "5/8";
    } else if (context.endsWith("7/")) {
      insert = "⅞";
      revert = "7/8";
    }

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac9: InputRule = {
  trigger: "9",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)1\/$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅑";
    let revert = "1/9";

    registerChange(
      { from: from - 2, to: to, insert },
      {
        from: from - 2,
        to: to - 2,
        insert: revert,
      }
    );

    adjustSelection(-2);
  },
};

export const frac10: InputRule = {
  trigger: "0",
  shouldReplace: (context: string) => {
    return context && /(?:^|\s)1\/1$/.test(context);
  },
  replace: ({
    context,
    registerChange,
    adjustSelection,
    from,
    to,
  }: InputRuleParams) => {
    let insert = "⅒";
    let revert = "1/10";

    registerChange(
      { from: from - 3, to: to, insert },
      {
        from: from - 3,
        to: to - 3,
        insert: revert,
      }
    );

    adjustSelection(-3);
  },
};

export const fractionRules = [
  frac2,
  frac3,
  frac4,
  frac5,
  frac6,
  frac7,
  frac8,
  frac9,
  frac10,
];
