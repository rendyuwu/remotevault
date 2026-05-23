import { For, createMemo, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Btn } from "../components/Btn";
import { FilterChip } from "../components/FilterChip";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { Pill } from "../components/Pill";
import { PillGrid } from "../components/PillGrid";
import { Toggle } from "../components/Toggle";
import { TopbarTitle } from "../components/Topbar";

type Protocol = "SSH" | "RDP";
type Filter = "All" | Protocol;

interface ConnectionItem {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  folder: string;
  status: "synced" | "conflict" | "local";
  port: string;
  username: string;
  useVault: boolean;
}

const FILTERS: Filter[] = ["All", "SSH", "RDP"];

const CONNECTIONS: ConnectionItem[] = [
  { id: "prod-api", name: "Production API Server", protocol: "SSH", host: "api.prod.remotevault.local", folder: "Production", status: "synced", port: "22", username: "deploy", useVault: true },
  { id: "prod-worker", name: "Production Worker", protocol: "SSH", host: "worker.prod.remotevault.local", folder: "Production", status: "synced", port: "22", username: "deploy", useVault: true },
  { id: "prod-db", name: "Production DB Bastion", protocol: "SSH", host: "bastion.prod.remotevault.local", folder: "Production", status: "conflict", port: "22", username: "dba", useVault: true },
  { id: "prod-win", name: "Production Windows Server", protocol: "RDP", host: "win.prod.remotevault.local", folder: "Production", status: "synced", port: "3389", username: "Administrator", useVault: true },
  { id: "staging-api", name: "Staging API", protocol: "SSH", host: "api.staging.remotevault.local", folder: "Staging", status: "local", port: "22", username: "deploy", useVault: false },
  { id: "staging-win", name: "Staging Windows", protocol: "RDP", host: "win.staging.remotevault.local", folder: "Staging", status: "synced", port: "3389", username: "Administrator", useVault: true },
  { id: "homelab-nas", name: "Homelab NAS", protocol: "SSH", host: "nas.home.arpa", folder: "Homelab", status: "synced", port: "22", username: "admin", useVault: false },
];

const blankConnection = (): ConnectionItem => ({
  id: "",
  name: "",
  protocol: "SSH",
  host: "",
  folder: "Production",
  status: "local",
  port: "22",
  username: "",
  useVault: true,
});

