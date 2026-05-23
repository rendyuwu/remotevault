import { For } from "solid-js";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { TopbarTitle } from "../components/Topbar";

const CARDS = [
  ["i-lock", "Encrypted before sync", "success", ["Passwords and private keys", "Private key passphrases", "Generic secrets and notes", "Connection hostnames and usernames", "Connection notes and tags", "Vault item names and values", "Workspace key wrapped with KEK"]],
  ["i-cloud", "Visible to storage provider", "warning", ["Workspace ID", "Device IDs", "Event IDs and timestamps", "Object paths and sizes", "KDF parameters", "Record kind in standard mode"]],
  ["i-x", "Never sent to provider", "danger", ["Master passphrase", "Derived encryption keys", "Decrypted workspace key", "Plaintext secret values", "SSH/RDP session traffic"]],
  ["i-key", "Crypto primitives", "info", ["KDF: Argon2id (64 MiB, 3 iter, 4 par)", "AEAD: XChaCha20-Poly1305", "Random nonce per operation", "Envelope encryption", "No custom cryptography"]],
] as const;

const STATUS = [
  ["Local data location", "~/.remotevault/personal.db"],
  ["Sync enabled", "Yes — S3 (R2)"],
  ["Privacy mode", "Standard"],
  ["Vault secrets synced", "Yes (encrypted)"],
  ["Registered devices", "2 active, 1 revoked"],
  ["Workspace key version", "v1 (rotated 2026-05-10)"],
  ["Storage credentials", "OS keychain (S3 access key + secret)"],
];

const FAQ = [
  ["What happens if I forget my passphrase?", "Encrypted data cannot be recovered. No server, storage provider, or support team can reset it."],
  ["Can my storage provider read my secrets?", "No. Your provider only stores encrypted blobs. Without your passphrase and keys, ciphertext is meaningless."],
  ["Do SSH/RDP sessions go through the storage provider?", "Never. Sessions connect directly from your device to the target host."],
  ["What does device revocation do?", "It rotates the workspace key and re-encrypts active records. Revoked devices cannot decrypt future data."],
  ["Is a weak passphrase safe?", "Argon2id makes brute-force expensive, but passphrase strength remains the primary defense."],
];

export function SecurityPage() {
  return (
    <>
      <TopbarTitle title="Security & Transparency" />

      <header class="page-header rise rise-1">
        <div>
          <p class="eyebrow">Zero-Knowledge Architecture</p>
          <h1 class="page-title">How RemoteVault protects your data</h1>
          <p class="page-subtitle">What is encrypted, what is stored, and what your storage provider can see.</p>
        </div>
      </header>

      <section class="arch-flow rise rise-2" aria-label="Architecture diagram">
        <div class="arch-box">
          <div class="arch-box-title">Your Device</div>
          <div class="arch-step"><span>Passphrase</span><span>→</span><strong>Argon2id</strong><span>→</span><span>KEK</span><span>→</span><strong>Workspace Key</strong></div>
          <div class="arch-step"><span>Vault items, connections, events</span><span>→</span><strong>XChaCha20-Poly1305</strong></div>
          <div class="arch-detail">SSH/RDP sessions connect direct to target host.</div>
        </div>
        <div class="arch-connector"><span>↓</span><span>encrypted blobs only</span></div>
        <div class="arch-box">
          <div class="arch-box-title">Storage Provider</div>
          <div class="arch-detail">Sees: ciphertext, event IDs, timestamps, device IDs</div>
          <div class="arch-detail danger">Cannot see: passwords, keys, hostnames, usernames, notes</div>
        </div>
      </section>

      <section class="security-grid" aria-label="Encryption details">
        <For each={CARDS}>
          {([icon, title, variant, items], index) => (
            <div class={`sec-card rise rise-${index() < 2 ? 3 : 4}`}>
              <h4><Icon name={icon} />{title}</h4>
              <ul><For each={items}>{(item) => <li><Icon name={variant === "danger" ? "i-x" : variant === "warning" ? "i-alert" : "i-check"} class={`mark ${variant}`} />{item}</li>}</For></ul>
            </div>
          )}
        </For>
      </section>

      <section class="rise rise-5">
        <Card title="Your Workspace Status">
          <div class="setting-list"><For each={STATUS}>{([label, value]) => <div class="setting-row"><span class="text-sm text-secondary">{label}</span><Chip variant={label.includes("synced") ? "encrypted" : "mono"}>{value}</Chip></div>}</For></div>
        </Card>
      </section>

      <section class="mt-5 rise rise-6">
        <Card title="Common Questions">
          <For each={FAQ}>{([question, answer]) => <div class="faq-item"><h4>{question}</h4><p>{answer}</p></div>}</For>
        </Card>
      </section>
    </>
  );
}
