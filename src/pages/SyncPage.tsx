import { A } from "@solidjs/router";
import { For, createSignal } from "solid-js";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { Toggle } from "../components/Toggle";
import { TopbarTitle } from "../components/Topbar";

const PROVIDER = [
  ["Type", "S3-Compatible (Cloudflare R2)"],
  ["Endpoint", "https://abc123.r2.cloudflarestorage.com"],
  ["Bucket", "remotevault-sync"],
  ["Prefix", "/remotevault/v1/"],
  ["Region", "auto"],
  ["Privacy mode", "Standard"],
];

const SETTINGS = [
  { key: "syncEnabled", title: "Sync enabled", hint: "Push and pull encrypted events automatically", initial: true },
  { key: "syncOnLaunch", title: "Sync on app launch", hint: "Pull remote events when app starts", initial: true },
  { key: "syncOnFocus", title: "Sync on app focus", hint: "Pull remote events when window regains focus", initial: true },
  { key: "periodicPolling", title: "Periodic polling", hint: "Check for remote changes every 5 minutes", initial: true },
  { key: "syncVaultItems", title: "Sync Vault items", hint: "Include encrypted Vault secrets in sync", initial: true },
] as const;

type SyncSettingKey = typeof SETTINGS[number]["key"];

const initialSettings = Object.fromEntries(SETTINGS.map((item) => [item.key, item.initial])) as Record<SyncSettingKey, boolean>;

const SYNC_SCOPE = [
  ["Encrypted", "Vault items (passwords, private keys, passphrases, secrets)", "encrypted"],
  ["Encrypted", "Connection profiles (hostnames, usernames, notes, tags)", "encrypted"],
  ["Encrypted", "Workspace key (wrapped with your passphrase-derived KEK)", "encrypted"],
  ["Metadata", "Event IDs, timestamps, device IDs, object paths (visible to provider)", "warning"],
  ["Never", "Master passphrase, derived keys, SSH/RDP session traffic", "ghost"],
] as const;

const EVENTS = [
  ["push", "Pushed", "2 events (connection update, vault item edit)", "3 min ago"],
  ["pull", "Pulled", "1 event from Desktop (connection create)", "18 min ago"],
  ["push", "Pushed", "3 events (vault items created)", "1 hour ago"],
  ["conflict", "Conflict resolved", "kept both versions of Staging API connection", "yesterday"],
];

export function SyncPage() {
  const [settings, setSettings] = createSignal(initialSettings);

  const setToggle = (key: SyncSettingKey, value: boolean) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <>
      <TopbarTitle title="Sync" actions={<Chip variant="success" dot>Healthy</Chip>} />

      <section class="sync-status-card rise rise-1" aria-label="Sync status">
        <div class="sync-status-icon healthy"><Icon name="i-check" /></div>
        <div class="sync-status-info">
          <h3>Sync is healthy</h3>
          <p>All records are up to date across 2 devices. No conflicts detected.</p>
        </div>
        <div class="sync-status-meta">
          <span>Last sync: 3 min ago</span>
          <span>Device: Simon's MacBook Pro</span>
          <Chip variant="success">S3-Compatible</Chip>
        </div>
      </section>

      <section class="rise rise-2">
        <Card title="Storage Provider" actions={<Btn variant="ghost" size="sm">Change provider</Btn>}>
          <dl class="provider-info">
            <For each={PROVIDER}>{([label, value]) => <><dt>{label}</dt><dd>{value}</dd></>}</For>
          </dl>
          <div class="sync-actions">
            <Btn variant="primary" size="sm" icon="i-sync">Sync now</Btn>
            <Btn variant="secondary" size="sm">View remote objects</Btn>
          </div>
        </Card>
      </section>

      <section class="mt-5 rise rise-3">
        <Card title="Sync Settings">
          <div class="setting-list">
            <For each={SETTINGS}>
              {(item) => (
                <div class="setting-row">
                  <div>
                    <div class="setting-title">{item.title}</div>
                    <div class="hint">{item.hint}</div>
                  </div>
                  <Toggle on={settings()[item.key]} onChange={(value) => setToggle(item.key, value)} />
                </div>
              )}
            </For>
          </div>
        </Card>
      </section>

      <section class="event-log rise rise-4" aria-label="Recent sync activity">
        <h3>Recent sync activity</h3>
        <For each={EVENTS}>
          {([kind, title, desc, time]) => (
            <div class="event-item">
              <span class={`ev-icon ${kind}`}><Icon name={kind === "conflict" ? "i-alert" : kind === "pull" ? "i-sync" : "i-arrow-right"} /></span>
              <span class="ev-desc"><strong>{title}</strong> {desc}</span>
              <span class="ev-time">{time}</span>
            </div>
          )}
        </For>
      </section>

      <section class="mt-5 rise rise-5">
        <Card title="Security">
          <div class="setting-list">
            <div class="setting-row"><div><div class="setting-title">Workspace key</div><div class="hint">v1 · last rotated 2026-05-10</div></div><Btn variant="secondary" size="sm">Rotate key</Btn></div>
            <div class="setting-row"><div><div class="setting-title">Devices</div><div class="hint">2 active, 1 revoked</div></div><A class="btn btn-ghost btn-sm" href="/devices">Manage devices</A></div>
          </div>
        </Card>
      </section>

      <section class="mt-5 rise rise-6">
        <Card title="What is synced">
          <div class="setting-list">
            <For each={SYNC_SCOPE}>
              {([label, desc, variant]) => (
                <div class="setting-row">
                  <span class="sync-scope-title"><Chip variant={variant}>{label}</Chip></span>
                  <span class="text-sm text-secondary">{desc}</span>
                </div>
              )}
            </For>
          </div>
          <div class="mt-4"><A class="text-sm text-accent" href="/security">Full security transparency →</A></div>
        </Card>
      </section>
    </>
  );
}
