import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import { A, useSearchParams } from "@solidjs/router";
import { Banner } from "../components/Banner";
import { Btn } from "../components/Btn";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { SessionTabs } from "../components/SessionTabs";

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
    id: "prod-win",
    name: "Production Windows Server",
    protocol: "rdp",
    state: "connected",
    host: "10.0.0.20",
    port: "3389",
    user: "Administrator",
    latency: "11ms",
    encoding: "RGB 32-bit",
    size: "1600x900",
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
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = createSignal(SESSIONS);
  const [activeId, setActiveId] = createSignal(SESSIONS[0].id);
  const [firstConnectOpen, setFirstConnectOpen] = createSignal(false);
  const [changedKeyOpen, setChangedKeyOpen] = createSignal(false);
  const activeSession = createMemo(() => sessions().find((item) => item.id === activeId()) ?? sessions()[0] ?? SESSIONS[0]);
  const unavailable = createMemo(() => ["failed", "disconnected"].includes(activeSession().state));

  createEffect(() => {
    const connection = searchParams.connection;
    const value = Array.isArray(connection) ? connection[0] : connection;
    setActiveId(value || SESSIONS[0].id);
  });

  const closeTab = (id: string) => {
    setSessions((current) => {
      if (current.length === 1) return current;
      const next = current.filter((item) => item.id !== id);
      if (id === activeId()) setActiveId(next[0].id);
      return next;
    });
  };

  return (
    <section class="session-workspace rise rise-1" aria-label="Remote session workspace">
      <div class="session-layout">
        <div class="session-tabs" aria-label="Session tabs">
          <A href="/connections" class="session-back-tab">Connection</A>
          <SessionTabs tabs={sessions()} activeId={activeId()} onSelect={setActiveId} onClose={closeTab} />
        </div>

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
      </div>

      <HostKeyModal
        open={firstConnectOpen()}
        label="First Connect Host Key"
        title="Unknown host"
        banner="This is the first time connecting to 10.0.0.10. Verify the host key fingerprint before trusting this server."
        variant="info"
        host="10.0.0.10:22"
        fingerprint="SHA256:Nw3aB7cDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbC"
        primary="Trust & connect"
        onClose={() => setFirstConnectOpen(false)}
      />
      <HostKeyModal
        open={changedKeyOpen()}
        label="Host Key Changed"
        title="Host key has changed!"
        banner="The host key for staging.example.com does not match the previously trusted key. This could indicate a man-in-the-middle attack or a server reinstall."
        variant="danger"
        fingerprint="SHA256:xR4kAbCdEfGhIjKlMnOpQrStUvWxYz0123456789mPq"
        previousFingerprint="SHA256:OlDkEyFiNgErPrInTtHaTwAsStOrEdBeFoRe99887766"
        onClose={() => setChangedKeyOpen(false)}
      />
    </section>
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
  fingerprint: string;
  previousFingerprint?: string;
  host?: string;
  primary?: string;
  onClose: () => void;
}) {
  return (
    <Modal open={props.open} onClose={props.onClose} label={props.label} class="host-key-modal">
      <div class="modal-stack">
        <header>
          <h2>{props.title}</h2>
          <p>SSH fingerprint verification protects against machine-in-the-middle attacks.</p>
        </header>
        <Banner variant={props.variant} icon="i-shield" title={props.title}>{props.banner}</Banner>
        <dl class="host-key-details">
          {props.host && <div><dt>Host</dt><dd>{props.host}</dd></div>}
          <div><dt>{props.previousFingerprint ? "New fingerprint" : "Fingerprint (ED25519)"}</dt><dd>{props.fingerprint}</dd></div>
          {props.previousFingerprint && <div><dt>Previously trusted</dt><dd>{props.previousFingerprint}</dd></div>}
        </dl>
        <footer class="modal-actions">
          {props.previousFingerprint ? (
            <>
              <Btn variant="danger" onClick={props.onClose}>Reject & disconnect</Btn>
              <Btn variant="secondary" onClick={props.onClose}>Trust new key</Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={props.onClose}>Cancel</Btn>
              <Btn variant="primary" onClick={props.onClose}>{props.primary}</Btn>
            </>
          )}
        </footer>
      </div>
    </Modal>
  );
}
