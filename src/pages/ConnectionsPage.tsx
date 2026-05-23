import { For, createMemo, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Btn } from "../components/Btn";
import { ConflictModal } from "../components/ConflictModal";
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
  status: "synced" | "conflict" | "pending" | "local";
  port: string;
  username: string;
  useVault: boolean;
}

const FILTERS: Filter[] = ["All", "SSH", "RDP"];

const CONNECTIONS: ConnectionItem[] = [
  { id: "prod-api", name: "Production API Server", protocol: "SSH", host: "10.0.0.10", status: "synced", port: "22", username: "ubuntu", useVault: true },
  { id: "prod-worker", name: "Production Worker", protocol: "SSH", host: "10.0.0.11", status: "synced", port: "22", username: "ubuntu", useVault: true },
  { id: "prod-db", name: "Production DB Bastion", protocol: "SSH", host: "10.0.0.5", status: "synced", port: "22", username: "ubuntu", useVault: true },
  { id: "prod-win", name: "Production Windows Server", protocol: "RDP", host: "10.0.0.20", status: "synced", port: "3389", username: "Administrator", useVault: true },
  { id: "staging-api", name: "Staging API", protocol: "SSH", host: "staging.example.com", status: "conflict", port: "22", username: "deploy", useVault: true },
  { id: "staging-win", name: "Staging Windows", protocol: "RDP", host: "staging-win.example.com", status: "pending", port: "3389", username: "Administrator", useVault: true },
  { id: "homelab-nas", name: "Homelab NAS", protocol: "SSH", host: "192.168.1.50", status: "local", port: "22", username: "admin", useVault: false },
];

const blankConnection = (): ConnectionItem => ({
  id: "",
  name: "",
  protocol: "SSH",
  host: "",
  status: "local",
  port: "22",
  username: "",
  useVault: true,
});

export function ConnectionsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = createSignal<Filter>("All");
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedId, setSelectedId] = createSignal(CONNECTIONS[0].id);
  const [editingConnection, setEditingConnection] = createSignal<ConnectionItem>();
  const [draft, setDraft] = createSignal<ConnectionItem>(blankConnection());
  const [modalOpen, setModalOpen] = createSignal(false);
  const [conflictOpen, setConflictOpen] = createSignal(false);

  const visibleConnections = createMemo(() => {
    const filter = activeFilter();
    const query = searchQuery().trim().toLowerCase();
    return CONNECTIONS.filter((item) => {
      const matchesFilter = filter === "All" || item.protocol === filter;
      const matchesSearch = !query || [item.name, item.host, item.username].some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
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

  const updateDraftProtocol = (protocol: Protocol) => {
    setDraft((current) => ({ ...current, protocol, port: protocol === "SSH" ? "22" : "3389" }));
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
              <input type="search" placeholder="Search connections..." value={searchQuery()} onInput={(e) => setSearchQuery(e.currentTarget.value)} />
            </label>
            <Btn variant="primary" icon="i-plus" onClick={openAddModal}>New connection</Btn>
          </>
        }
      />

      <section class="vault-filter-bar rise rise-1" aria-label="Connection filters">
        <div class="vault-filter-chips">
          <For each={FILTERS}>
            {(filter) => <FilterChip label={filter} active={activeFilter() === filter} onClick={() => setActiveFilter(filter)} />}
          </For>
        </div>
      </section>

      <section class="rise rise-2" aria-label="Connections">
        <PillGrid empty={!visibleConnections().length} emptyIcon="i-server" emptyMessage="No connections match this filter">
          <For each={visibleConnections()}>
            {(connection) => (
              <Pill
                icon={{ type: connection.protocol.toLowerCase(), svg: connection.protocol === "SSH" ? "i-terminal" : "i-server" }}
                name={connection.name}
                subtitle={`${connection.host}:${connection.port}`}
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
                  onClick={() => updateDraftProtocol(protocol)}
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
            <Toggle on={draft().useVault} label="Use Vault credentials" onChange={(value) => updateDraft("useVault", value)} />
          </div>

          <footer class="modal-actions">
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => setModalOpen(false)}>{editingConnection() ? "Save changes" : "Save connection"}</Btn>
          </footer>
        </div>
      </Modal>

      <ConflictModal
        open={conflictOpen()}
        onClose={() => setConflictOpen(false)}
        label="Resolve Connection Conflict"
        title="Resolve Connection Conflict"
        copy={'"Staging API" connection settings changed on two devices. Review the host and username before choosing which connection to keep.'}
        onKeepLocal={() => setConflictOpen(false)}
        onKeepRemote={() => setConflictOpen(false)}
        onKeepBoth={() => setConflictOpen(false)}
        local={{
          header: "Local connection",
          fields: [
            { label: "Host", value: "staging.example.com", changed: true },
            { label: "Port", value: "2222", changed: true },
            { label: "Username", value: "deploy" },
            { label: "Updated", value: "2 hours ago" },
          ],
        }}
        remote={{
          header: "Remote connection",
          fields: [
            { label: "Host", value: "staging-new.example.com", changed: true },
            { label: "Port", value: "22", changed: true },
            { label: "Username", value: "deploy" },
            { label: "Updated", value: "45 min ago" },
          ],
        }}
      />
    </>
  );
}
