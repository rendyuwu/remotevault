import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { FormField } from "../components/FormField";
import { TopbarBreadcrumb } from "../components/Topbar";
import { VaultPicker } from "../components/VaultPicker";

type Protocol = "ssh" | "rdp";
type AuthMode = "private-key" | "password" | "agent";

const protocols: Array<{ id: Protocol; label: string }> = [
  { id: "ssh", label: "SSH" },
  { id: "rdp", label: "RDP" },
];

const authModes: Array<{ id: AuthMode; label: string }> = [
  { id: "private-key", label: "Private Key" },
  { id: "password", label: "Password" },
  { id: "agent", label: "SSH Agent" },
];

const sshVaultItems = [
  { id: "prod-ssh-key", name: "Production SSH Key (ed25519)", icon: "i-shield", type: "private_key" },
  { id: "staging-ssh-key", name: "Staging SSH Key (rsa)", icon: "i-shield", type: "private_key" },
  { id: "ssh-passphrase", name: "SSH Key Passphrase", icon: "i-lock", type: "passphrase" },
];

const rdpVaultItems = [
  { id: "windows-admin-password", name: "Windows Admin Password", icon: "i-key", type: "password" },
];

export function ConnectionEditPage() {
  const [protocol, setProtocol] = createSignal<Protocol>("ssh");
  const [authMode, setAuthMode] = createSignal<AuthMode>("private-key");
  const [sshVaultId, setSshVaultId] = createSignal("prod-ssh-key");
  const [rdpVaultId, setRdpVaultId] = createSignal("windows-admin-password");
  const [syncEnabled, setSyncEnabled] = createSignal(true);
  const [fullscreen, setFullscreen] = createSignal(false);
  const [clipboard, setClipboard] = createSignal(true);
  const [audio, setAudio] = createSignal(false);
  const [privateKey, setPrivateKey] = createSignal("~/.ssh/remotevault_prod_ed25519");
  const [notes, setNotes] = createSignal("Main API server. Runs behind Cloudflare tunnel. Restart with systemctl restart api.");

  return (
    <>
      <TopbarBreadcrumb parent={{ label: "Connections", href: "/connections" }} current="Edit Connection" />

      <section class="vault-editor-panel rise rise-1">
        <header class="mb-6">
          <p class="eyebrow">Connection Profile</p>
          <h1 class="page-title">Production API Server</h1>
          <p class="page-subtitle">Edit protocol, credentials, and sync metadata for this saved connection.</p>
        </header>

        <div class="form-grid rise rise-3">
          <div class="field">
            <span class="label" id="protocol-label">Protocol</span>
            <div class="preset-row" role="radiogroup" aria-labelledby="protocol-label">
              <For each={protocols}>
                {(item) => (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={protocol() === item.id}
                    class={`preset${protocol() === item.id ? " active" : ""}`}
                    onClick={() => setProtocol(item.id)}
                  >
                    {item.label}
                  </button>
                )}
              </For>
            </div>
          </div>

          <section class="config-section" aria-labelledby="basic-fields-title">
            <h3 id="basic-fields-title">Basic details</h3>
            <div class="form-grid">
              <FormField label="Name" id="connection-name" required>
                {(field) => <input class="input" id={field.id} type="text" value="Production API Server" />}
              </FormField>

              <div class="field-row">
                <FormField label="Host" id="connection-host" required>
                  {(field) => <input class="input mono" id={field.id} type="text" value="10.0.0.10" />}
                </FormField>
                <FormField label="Port" id="connection-port" required>
                  {(field) => <input class="input mono" id={field.id} type="text" value={protocol() === "ssh" ? "22" : "3389"} />}
                </FormField>
              </div>

              <div class="field-row">
                <FormField label="Username" id="connection-username" required>
                  {(field) => <input class="input mono" id={field.id} type="text" value={protocol() === "ssh" ? "ubuntu" : "Administrator"} />}
                </FormField>
                <FormField label="Folder" id="connection-folder">
                  {(field) => <input class="input" id={field.id} type="text" value="Production" />}
                </FormField>
              </div>
            </div>
          </section>

          <Show when={protocol() === "ssh"}>
            <section class="config-section" aria-labelledby="ssh-fields-title">
              <h3 id="ssh-fields-title">SSH authentication</h3>
              <div class="form-grid">
                <div class="field">
                  <span class="label" id="ssh-auth-label">Authentication method</span>
                  <div class="preset-row" role="radiogroup" aria-labelledby="ssh-auth-label">
                    <For each={authModes}>
                      {(item) => (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={authMode() === item.id}
                          class={`preset${authMode() === item.id ? " active" : ""}`}
                          onClick={() => setAuthMode(item.id)}
                        >
                          {item.label}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <FormField label="Private Key" id="ssh-private-key">
                  {(field) => <textarea class="textarea mono" id={field.id} rows="4" value={privateKey()} onInput={(e) => setPrivateKey(e.currentTarget.value)} />}
                </FormField>

                <FormField label="Password" id="ssh-password">
                  {(field) => <input class="input mono" id={field.id} type="password" value="••••••••••••" />}
                </FormField>

                <FormField label="SSH Agent" id="ssh-agent">
                  {(field) => <input class="input mono" id={field.id} type="text" value="SSH_AUTH_SOCK" />}
                </FormField>

                <VaultPicker items={sshVaultItems} selectedId={sshVaultId()} onSelect={setSshVaultId} />
              </div>
            </section>
          </Show>

          <Show when={protocol() === "rdp"}>
            <section class="config-section" aria-labelledby="rdp-fields-title">
              <h3 id="rdp-fields-title">RDP settings</h3>
              <div class="form-grid">
                <div class="field-row">
                  <FormField label="Domain" id="rdp-domain">
                    {(field) => <input class="input mono" id={field.id} type="text" value="PROD" />}
                  </FormField>
                  <FormField label="Screen size" id="rdp-screen-size">
                    {(field) => (
                      <select class="select" id={field.id} value="Auto (match window)">
                        <option>Auto (match window)</option>
                        <option>1920 × 1080</option>
                        <option>1680 × 1050</option>
                        <option>1440 × 900</option>
                        <option>1280 × 720</option>
                        <option>Fullscreen</option>
                      </select>
                    )}
                  </FormField>
                </div>

                <div class="field-row">
                  <FormField label="Certificate validation" id="rdp-certificate-validation">
                    {(field) => (
                      <select class="select" id={field.id} value="Warn on invalid certificate">
                        <option>Warn on invalid certificate</option>
                        <option>Reject invalid certificate</option>
                        <option>Ignore certificate errors</option>
                      </select>
                    )}
                  </FormField>
                  <div class="field">
                    <span class="label">Session options</span>
                    <button type="button" role="switch" aria-checked={fullscreen()} class={`toggle${fullscreen() ? " on" : ""}`} onClick={() => setFullscreen(!fullscreen())}>
                      <span class="toggle-track" />
                      <span>Fullscreen</span>
                    </button>
                    <button type="button" role="switch" aria-checked={clipboard()} class={`toggle${clipboard() ? " on" : ""}`} onClick={() => setClipboard(!clipboard())}>
                      <span class="toggle-track" />
                      <span>Clipboard</span>
                    </button>
                    <button type="button" role="switch" aria-checked={audio()} class={`toggle${audio() ? " on" : ""}`} onClick={() => setAudio(!audio())}>
                      <span class="toggle-track" />
                      <span>Audio</span>
                    </button>
                  </div>
                </div>

                <VaultPicker items={rdpVaultItems} selectedId={rdpVaultId()} onSelect={setRdpVaultId} />
              </div>
            </section>
          </Show>

          <section class="config-section" aria-labelledby="metadata-title">
            <h3 id="metadata-title">Metadata</h3>
            <div class="form-grid">
              <FormField label="Tags" id="connection-tags">
                {(field) => <input class="input" id={field.id} type="text" value="production, api, linux" />}
              </FormField>

              <div class="field">
                <button
                  type="button"
                  role="switch"
                  aria-checked={syncEnabled()}
                  class={`toggle${syncEnabled() ? " on" : ""}`}
                  onClick={() => setSyncEnabled(!syncEnabled())}
                >
                  <span class="toggle-track" />
                  <span>Sync this connection across devices</span>
                </button>
              </div>

              <FormField label="Notes" id="connection-notes">
                {(field) => <textarea class="textarea" id={field.id} rows="3" value={notes()} onInput={(e) => setNotes(e.currentTarget.value)} />}
              </FormField>
            </div>
          </section>
        </div>

        <footer class="form-actions rise rise-2">
          <A class="btn btn-ghost" href="/connections">Cancel</A>
          <button class="btn btn-primary" type="button">Save connection</button>
          <button class="btn btn-danger" type="button">Delete</button>
        </footer>
      </section>
    </>
  );
}
