import { A } from "@solidjs/router";
import { For, createSignal } from "solid-js";
import { Btn } from "../components/Btn";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { TopbarBreadcrumb } from "../components/Topbar";

type SecretType = "password" | "private-key" | "passphrase" | "generic";

const SECRET_TYPES: Array<{ type: SecretType; label: string; icon: string }> = [
  { type: "password", label: "Password", icon: "i-key" },
  { type: "private-key", label: "Private Key", icon: "i-shield" },
  { type: "passphrase", label: "Passphrase", icon: "i-lock" },
  { type: "generic", label: "Generic", icon: "i-bolt" },
];

const TAGS = ["production", "ssh", "ed25519"];

const CONNECTIONS = [
  ["Production API Server", "10.0.0.10:22"],
  ["Production Worker", "10.0.0.11:22"],
  ["Production DB Bastion", "10.0.0.5:22"],
];

const SECRET_VALUE = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAA
prod-ed25519-key-redacted
-----END OPENSSH PRIVATE KEY-----`;

export function VaultEditPage() {
  const [selectedType, setSelectedType] = createSignal<SecretType>("private-key");
  const [revealed, setRevealed] = createSignal(false);

  return (
    <>
      <TopbarBreadcrumb parent={{ label: "Vault", href: "/vault" }} current="Edit Item" />

      <div class="vault-editor-panel">
        <header class="mb-6 rise rise-1">
          <p class="eyebrow">Vault Item</p>
          <h1 class="page-title">Production SSH Key (ed25519)</h1>
          <p class="page-subtitle">Edit encrypted secret metadata and linked connection usage.</p>
        </header>

        <section class="vault-type-selector rise rise-2" role="group" aria-label="Secret type">
          <For each={SECRET_TYPES}>
            {(item) => (
              <button
                type="button"
                class={`vault-type-opt ${item.type}${selectedType() === item.type ? " active" : ""}`}
                aria-pressed={selectedType() === item.type}
                onClick={() => setSelectedType(item.type)}
              >
                <span class={`pill-icon ${item.type}`}><Icon name={item.icon} size="sm" /></span>
                <span>{item.label}</span>
              </button>
            )}
          </For>
        </section>

        <section class="card form-grid rise rise-3" aria-label="Secret details">
          <FormField label="Name" required>
            {(field) => <input id={field.id} class="input" value="Production SSH Key (ed25519)" />}
          </FormField>
          <FormField label="Secret value" required hint="Private key content. Stored encrypted in Vault. Never synced as plaintext.">
            {(field) => (
              <div class={`secret-field-wrap${revealed() ? " revealed" : " hidden"}`}>
                <textarea id={field.id} class="textarea mono" rows="5" aria-describedby={field.describedBy}>{SECRET_VALUE}</textarea>
                <button
                  type="button"
                  class="secret-reveal"
                  aria-label={revealed() ? "Hide secret value" : "Reveal secret value"}
                  onClick={() => setRevealed((visible) => !visible)}
                >
                  <Icon name={revealed() ? "i-eye-off" : "i-eye"} size="xs" />
                  {revealed() ? "Hide" : "Reveal"}
                </button>
              </div>
            )}
          </FormField>
          <FormField label="Tags">
            {(field) => (
              <div id={field.id} class="tags-input" role="list" aria-label="Tags">
                <For each={TAGS}>{(tag) => <span class="tag" role="listitem">#{tag}<button type="button" aria-label={`Remove ${tag}`}>×</button></span>}</For>
                <input aria-label="Add tag" value="" placeholder="Add tag" />
              </div>
            )}
          </FormField>
          <FormField label="Notes">
            {(field) => <textarea id={field.id} class="textarea" rows="3">Generated 2026-01-15. Used for all production Linux servers. Rotated quarterly.</textarea>}
          </FormField>
        </section>

        <section class="linked-connections rise rise-4" aria-label="Linked connections">
          <div class="linked-header">
            <Icon name="i-link" />
            <div>
              <h2>Used by 3 connections</h2>
              <p>Changing this secret affects these saved SSH sessions.</p>
            </div>
          </div>
          <div class="linked-list">
            <For each={CONNECTIONS}>
              {([name, host]) => (
                <div class="linked-item">
                  <span class="proto-icon ssh"><Icon name="i-terminal" size="xs" /></span>
                  <div class="linked-meta">
                    <strong>{name}</strong>
                    <span>{host}</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>

        <footer class="form-actions rise rise-5">
          <A class="btn btn-ghost" href="/vault">Cancel</A>
          <Btn variant="primary">Save changes</Btn>
          <Btn variant="danger" icon="i-trash">Delete</Btn>
        </footer>
      </div>
    </>
  );
}