export function ConnectionsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = createSignal<Filter>("All");
  const [selectedId, setSelectedId] = createSignal(CONNECTIONS[0].id);
  const [editingConnection, setEditingConnection] = createSignal<ConnectionItem>();
  const [draft, setDraft] = createSignal<ConnectionItem>(blankConnection());
  const [modalOpen, setModalOpen] = createSignal(false);
  const [conflictOpen, setConflictOpen] = createSignal(false);

  const visibleConnections = createMemo(() => {
    const filter = activeFilter();
    return filter === "All" ? CONNECTIONS : CONNECTIONS.filter((item) => item.protocol === filter);
  });

  const openAddModal = () => {
    setEditingConnection(undefined);
    setDraft(blankConnection());
    setModalOpen(true);
  };

  const openEditModal = (connection: ConnectionItem) => {
    setEditingConnection(connection);
    setDraft({ ...connection });
    setModalOpen(true);
  };

  const updateDraft = <K extends keyof ConnectionItem>(key: K, value: ConnectionItem[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const openConnection = (connection: ConnectionItem) => {
    if (connection.status === "conflict") {
      setSelectedId(connection.id);
      setConflictOpen(true);
      return;
    }
    navigate("/session");
  };

  return (
    <>
      <TopbarTitle
        title="Connections"
        actions={
          <>
            <label class="search" aria-label="Search connections">
              <Icon name="i-search" size="xs" />
              <input type="search" placeholder="Search connections..." />
            </label>
            <Btn variant="primary" icon="i-plus" onClick={openAddModal}>New connection</Btn>
          </>
        }
      />

      <section class="folder-tree rise rise-1" aria-label="Connection folders">
        <div class="topbar-crumbs" aria-label="Connection breadcrumb">
          <span>Connections</span>
          <span class="sep">/</span>
          <span class="here">All connections</span>
        </div>
        <div class="folder-item active">
          <Icon name="i-folder" size="xs" />
          <span>All connections</span>
          <span class="folder-count">7</span>
        </div>
        <div class="folder-item nested">
          <Icon name="i-folder" size="xs" />
          <span>Production</span>
          <span class="folder-count">4</span>
        </div>
        <div class="folder-item nested">
          <Icon name="i-folder" size="xs" />
          <span>Staging</span>
          <span class="folder-count">2</span>
        </div>
        <div class="folder-item nested">
          <Icon name="i-folder" size="xs" />
          <span>Homelab</span>
          <span class="folder-count">1</span>
        </div>
      </section>

      <section class="vault-filter-bar rise rise-2" aria-label="Connection filters">
        <div class="vault-filter-chips">
          <For each={FILTERS}>
            {(filter) => <FilterChip label={filter} active={activeFilter() === filter} onClick={() => setActiveFilter(filter)} />}
          </For>
        </div>
      </section>

      <section class="rise rise-3" aria-label="Connections">
        <PillGrid empty={!visibleConnections().length} emptyIcon="i-server" emptyMessage="No connections match this filter">
          <For each={visibleConnections()}>
            {(connection) => (
              <Pill
                icon={{ type: connection.protocol.toLowerCase(), svg: connection.protocol === "SSH" ? "i-terminal" : "i-server" }}
                name={connection.name}
                subtitle={`${connection.protocol} · ${connection.host}`}
                status={connection.status}
                active={selectedId() === connection.id}
                onClick={() => setSelectedId(connection.id)}
                onDblClick={() => openConnection(connection)}
                onEdit={() => connection.status === "conflict" ? setConflictOpen(true) : openEditModal(connection)}
              />
            )}
          </For>
        </PillGrid>
      </section>

      <Modal open={modalOpen()} onClose={() => setModalOpen(false)} label={editingConnection() ? "Edit Connection" : "Add Connection"}>
        <div class="modal-stack">
          <header>
            <h2>{editingConnection() ? "Edit Connection" : "Add Connection"}</h2>
            <p>{editingConnection() ? "Update this saved remote target." : "Create a saved SSH or RDP target."}</p>
          </header>

          <div class="vault-type-selector" role="group" aria-label="Connection protocol">
            <For each={["SSH", "RDP"] as Protocol[]}>
              {(protocol) => (
                <button
                  type="button"
                  class={`vault-type-opt ${protocol.toLowerCase()}${draft().protocol === protocol ? " active" : ""}`}
                  aria-pressed={draft().protocol === protocol}
                  onClick={() => updateDraft("protocol", protocol)}
                >
                  <span class={`pill-icon ${protocol.toLowerCase()}`}><Icon name={protocol === "SSH" ? "i-terminal" : "i-server"} size="sm" /></span>
                  <span>{protocol}</span>
                </button>
              )}
            </For>
          </div>

          <div class="form-grid">
            <FormField label="Name" required>
              {(field) => <input id={field.id} class="input" value={draft().name} placeholder="e.g. Production API Server" onInput={(e) => updateDraft("name", e.currentTarget.value)} />}
            </FormField>
            <FormField label="Host" required>
              {(field) => <input id={field.id} class="input" value={draft().host} placeholder="hostname or IP address" onInput={(e) => updateDraft("host", e.currentTarget.value)} />}
            </FormField>
            <FormField label="Port">
              {(field) => <input id={field.id} class="input" value={draft().port} onInput={(e) => updateDraft("port", e.currentTarget.value)} />}
            </FormField>
            <FormField label="Username">
              {(field) => <input id={field.id} class="input" value={draft().username} placeholder="login user" onInput={(e) => updateDraft("username", e.currentTarget.value)} />}
            </FormField>
            <FormField label="Folder">
              {(field) => <input id={field.id} class="input" value={draft().folder} placeholder="Production" onInput={(e) => updateDraft("folder", e.currentTarget.value)} />}
            </FormField>
            <Toggle on={draft().useVault} label="Use Vault credentials" onChange={(value) => updateDraft("useVault", value)} />
          </div>

          <footer class="modal-actions">
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => setModalOpen(false)}>{editingConnection() ? "Save changes" : "Save connection"}</Btn>
          </footer>
        </div>
      </Modal>

      <ConnectionConflictModal open={conflictOpen()} onClose={() => setConflictOpen(false)} />
    </>
  );
}

function ConnectionConflictModal(props: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={props.open} onClose={props.onClose} class="conflict-modal" label="Resolve Connection Conflict">
      <h3 class="card-title">Resolve Connection Conflict</h3>
      <p class="conflict-copy">"Production DB Bastion" connection settings changed on two devices. Review the host and username before choosing which connection to keep.</p>
      <div class="conflict-versions">
        <div class="conflict-version">
          <div class="conflict-version-header">Local connection</div>
          <div class="cv-field"><div class="cv-label">Host</div><div class="cv-value cv-changed">bastion.prod.remotevault.local</div></div>
          <div class="cv-field"><div class="cv-label">Username</div><div class="cv-value">dba</div></div>
        </div>
        <div class="conflict-version">
          <div class="conflict-version-header">Remote connection</div>
          <div class="cv-field"><div class="cv-label">Host</div><div class="cv-value cv-changed">db-bastion.prod.remotevault.local</div></div>
          <div class="cv-field"><div class="cv-label">Username</div><div class="cv-value">deploy</div></div>
        </div>
      </div>
      <div class="conflict-actions">
        <Btn variant="ghost" onClick={props.onClose}>Keep Local</Btn>
        <Btn variant="ghost" onClick={props.onClose}>Keep Remote</Btn>
        <Btn variant="primary" onClick={props.onClose}>Keep Both</Btn>
      </div>
    </Modal>
  );
}
