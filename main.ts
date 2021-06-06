import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface SmartTypographySettings {
  curlyQuotes: boolean;
  emDash: boolean;
  ellipsis: boolean;
}

const DEFAULT_SETTINGS: SmartTypographySettings = {
  curlyQuotes: true,
  emDash: true,
  ellipsis: true,
};

type InputRule = [
  string,
  RegExp,
  (delta: CodeMirror.EditorChangeCancellable) => void
];

const emDash: InputRule = [
  "-",
  /--$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 1 }, delta.to, [
      "—",
    ]);
  },
];

const ellipsis: InputRule = [
  ".",
  /\.\.\.$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update({ line: delta.from.line, ch: delta.from.ch - 2 }, delta.to, [
      "…",
    ]);
  },
];

const openDoubleQuote: InputRule = [
  '"',
  /(?:^|[\s\{\[\(\<'"\u2018\u201C])(")$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update(delta.from, delta.to, ["“"]);
  },
];

const closeDoubleQuote: InputRule = [
  '"',
  /"$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update(delta.from, delta.to, ["”"]);
  },
];

const pairedDoubleQuote: InputRule = [
  '""',
  /""$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update(delta.from, delta.to, ["“”"]);
  },
];

const openSingleQuote: InputRule = [
  "'",
  /(?:^|[\s\{\[\(\<'"\u2018\u201C])(')$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update(delta.from, delta.to, ["‘"]);
  },
];

const closeSingleQuote: InputRule = [
  "'",
  /'$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update(delta.from, delta.to, ["’"]);
  },
];

const pairedSingleQuote: InputRule = [
  "''",
  /''$/,
  (delta: CodeMirror.EditorChangeCancellable) => {
    delta.update(delta.from, delta.to, ["‘’"]);
  },
];

const emDashRules = [emDash];
const ellipsisRules = [ellipsis];
const smartQuoteRules = [
  openDoubleQuote,
  closeDoubleQuote,
  pairedDoubleQuote,
  openSingleQuote,
  closeSingleQuote,
  pairedSingleQuote,
];

export default class SmartTypography extends Plugin {
  settings: SmartTypographySettings;
  inputRules: InputRule[] = [];

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new SmartTypographySettingTab(this.app, this));

    this.registerCodeMirror((cm) => {
      cm.on("beforeChange", (instance, delta) => {
        if (delta.origin === "+input" && delta.text.length === 1) {
          const input = delta.text[0];
          const rules = this.inputRules.filter((r) => r[0] === input);

          if (rules.length === 0) return;

          let str = input;

          if (delta.to.ch > 0) {
            str = `${instance.getRange(
              { line: delta.to.line, ch: 0 },
              delta.to
            )}${str}`;
          }

          for (let rule of rules) {
            if ((rule[1] as RegExp).test(str)) {
              rule[2](delta);
              break;
            }
          }
        }
      });
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.buildInputRules();
  }

  async saveSettings() {
    this.buildInputRules();
    await this.saveData(this.settings);
  }

  buildInputRules() {
    this.inputRules = [];

    if (this.settings.emDash) {
      this.inputRules.push(...emDashRules);
    }

    if (this.settings.ellipsis) {
      this.inputRules.push(...ellipsisRules);
    }

    if (this.settings.curlyQuotes) {
      this.inputRules.push(...smartQuoteRules);
    }
  }
}

class SmartTypographySettingTab extends PluginSettingTab {
  plugin: SmartTypography;

  constructor(app: App, plugin: SmartTypography) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Curly Quotes")
      .setDesc(
        "Double and single quotes will be converted to curly quotes (“” & ‘’)"
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.curlyQuotes)
          .onChange(async (value) => {
            this.plugin.settings.curlyQuotes = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Em Dash")
      .setDesc("Two dashes (--) will be converted to an em dash (—)")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.emDash).onChange(async (value) => {
          this.plugin.settings.emDash = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Ellipsis")
      .setDesc("Three periods (...) will be converted to an ellipses (…)")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.ellipsis)
          .onChange(async (value) => {
            this.plugin.settings.ellipsis = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
