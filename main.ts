import { ellipsisRules, emDashRules, InputRule, smartQuoteRules } from "inputRules";
import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from "obsidian";

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

type ChangeHandler = (
  instance: CodeMirror.Editor,
  delta: CodeMirror.EditorChangeCancellable
) => void;

export default class SmartTypography extends Plugin {
  settings: SmartTypographySettings;
  inputRules: InputRule[] = [];

  didJustUpdate: { [id: string]: InputRule | undefined } = {};
  changeHandlers: { [id: string]: ChangeHandler } = {};

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

  getCodeMirrorID(cm: CodeMirror.Editor, cb: (id: string | null) => void) {
    // Wait for the layout to settle
    setTimeout(() => {
      const gutter = cm.getGutterElement();
      const markdownLeaves = this.app.workspace.getLeavesOfType("markdown");
      const containingLeaf = markdownLeaves.find((l) =>
        l.view.containerEl.contains(gutter)
      );

      if (containingLeaf) {
        return cb((containingLeaf as any).id);
      }

      cb(null);
    });
  }

  handleLayoutChange = () => {
    const leafIds: { [id: string]: boolean } = {};
    const didJustUpdate: { [id: string]: InputRule | undefined } = {};
    const changeHandlers: { [id: string]: ChangeHandler } = {};

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        const id = (leaf as any).id;
        leafIds[id] = true;
      }
    });

    Object.keys(this.didJustUpdate).forEach((k) => {
      if (leafIds[k]) {
        didJustUpdate[k] = this.didJustUpdate[k];
        changeHandlers[k] = this.changeHandlers[k];
      }
    });

    this.didJustUpdate = didJustUpdate;
    this.changeHandlers = changeHandlers;
  };

  getBeforeChangeHandler(id: string) {
    return (
      instance: CodeMirror.Editor,
      delta: CodeMirror.EditorChangeCancellable
    ) => {
      if (this.didJustUpdate[id] && delta.origin === "+delete") {
        this.didJustUpdate[id].performRevert(instance, delta);
        this.didJustUpdate[id] = undefined;
        return;
      }

      if (delta.origin === "+input" && delta.text.length === 1) {
        const input = delta.text[0];
        const rules = this.inputRules.filter((r) => r.matchTrigger === input);

        if (rules.length === 0) {
          this.didJustUpdate[id] = undefined;
          return;
        };

        let str = input;

        if (delta.to.ch > 0) {
          str = `${instance.getRange(
            { line: delta.to.line, ch: 0 },
            delta.to
          )}${str}`;
        }

        for (let rule of rules) {
          if (rule.matchRegExp.test(str)) {
            this.didJustUpdate[id] = rule;
            rule.performUpdate(instance, delta);
            return;
          }
        }
      }

      if (this.didJustUpdate[id]) {
        this.didJustUpdate[id] = undefined;
      }
    };
  }

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new SmartTypographySettingTab(this.app, this));

    this.app.workspace.on("layout-change", this.handleLayoutChange);
    this.app.workspace.onLayoutReady(() => {
      this.registerCodeMirror((cm: CodeMirror.Editor) => {
        this.getCodeMirrorID(cm, (id) => {
          if (!id) return;

          const handleBeforeChange = this.getBeforeChangeHandler(id);
          this.changeHandlers[id] = handleBeforeChange;
          cm.on("beforeChange", handleBeforeChange);
        });
      });
    });
  }

  onunload() {
    this.app.workspace.off("layout-change", this.handleLayoutChange);
    this.app.workspace.iterateCodeMirrors((cm) => {
      this.getCodeMirrorID(cm, (id) => {
        if (!id) return;
        cm.off("beforeChange", this.changeHandlers[id]);
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
