import { SmartTypographySettings } from "types";

export interface InputRule {
  trigger: string;
  contextMatch: RegExp;
  from: string;
  to: string | ((settings: SmartTypographySettings) => string);
}

// Dashes
export const dashRules: InputRule[] = [
  // en dash
  {
    trigger: "-",
    from: "--",
    to: "–",
    contextMatch: /-$/,
  },
  // em dash
  {
    trigger: "-",
    from: "–-",
    to: "—",
    contextMatch: /–$/,
  },
  // tripple dash
  {
    trigger: "-",
    from: "—-",
    to: "---",
    contextMatch: /—$/,
  },
];

export const dashRulesSansEnDash: InputRule[] = [
  // em dash
  {
    trigger: "-",
    from: "--",
    to: "—",
    contextMatch: /-$/,
  },
  // tripple dash
  {
    trigger: "-",
    from: "—-",
    to: "---",
    contextMatch: /—$/,
  },
];

// Ellipsis
export const ellipsisRules: InputRule[] = [
  {
    trigger: ".",
    from: "...",
    to: "…",
    contextMatch: /\.\.$/,
  },
];

// Quotes
export const smartQuoteRules: InputRule[] = [
  // Open double
  {
    trigger: '"',
    from: '"',
    to: (settings) => settings.openDouble,
    contextMatch: /[\s\{\[\(\<'"\u2018\u201C]$/,
  },
  // Close double
  {
    trigger: '"',
    from: '"',
    to: (settings) => settings.closeDouble,
    contextMatch: /.*$/,
  },
  // Paired double
  {
    trigger: '""',
    from: '""',
    to: (settings) => settings.openDouble + settings.closeDouble,
    contextMatch: /.*$/,
  },
  // Open single
  {
    trigger: "'",
    from: "'",
    to: (settings) => settings.openSingle,
    contextMatch: /[\s\{\[\(\<'"\u2018\u201C]$/,
  },
  // Close single
  {
    trigger: "'",
    from: "'",
    to: (settings) => settings.closeSingle,
    contextMatch: /.*$/,
  },
  // Paired single
  {
    trigger: "''",
    from: "''",
    to: (settings) => settings.openSingle + settings.closeSingle,
    contextMatch: /.*$/,
  },
];

// Arrows
export const arrowRules: InputRule[] = [
  {
    trigger: "-",
    from: "<-",
    to: (settings) => settings.leftArrow,
    contextMatch: /<$/,
  },
  {
    trigger: ">",
    from: "->",
    to: (settings) => settings.rightArrow,
    contextMatch: /-$/,
  },
];

// Guillemet
export const guillemetRules: InputRule[] = [
  {
    trigger: "<",
    from: "<<",
    to: (settings) => settings.openGuillemet,
    contextMatch: /<$/,
  },
  {
    trigger: ">",
    from: ">>",
    to: (settings) => settings.closeGuillemet,
    contextMatch: />$/,
  },
];

// Comparisons
export const comparisonRules: InputRule[] = [
  {
    trigger: "=",
    from: ">=",
    to: "≥",
    contextMatch: />$/,
  },
  {
    trigger: "=",
    from: "<=",
    to: "≤",
    contextMatch: /<$/,
  },
  {
    trigger: "=",
    from: "/=",
    to: "≠",
    contextMatch: /\/$/,
  },
];

// Fractions
export const fractionRules: InputRule[] = [
  {
    trigger: "2",
    from: "1/2",
    to: "½",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "3",
    from: "1/3",
    to: "⅓",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "3",
    from: "2/3",
    to: "⅔",
    contextMatch: /(?:^|\s)2\/$/,
  },
  {
    trigger: "4",
    from: "1/4",
    to: "¼",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "4",
    from: "3/4",
    to: "¾",
    contextMatch: /(?:^|\s)3\/$/,
  },
  {
    trigger: "5",
    from: "1/5",
    to: "⅕",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "5",
    from: "2/5",
    to: "⅖",
    contextMatch: /(?:^|\s)2\/$/,
  },
  {
    trigger: "5",
    from: "3/5",
    to: "⅗",
    contextMatch: /(?:^|\s)3\/$/,
  },
  {
    trigger: "5",
    from: "4/5",
    to: "⅘",
    contextMatch: /(?:^|\s)4\/$/,
  },
  {
    trigger: "6",
    from: "1/6",
    to: "⅙",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "6",
    from: "5/6",
    to: "⅚",
    contextMatch: /(?:^|\s)5\/$/,
  },
  {
    trigger: "7",
    from: "1/7",
    to: "⅐",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "8",
    from: "1/8",
    to: "⅛",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "8",
    from: "3/8",
    to: "⅜",
    contextMatch: /(?:^|\s)3\/$/,
  },
  {
    trigger: "8",
    from: "5/8",
    to: "⅝",
    contextMatch: /(?:^|\s)5\/$/,
  },
  {
    trigger: "8",
    from: "7/8",
    to: "⅞",
    contextMatch: /(?:^|\s)7\/$/,
  },
  {
    trigger: "9",
    from: "1/9",
    to: "⅑",
    contextMatch: /(?:^|\s)1\/$/,
  },
  {
    trigger: "0",
    from: "1/10",
    to: "⅒",
    contextMatch: /(?:^|\s)1\/1$/,
  },
];
