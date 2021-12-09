import {
  arrowRules,
  ellipsisRules,
  dashRules,
  InputRule,
  smartQuoteRules,
  guillemetRules,
  comparisonRules,
  fractionRules,
} from "inputRules";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { SmartTypographySettings } from "types";

const DEFAULT_SETTINGS: SmartTypographySettings = {
  curlyQuotes: true,
  emDash: true,
  ellipsis: true,
  arrows: true,
  guillemets: false,
  comparisons: true,

  openSingle: "‘",
  closeSingle: "’",

  openDouble: "“",
  closeDouble: "”",

  leftArrow: "←",
  rightArrow: "→",

  lessThanOrEqualTo: "≤",
  greaterThanOrEqualTo: "≥",
  notEqualTo: "≠",

  vulgarFractionOneQuarter: "¼",
  vulgarFractionHalf: "½",
  vulgarFractionThreeQuarters: "¾"
};

export default class SmartTypography extends Plugin {
  settings: SmartTypographySettings;
  inputRules: InputRule[];
  lastUpdate: WeakMap<CodeMirror.Editor, InputRule>;

  buildInputRules() {
    this.inputRules = [];

    if (this.settings.emDash) {
      this.inputRules.push(...dashRules);
    }

    if (this.settings.ellipsis) {
      this.inputRules.push(...ellipsisRules);
    }

    if (this.settings.curlyQuotes) {
      this.inputRules.push(...smartQuoteRules);
    }

    if (this.settings.arrows) {
      this.inputRules.push(...arrowRules);
    }

    if (this.settings.guillemets) {
      this.inputRules.push(...guillemetRules);
    }
    if (this.settings.comparisons) {
      this.inputRules.push(...comparisonRules);
    }
  }

  beforeChangeHandler = (
    instance: CodeMirror.Editor,
    delta: CodeMirror.EditorChangeCancellable
  ) => {
    if (this.lastUpdate.has(instance) && delta.origin === "+delete") {
      const revert = this.lastUpdate.get(instance).performRevert;

      if (revert) {
        revert(instance, delta, this.settings);
        this.lastUpdate.delete(instance);
      }
      return;
    }

    if (delta.origin === undefined && delta.text.length === 1) {
      const input = delta.text[0];

      for (let rule of this.inputRules) {
        if (!(rule.matchTrigger instanceof RegExp)) {
          continue;
        }

        if (rule.matchTrigger.test(input)) {
          rule.performUpdate(instance, delta, this.settings);
          return;
        }
      }

      return;
    }

    if (delta.origin === "+input" && delta.text.length === 1) {
      const input = delta.text[0];
      const rules = this.inputRules.filter((r) => {
        return typeof r.matchTrigger === "string" && r.matchTrigger === input;
      });

      if (rules.length === 0) {
        if (this.lastUpdate.has(instance)) {
          this.lastUpdate.delete(instance);
        }
        return;
      }

      let str = input;

      if (delta.to.ch > 0) {
        str = `${instance.getRange(
          { line: delta.to.line, ch: 0 },
          delta.to
        )}${str}`;
      }

      for (let rule of rules) {
        if (rule.matchRegExp && rule.matchRegExp.test(str)) {
          if (
            shouldCheckTextAtPos(instance, delta.from) &&
            shouldCheckTextAtPos(instance, delta.to)
          ) {
            this.lastUpdate.set(instance, rule);
            rule.performUpdate(instance, delta, this.settings);
          }
          return;
        }
      }
    }

    if (this.lastUpdate.has(instance)) {
      this.lastUpdate.delete(instance);
    }
  };

  async onload() {
    this.lastUpdate = new WeakMap();

    await this.loadSettings();

    this.addSettingTab(new SmartTypographySettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      this.registerCodeMirror((cm: CodeMirror.Editor) => {
        cm.on("beforeChange", this.beforeChangeHandler);
      });
    });
  }

  onunload() {
    this.lastUpdate = null;
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("beforeChange", this.beforeChangeHandler);
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
      .setName("Open double quote character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.openDouble)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }

            this.plugin.settings.openDouble = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Close double quote character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.closeDouble)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.closeDouble = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Open single quote character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.openSingle)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.openSingle = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Close single quote character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.closeSingle)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.closeSingle = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Dashes")
      .setDesc(
        "Two dashes (--) will be converted to an en-dash (–). And en-dash followed by a dash will be converted to and em-dash (—). An em-dash followed by a dash will be converted into three dashes (---)"
      )
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

    new Setting(containerEl)
      .setName("Guillemets")
      .setDesc("<< | >> will be converted to « | »")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.guillemets)
          .onChange(async (value) => {
            this.plugin.settings.guillemets = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Arrows")
      .setDesc("<- | -> will be converted to ← | →")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.arrows).onChange(async (value) => {
          this.plugin.settings.arrows = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl).setName("Left arrow character").addText((text) => {
      text.setValue(this.plugin.settings.leftArrow).onChange(async (value) => {
        if (!value) return;
        if (value.length > 1) {
          text.setValue(value[0]);
          return;
        }
        this.plugin.settings.leftArrow = value;
        await this.plugin.saveSettings();
      });
    });

    new Setting(containerEl)
      .setName("Right arrow character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.rightArrow)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.rightArrow = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Comparison")
      .setDesc("<= | >= | /= will be converted to ≤ | ≥ | ≠")
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.comparisons)
          .onChange(async (value) => {
            this.plugin.settings.comparisons = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Less than or equal to character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.lessThanOrEqualTo)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.lessThanOrEqualTo = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Greater than or equal to character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.greaterThanOrEqualTo)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.greaterThanOrEqualTo = value;
            await this.plugin.saveSettings();
          });
      });
    new Setting(containerEl)
      .setName("Not equal to character")
      .addText((text) => {
        text
          .setValue(this.plugin.settings.notEqualTo)
          .onChange(async (value) => {
            if (!value) return;
            if (value.length > 1) {
              text.setValue(value[0]);
              return;
            }
            this.plugin.settings.notEqualTo = value;
            await this.plugin.saveSettings();
          });
      });
  }
}

const ignoreListRegEx = /frontmatter|code|math|templater/;

function shouldCheckTextAtPos(
  instance: CodeMirror.Editor,
  pos: CodeMirror.Position
) {
  // Empty line
  if (!instance.getLine(pos.line)) {
    return true;
  }

  const tokens = instance.getTokenTypeAt(pos);

  // Plain text line
  if (!tokens) {
    return true;
  }

  // Not codeblock or frontmatter
  if (!ignoreListRegEx.test(tokens)) {
    return true;
  }

  return false;
}
