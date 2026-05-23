import { For, Show, createMemo, createSignal } from "solid-js";
import { Banner } from "../components/Banner";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { SessionTabs } from "../components/SessionTabs";
import { TopbarTitle } from "../components/Topbar";

type SessionState = "connected" | "connecting" | "failed" | "disconnected";

interface SessionItem {
  id: string;
  name: string;
  protocol: "ssh" | "rdp";
  state: SessionState;
  host: string;
  port: string;
  user: string;
  latency: string;
  encoding: string;
  size: string;
  reason?: string;
}

const SESSIONS: SessionItem[] = [
  {
    id: "prod-api",
    name: "Production API",
    protocol: "ssh",
    state: "connected",
    host: "api-prod.remotevault.dev",
    port: "22",
    user: "ubuntu",
    latency: "18ms",
    encoding: "UTF-8",
    size: "132x34",
  },
  {
    id: "prod-worker",
    name: "Production Worker",
    protocol: "ssh",
    state: "connecting",
    host: "worker-prod.remotevault.dev",
    port: "22",
    user: "ubuntu",
    latency: "--",
    encoding: "UTF-8",
    size: "132x34",
  },
  {
    id: "staging-api",
    name: "Staging API",
    protocol: "ssh",
    state: "failed",
    host: "staging-api.remotevault.dev",
    port: "22",
    user: "deploy",
    latency: "timeout",
    encoding: "UTF-8",
    size: "132x34",
    reason: "Connection timed out after 30s while waiting for SSH handshake.",
  },
];

const STATUS_LABEL: Record<SessionState, string> = {
  connected: "Connected",
  connecting: "Connecting",
  failed: "Failed",
  disconnected: "Disconnected",
};

const STATUS_VARIANT: Record<SessionState, "success" | "warning" | "danger" | "ghost"> = {
  connected: "success",
  connecting: "warning",
  failed: "danger",
  disconnected: "ghost",
};

const CONNECTED_OUTPUT = [
  "Last login: Sat May 23 10:42:11 2026 from 10.0.0.24",
  "ubuntu@api-prod:~$ systemctl status api-server",
  "● api-server.service - Production API Server",
  "     Loaded: loaded (/etc/systemd/system/api-server.service; enabled)",
  "     Active: active (running) since Sat 2026-05-23 09:58:10 UTC; 44min ago",
  "ubuntu@api-prod:~$ df -h /",
  "Filesystem      Size  Used Avail Use% Mounted on",
  "/dev/nvme0n1p1   79G   31G   49G  39% /",
];

