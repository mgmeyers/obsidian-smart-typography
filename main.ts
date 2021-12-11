import {
  legacyArrowRules,
  legacyEllipsisRules,
  legacyDashRules,
  LegacyInputRule,
  legacySmartQuoteRules,
  legacyGuillemetRules,
  legacyComparisonRules,
} from "legacyInputRules";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import {
  ChangeSet,
  ChangeSpec,
  EditorSelection,
  EditorState,
  StateEffect,
  StateField,
  TransactionSpec,
} from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { tokenClassNodeProp } from "@codemirror/stream-parser";
import { SmartTypographySettings } from "types";
import { Tree } from "@lezer/common";
import {
  arrowRules,
  comparisonRules,
  dashRules,
  ellipsisRules,
  fractionRules,
  guillemetRules,
  InputRule,
  smartQuoteRules,
} from "inputRules";

const DEFAULT_SETTINGS: SmartTypographySettings = {
  curlyQuotes: true,
  emDash: true,
  ellipsis: true,
  arrows: true,
  comparisons: true,
  fractions: false,
  guillemets: false,

  openSingle: "‘",
  closeSingle: "’",

  openDouble: "“",
  closeDouble: "”",

  leftArrow: "←",
  rightArrow: "→",

  lessThanOrEqualTo: "≤",
  greaterThanOrEqualTo: "≥",
  notEqualTo: "≠",
};

export default class SmartTypography extends Plugin {
  settings: SmartTypographySettings;
  inputRules: InputRule[];

  legacyInputRules: LegacyInputRule[];
  legacyLastUpdate: WeakMap<CodeMirror.Editor, LegacyInputRule>;

  buildInputRules() {
    this.legacyInputRules = [];
    this.inputRules = [];

    if (this.settings.emDash) {
      this.inputRules.push(...dashRules);
      this.legacyInputRules.push(...legacyDashRules);
    }

    if (this.settings.ellipsis) {
      this.inputRules.push(...ellipsisRules);
      this.legacyInputRules.push(...legacyEllipsisRules);
    }

    if (this.settings.curlyQuotes) {
      this.inputRules.push(...smartQuoteRules);
      this.legacyInputRules.push(...legacySmartQuoteRules);
    }

    if (this.settings.arrows) {
      this.inputRules.push(...arrowRules);
      this.legacyInputRules.push(...legacyArrowRules);
    }

    if (this.settings.guillemets) {
      this.inputRules.push(...guillemetRules);
      this.legacyInputRules.push(...legacyGuillemetRules);
    }

    if (this.settings.comparisons) {
      this.inputRules.push(...comparisonRules);
      this.legacyInputRules.push(...legacyComparisonRules);
    }

    if (this.settings.fractions) {
      this.inputRules.push(...fractionRules);
    }
  }

