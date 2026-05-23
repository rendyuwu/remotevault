import { For, createSignal } from "solid-js";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Toggle } from "../components/Toggle";
import { TopbarTitle } from "../components/Topbar";
import { getThemeMode, setThemeMode, type ThemeMode } from "../lib/theme";

const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
  { mode: "light", label: "Light" },
  { mode: "dark", label: "Dark" },
  { mode: "system", label: "System" },
];

const FONTS = ["JetBrains Mono", "Fira Code", "Source Code Pro", "Cascadia Code", "Menlo", "Monaco"];

export function SettingsPage() {
  const [theme, setTheme] = createSignal<ThemeMode>(getThemeMode());
  const [exportOpen, setExportOpen] = createSignal(false);
  const [importOpen, setImportOpen] = createSignal(false);
  const [copySelect, setCopySelect] = createSignal(true);
  const [rightPaste, setRightPaste] = createSignal(false);
  const [confirmClose, setConfirmClose] = createSignal(true);

  const chooseTheme = (mode: ThemeMode) => {
    setTheme(mode);
    setThemeMode(mode);
  };

  return (
    <>
      <TopbarTitle title="Settings" />

      <div class="settings-grid rise rise-1">
        <div>
          <section class="settings-section" id="appearance">
            <h2 class="settings-section-title">Appearance</h2>
            <span class="label mb-3">App theme</span>
            <div class="theme-cards" role="radiogroup" aria-label="App theme">
              <For each={THEME_OPTIONS}>
                {(option) => (
                  <button type="button" role="radio" aria-checked={theme() === option.mode} class={`theme-card ${option.mode}${theme() === option.mode ? " active" : ""}`} onClick={() => chooseTheme(option.mode)}>
                    <span class="theme-card-preview" />
                    <span class="theme-card-label">{option.label}</span>
                  </button>
                )}
              </For>
            </div>
          </section>

          <section class="settings-section" id="terminal">
            <h2 class="settings-section-title">Terminal</h2>
            <div class="settings-field-row">
              <FormField label="Font family">{(field) => <select id={field.id} class="select"><For each={FONTS}>{(font) => <option selected={font === "JetBrains Mono"}>{font}</option>}</For></select>}</FormField>
              <FormField label="Font size">{(field) => <select id={field.id} class="select"><option>11px</option><option>12px</option><option selected>13px</option><option>14px</option><option>15px</option><option>16px</option></select>}</FormField>
            </div>
            <div class="settings-field-row">
              <FormField label="Scrollback lines">{(field) => <select id={field.id} class="select"><option>1,000</option><option>5,000</option><option selected>10,000</option><option>50,000</option><option>Unlimited</option></select>}</FormField>
              <FormField label="Cursor style">{(field) => <select id={field.id} class="select"><option selected>Block</option><option>Underline</option><option>Bar</option></select>}</FormField>
            </div>
            <FormField label="Terminal theme" hint="Defines foreground, background, cursor, selection, and ANSI color palette for terminal.">{(field) => <select id={field.id} class="select"><option selected>Default Dark</option><option>Default Light</option><option>Tokyo Night</option><option>Tokyo Day</option><option>Night Owl</option><option>Light Owl</option></select>}</FormField>
          </section>

          <section class="settings-section" id="behavior">
            <h2 class="settings-section-title">Behavior</h2>
            <div class="setting-list">
              <div class="setting-row"><div><div class="setting-title">Copy on select</div><div class="hint">Automatically copy selected text to clipboard.</div></div><Toggle on={copySelect()} onChange={setCopySelect} /></div>
              <div class="setting-row"><div><div class="setting-title">Paste on right-click</div><div class="hint">Right-click in terminal pastes from clipboard.</div></div><Toggle on={rightPaste()} onChange={setRightPaste} /></div>
              <div class="setting-row"><div><div class="setting-title">Confirm before closing active session</div></div><Toggle on={confirmClose()} onChange={setConfirmClose} /></div>
            </div>
          </section>

          <section class="settings-section" id="vault">
            <h2 class="settings-section-title">Vault</h2>
            <FormField label="Auto-lock timeout" hint="Vault locks automatically after this period of inactivity.">{(field) => <select id={field.id} class="select"><option>Never</option><option>1 minute</option><option>5 minutes</option><option selected>15 minutes</option><option>30 minutes</option><option>1 hour</option><option>On app minimize</option></select>}</FormField>
          </section>

          <section class="settings-section" id="backup">
            <h2 class="settings-section-title">Backup</h2>
            <Card><p class="card-copy">Export an encrypted backup of your workspace or restore from a previous backup.</p><div class="row gap-3 mt-4"><Btn variant="secondary" onClick={() => setExportOpen(true)}>Export backup</Btn><Btn variant="ghost" onClick={() => setImportOpen(true)}>Import backup</Btn></div></Card>
          </section>

          <section class="settings-section" id="about">
            <h2 class="settings-section-title">About</h2>
            <div class="about-info"><div><span>Version</span><strong>0.1.0-alpha</strong></div><div><span>Platform</span><strong>Tauri 2.x + Rust</strong></div><div><span>License</span><strong>MIT</strong></div><div><span>Source</span><strong>github.com/rendyuwu/remotevault</strong></div></div>
          </section>
        </div>
      </div>

      <BackupModal open={exportOpen()} title="Export Backup" action="Create backup" onClose={() => setExportOpen(false)} />
      <BackupModal open={importOpen()} title="Import Backup" action="Restore" onClose={() => setImportOpen(false)} importMode />
    </>
  );
}

function BackupModal(props: { open: boolean; title: string; action: string; importMode?: boolean; onClose: () => void }) {
  return (
    <Modal open={props.open} onClose={props.onClose} label={props.title}>
      <div class="modal-stack">
        <header><h2>{props.title}</h2><p>{props.importMode ? "Restore connections and Vault items from a previously exported .rvbackup file." : "Create an encrypted .rvbackup file containing all connections, Vault items, and workspace settings."}</p></header>
        {!props.importMode && <div class="backup-details"><span>7 connections</span><span>4 Vault items</span><span>XChaCha20-Poly1305 encryption</span></div>}
        {props.importMode && <div class="file-drop"><Icon name="i-cloud" /><div>Drop .rvbackup file here or click to browse</div></div>}
        <FormField label={props.importMode ? "Backup passphrase" : "Confirm Vault passphrase"} hint={props.importMode ? "This is the Vault passphrase that was active at export time." : undefined}>{(field) => <input id={field.id} class="input" type="password" placeholder={props.importMode ? "Passphrase used when backup was created" : "Enter passphrase to encrypt backup"} />}</FormField>
        <footer class="modal-actions"><Btn variant="ghost" onClick={props.onClose}>Cancel</Btn><Btn variant={props.importMode ? "secondary" : "primary"} onClick={props.onClose}>{props.action}</Btn></footer>
      </div>
    </Modal>
  );
}