export function SessionPage() {
  const [activeId, setActiveId] = createSignal(SESSIONS[0].id);
  const [firstConnectOpen, setFirstConnectOpen] = createSignal(false);
  const [changedKeyOpen, setChangedKeyOpen] = createSignal(false);
  const activeSession = createMemo(() => SESSIONS.find((item) => item.id === activeId()) ?? SESSIONS[0]);
  const unavailable = createMemo(() => ["failed", "disconnected"].includes(activeSession().state));

  const closeTab = (id: string) => {
    if (id === activeId()) setActiveId(SESSIONS[0].id);
  };

  return (
    <>
      <TopbarTitle title="Sessions" />

      <section class="session-layout rise rise-1" aria-label="Remote session workspace">
        <SessionTabs tabs={SESSIONS} activeId={activeId()} onSelect={setActiveId} onClose={closeTab} />

        <div class="session-shell">
          <div class="session-terminal-wrap">
            <header class="session-terminal-header">
              <div class="row gap-3">
                <Icon name="i-terminal" />
                <div>
                  <strong>{activeSession().name}</strong>
                  <span>{activeSession().user}@{activeSession().host}:{activeSession().port}</span>
                </div>
              </div>
              <Chip variant={STATUS_VARIANT[activeSession().state]} dot>{STATUS_LABEL[activeSession().state]}</Chip>
            </header>

            <pre class="session-terminal" aria-label="Terminal output">
              <Show when={activeSession().state === "connected"} fallback={<TerminalFallback session={activeSession()} />}>
                <For each={CONNECTED_OUTPUT}>{(line) => <>{line}{"\n"}</>}</For>
                <span class="terminal-cursor" aria-label="cursor block">█</span>
              </Show>
            </pre>

            <Show when={unavailable()}>
              <div class="session-disconnected-overlay" role="alert">
                <Icon name="i-alert" />
                <h2>Connection lost</h2>
                <p>{activeSession().host}:{activeSession().port}</p>
                <p>{activeSession().reason ?? "Remote host closed the session."}</p>
                <div class="row gap-3">
                  <Btn variant="primary" size="sm">Reconnect</Btn>
                  <Btn variant="ghost" size="sm" onClick={() => closeTab(activeSession().id)}>Close tab</Btn>
                </div>
              </div>
            </Show>
          </div>

          <footer class="session-status-bar" aria-label="Session status">
            <StatusItem label="State" value={STATUS_LABEL[activeSession().state]} />
            <StatusItem label="Host" value={activeSession().host} />
            <StatusItem label="User" value={activeSession().user} />
            <StatusItem label="Latency" value={activeSession().latency} />
            <StatusItem label="Encoding" value={activeSession().encoding} />
            <StatusItem label="Size" value={activeSession().size} />
            <div class="session-status-actions">
              <Btn variant="secondary" size="sm" onClick={() => setFirstConnectOpen(true)}>Demo first connect</Btn>
              <Btn variant="secondary" size="sm" onClick={() => setChangedKeyOpen(true)}>Demo host key changed</Btn>
            </div>
          </footer>
        </div>
      </section>

      <HostKeyModal
        open={firstConnectOpen()}
        label="First Connect Host Key"
        title="Trust this host key?"
        banner="This is the first time RemoteVault has seen api-prod.remotevault.dev. Verify the fingerprint before continuing."
        variant="info"
        primary="Trust and connect"
        onClose={() => setFirstConnectOpen(false)}
      />
      <HostKeyModal
        open={changedKeyOpen()}
        label="Host Key Changed"
        title="Host key changed"
        banner="The saved host key does not match this server. Continue only if the host was rebuilt or the key was rotated."
        variant="danger"
        primary="Update saved key"
        onClose={() => setChangedKeyOpen(false)}
      />
    </>
  );
}

function TerminalFallback(props: { session: SessionItem }) {
  return (
    <>
      {props.session.state === "connecting"
        ? `Connecting to ${props.session.host}:${props.session.port} as ${props.session.user}...`
        : `${STATUS_LABEL[props.session.state]}: ${props.session.reason ?? "Session unavailable."}`}
    </>
  );
}

function StatusItem(props: { label: string; value: string }) {
  return (
    <span class="session-status-item">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </span>
  );
}

function HostKeyModal(props: {
  open: boolean;
  label: string;
  title: string;
  banner: string;
  variant: "info" | "danger";
  primary: string;
  onClose: () => void;
}) {
  return (
    <Modal open={props.open} onClose={props.onClose} label={props.label} class="host-key-modal">
      <div class="modal-stack">
        <header>
          <h2>{props.title}</h2>
          <p>SSH fingerprint verification protects against machine-in-the-middle attacks.</p>
        </header>
        <Banner variant={props.variant} icon="i-shield" title={props.label}>{props.banner}</Banner>
        <dl class="host-key-details">
          <div><dt>Algorithm</dt><dd>ED25519</dd></div>
          <div><dt>Fingerprint</dt><dd>SHA256:W6r7h3Jzv9Qp2n4xY8mK1bD0sA5eL6cT2uN9fG4qH1</dd></div>
        </dl>
        <footer class="modal-actions">
          <Btn variant="ghost" onClick={props.onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={props.onClose}>{props.primary}</Btn>
        </footer>
      </div>
    </Modal>
  );
}
