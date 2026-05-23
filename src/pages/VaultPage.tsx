import { A } from "@solidjs/router";
import { For, createMemo, createSignal } from "solid-js";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { FilterChip } from "../components/FilterChip";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Pill } from "../components/Pill";
import { PillGrid } from "../components/PillGrid";
import { TopbarTitle } from "../components/Topbar";

type SecretType = "password" | "private-key" | "passphrase" | "generic";
type Filter = "All" | "Passwords" | "Private Keys" | "Passphrases" | "Generic";

interface SecretItem {
  id: string;
  name: string;
  subtitle: string;
  type: SecretType;
  filter: Filter;
  status: "synced" | "conflict" | "local";
  icon: string;
}

const FILTERS: Filter[] = ["All", "Passwords", "Private Keys", "Passphrases", "Generic"];

const SECRET_TYPES: Array<{ type: SecretType; label: string; icon: string }> = [
  { type: "password", label: "Password", icon: "i-key" },
  { type: "private-key", label: "Private Key", icon: "i-shield" },
  { type: "passphrase", label: "Passphrase", icon: "i-lock" },
  { type: "generic", label: "Generic", icon: "i-bolt" },
];

const SECRETS: SecretItem[] = [
  {
    id: "prod-rdp-password",
    name: "Production RDP Password",
    subtitle: "administrator · 10.0.0.20",
    type: "password",
    filter: "Passwords",
    status: "synced",
    icon: "i-key",
  },
  {
    id: "prod-ssh-key",
    name: "Production SSH Key (ed25519)",
    subtitle: "prod-linux · ed25519",
    type: "private-key",
    filter: "Private Keys",
    status: "synced",
    icon: "i-shield",
  },
  {
    id: "ssh-passphrase",
    name: "SSH Key Passphrase",
    subtitle: "production key · needs review",
    type: "passphrase",
    filter: "Passphrases",
    status: "conflict",
    icon: "i-lock",
  },
  {
    id: "staging-token",
    name: "Staging API Token",
    subtitle: "deploy bot · local only",
    type: "generic",
    filter: "Generic",
    status: "local",
    icon: "i-bolt",
  },
];

export function VaultPage() {
  const [activeFilter, setActiveFilter] = createSignal<Filter>("All");
  const [selectedId, setSelectedId] = createSignal(SECRETS[0].id);
  const [modalOpen, setModalOpen] = createSignal(false);
  const [selectedType, setSelectedType] = createSignal<SecretType>("password");

  const visibleSecrets = createMemo(() => {
    const filter = activeFilter();
    return filter === "All" ? SECRETS : SECRETS.filter((secret) => secret.filter === filter);
  });

  return (
    <>
      <TopbarTitle
        title="Vault"
        actions={
          <>
            <label class="search" aria-label="Search vault">
              <Icon name="i-search" size="xs" />
              <input type="search" placeholder="Search secrets" />
            </label>
            <Btn variant="primary" icon="i-plus" onClick={() => setModalOpen(true)}>Add secret</Btn>
          </>
        }
      />

      <section class="vault-status-bar rise rise-1">
        <div class="row gap-3">
          <Icon name="i-unlock" />
          <div>
            <strong>Vault unlocked</strong>
            <span>Secrets are decrypted in memory</span>
          </div>
        </div>
        <A class="btn btn-secondary btn-sm" href="/vault-locked">Lock now</A>
      </section>

      <section class="vault-filter-bar rise rise-2" aria-label="Vault filters">
        <div class="vault-filter-chips">
          <For each={FILTERS}>
            {(filter) => <FilterChip label={filter} active={activeFilter() === filter} onClick={() => setActiveFilter(filter)} />}
          </For>
        </div>
      </section>

      <section class="rise rise-3" aria-label="Vault secrets">
        <PillGrid empty={!visibleSecrets().length} emptyIcon="i-vault" emptyMessage="No secrets match this filter">
          <For each={visibleSecrets()}>
            {(secret) => (
              <Pill
                icon={{ type: secret.type, svg: secret.icon }}
                name={secret.name}
                subtitle={secret.subtitle}
                status={secret.status}
                active={selectedId() === secret.id}
                onClick={() => setSelectedId(secret.id)}
                onDblClick={() => setModalOpen(true)}
              />
            )}
          </For>
        </PillGrid>
        <footer class="vault-grid-footer">
          <span>4 items · encrypted with workspace key v1</span>
          <Chip variant="success" dot>Synced</Chip>
        </footer>
      </section>

      <Modal open={modalOpen()} onClose={() => setModalOpen(false)} label="Add Secret">
        <div class="modal-stack">
          <header>
            <h2>Add Secret</h2>
            <p>Store encrypted credentials in this workspace Vault.</p>
          </header>

          <div class="vault-type-selector" role="group" aria-label="Secret type">
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
          </div>

          <div class="form-grid">
            <FormField label="Name" required>
              {(field) => <input id={field.id} class="input" value="Production SSH Key (ed25519)" />}
            </FormField>
            <FormField label="Secret value" required>
              {(field) => <textarea id={field.id} class="textarea mono" rows="4">••••••••••••••••••••••••</textarea>}
            </FormField>
            <FormField label="Tags">
              {(field) => <input id={field.id} class="input" value="production, ssh, ed25519" />}
            </FormField>
            <FormField label="Notes">
              {(field) => <textarea id={field.id} class="textarea" rows="3">Rotated quarterly. Used by production hosts.</textarea>}
            </FormField>
          </div>

          <footer class="modal-actions">
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => setModalOpen(false)}>Save secret</Btn>
          </footer>
        </div>
      </Modal>
    </>
  );
}
