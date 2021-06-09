import {
  arrowRules,
  ellipsisRules,
  emDashRules,
  InputRule,
  smartQuoteRules,
} from "inputRules";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface SmartTypographySettings {
  curlyQuotes: boolean;
  emDash: boolean;
  ellipsis: boolean;
  arrows: boolean;
}

const DEFAULT_SETTINGS: SmartTypographySettings = {
  curlyQuotes: true,
  emDash: true,
  ellipsis: true,
  arrows: true,
};

export default class SmartTypography extends Plugin {
  settings: SmartTypographySettings;
  inputRules: InputRule[];
  lastUpdate: WeakMap<CodeMirror.Editor, InputRule>;

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

    if (this.settings.arrows) {
      this.inputRules.push(...arrowRules);
    }
  }

  beforeChangeHandler = (
    instance: CodeMirror.Editor,
    delta: CodeMirror.EditorChangeCancellable
  ) => {
    if (this.lastUpdate.has(instance) && delta.origin === "+delete") {
      this.lastUpdate.get(instance).performRevert(instance, delta);
      this.lastUpdate.delete(instance);
      return;
    }

    if (delta.origin === "+input" && delta.text.length === 1) {
      const input = delta.text[0];
      const rules = this.inputRules.filter((r) => r.matchTrigger === input);

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
        if (rule.matchRegExp.test(str)) {
          this.lastUpdate.set(instance, rule);
          rule.performUpdate(instance, delta);
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

    new Setting(containerEl)
      .setName("Arrows")
      .setDesc("<- / -> will be converted to ← / →")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.arrows).onChange(async (value) => {
          this.plugin.settings.arrows = value;
          await this.plugin.saveSettings();
        });
      });
  }
}