  async onload() {
    this.legacyLastUpdate = new WeakMap();

    await this.loadSettings();

    this.addSettingTab(new SmartTypographySettingTab(this.app, this));

    // Codemirror 6
    //
    // When smart typography overrides changes, we want to keep a record
    // so we can undo them when the user presses backspace
    const storeTransaction = StateEffect.define<TransactionSpec>();
    const prevTransactionState = StateField.define<TransactionSpec | null>({
      create() {
        return null;
      },
      update(_, tr) {
        for (let e of tr.effects) {
          if (e.is(storeTransaction)) return e.value;
        }

        return null;
      },
    });

    this.registerEditorExtension([
      prevTransactionState,
      EditorState.transactionFilter.of((tr) => {
        // Revert any stored changes on delete
        if (
          tr.isUserEvent("delete.backward") ||
          tr.isUserEvent("delete.selection")
        ) {
          return tr.startState.field(prevTransactionState, false) || tr;
        }

        // If the user hasn't typed, or the doc hasn't changed, return early
        if (!tr.isUserEvent("input.type") || !tr.docChanged) {
          return tr;
        }

        // Store a list of changes and specs to revert these changes
        const changes: ChangeSpec[] = [];
        const reverts: ChangeSpec[] = [];

        // Cache the syntax tree if we end up having to access it
        let tree: Tree = null;
        const getTree = () => {
          if (!tree) tree = syntaxTree(tr.state);
          return tree;
        };

        // Memoize any positions we check so we can avoid some work
        const seenPositions: Record<number, boolean> = {};
        const canPerformReplacement = (pos: number) => {
          if (seenPositions[pos] !== undefined) {
            return seenPositions[pos];
          }

          const nodeProps = getTree()
            .resolveInner(pos, 1)
            .type.prop(tokenClassNodeProp);

          if (nodeProps && ignoreListRegEx.test(nodeProps)) {
            seenPositions[pos] = false;
          } else {
            seenPositions[pos] = true;
          }

          return seenPositions[pos];
        };

        let selection = tr.selection;
        const adjustSelection = (adjustment: number) => {
          const ranges = selection.ranges.map((r) =>
            EditorSelection.range(r.anchor + adjustment, r.head + adjustment)
          );
          selection = EditorSelection.create(ranges);
        };

        const registerChange = (change: ChangeSpec, revert: ChangeSpec) => {
          changes.push(change);
          reverts.push(revert);
        };

        const contextCache: Record<number, string> = {};
        tr.changes.iterChanges((_a, _b, from, to, inserted) => {
          const insertedText = inserted.sliceString(0, 0 + inserted.length);

          for (let rule of this.inputRules) {
            // This character is not a trigger, so continue testing rules
            if (insertedText !== rule.trigger) continue;

            // If we're in a codeblock, etc, return early, no need to continue checking
            if (!canPerformReplacement(from)) return;

            // Grab and cache three chars before the one being inserted
            if (contextCache[to] === undefined) {
              contextCache[to] = tr.newDoc.sliceString(from - 3, to - 1);
            }

            // Final check: given the context, see if we should perform a replacement
            if (rule.shouldReplace(contextCache[to])) {
              return rule.replace({
                adjustSelection,
                context: contextCache[to],
                from,
                registerChange,
                settings: this.settings,
                to,
                tr,
              });
            }
          }
        }, false);

        // If we have any changes, construct a transaction spec
        if (changes.length) {
          return [
            {
              effects: storeTransaction.of({
                selection: tr.selection,
                scrollIntoView: tr.scrollIntoView,
                changes: reverts,
              }),
              selection: selection,
              scrollIntoView: tr.scrollIntoView,
              changes: tr.changes.compose(
                ChangeSet.of(changes, tr.newDoc.length)
              ),
            },
          ];
        }

        return tr;
      }),
    ]);

    // Codemirror 5
    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      cm.on("beforeChange", this.beforeChangeHandler);
    });
  }

  onunload() {
    this.legacyLastUpdate = null;
    this.app.workspace.iterateCodeMirrors((cm) => {
      cm.off("beforeChange", this.beforeChangeHandler);
    });
  }

  beforeChangeHandler = (
    instance: CodeMirror.Editor,
    delta: CodeMirror.EditorChangeCancellable
  ) => {
    if (this.legacyLastUpdate.has(instance) && delta.origin === "+delete") {
      const revert = this.legacyLastUpdate.get(instance).performRevert;

      if (revert) {
        revert(instance, delta, this.settings);
        this.legacyLastUpdate.delete(instance);
      }
      return;
    }

    if (delta.origin === undefined && delta.text.length === 1) {
      const input = delta.text[0];

      for (let rule of this.legacyInputRules) {
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
      const rules = this.legacyInputRules.filter((r) => {
        return typeof r.matchTrigger === "string" && r.matchTrigger === input;
      });

      if (rules.length === 0) {
        if (this.legacyLastUpdate.has(instance)) {
          this.legacyLastUpdate.delete(instance);
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
            this.legacyLastUpdate.set(instance, rule);
            rule.performUpdate(instance, delta, this.settings);
          }
          return;
        }
      }
    }

    if (this.legacyLastUpdate.has(instance)) {
      this.legacyLastUpdate.delete(instance);
    }
  };

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
