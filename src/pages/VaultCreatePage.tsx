import { A, useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { Steps } from "../components/Steps";
import { StrengthMeter } from "../components/StrengthMeter";

const DEFAULT_PASSPHRASE = "correct-horse-battery-staple-42";

const ENCRYPTION_DETAILS = [
  ["KDF", "Argon2id"],
  ["Memory", "64 MiB"],
  ["Iterations", "3"],
  ["Parallelism", "4"],
  ["Cipher", "XChaCha20-Poly1305"],
  ["Key wrap", "Envelope encryption (workspace key)"],
];

export function VaultCreatePage() {
  const navigate = useNavigate();
  const [showMaster, setShowMaster] = createSignal(false);
  const [showConfirm, setShowConfirm] = createSignal(false);

  const createWorkspace = () => {
    localStorage.setItem("rv:launched", "1");
    navigate("/connections");
  };

  return (
    <div class="stage">
      <div class="rise rise-1">
        <Steps steps={["done", "done", "current"]} label="Step 3 of 3 — Vault passphrase" />
      </div>

      <div class="vault-hero-icon rise rise-1">
        <Icon name="i-vault" />
      </div>

      <header class="mb-6 rise rise-2">
        <h1 class="page-title">Create your Vault passphrase</h1>
        <p class="page-subtitle">
          This passphrase encrypts all secrets in your workspace. It never leaves your device and cannot be recovered.
        </p>
      </header>

      <FormField label="Master passphrase" required>
        {(field) => (
          <div class="rise rise-3">
            <div class="passphrase-field">
              <input
                id={field.id}
                class="input"
                type={showMaster() ? "text" : "password"}
                placeholder="Enter a strong passphrase..."
                value={DEFAULT_PASSPHRASE}
              />
              <button
                class="toggle-vis"
                type="button"
                aria-label="Toggle master passphrase visibility"
                onClick={() => setShowMaster((visible) => !visible)}
              >
                <Icon name={showMaster() ? "i-eye" : "i-eye-off"} />
              </button>
            </div>
            <StrengthMeter strength="strong" hint="5+ words or 16+ characters recommended" />
          </div>
        )}
      </FormField>

      <div class="confirm-field rise rise-3">
        <FormField label="Confirm passphrase" required>
          {(field) => (
            <div class="passphrase-field">
              <input
                id={field.id}
                class="input"
                type={showConfirm() ? "text" : "password"}
                placeholder="Re-enter passphrase..."
                value={DEFAULT_PASSPHRASE}
              />
              <button
                class="toggle-vis"
                type="button"
                aria-label="Toggle confirm passphrase visibility"
                onClick={() => setShowConfirm((visible) => !visible)}
              >
                <Icon name={showConfirm() ? "i-eye" : "i-eye-off"} />
              </button>
            </div>
          )}
        </FormField>
      </div>

      <div class="warning-box rise rise-4">
        <Icon name="i-alert" />
        <div>
          <h4>No recovery possible</h4>
          <p>
            If you forget this passphrase, your encrypted Vault data cannot be recovered. No server, storage provider,
            or support team can reset it. Write it down and store it safely.
          </p>
        </div>
      </div>

      <details class="crypto-details rise rise-5">
        <summary>Encryption details</summary>
        <dl class="detail-grid">
          {ENCRYPTION_DETAILS.map(([label, value]) => (
            <>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </>
          ))}
        </dl>
      </details>

      <div class="footer-actions rise rise-5">
        <A class="btn btn-ghost" href="/provider-setup">
          ← Back
        </A>
        <button class="btn btn-primary btn-lg" type="button" onClick={createWorkspace}>
          Create workspace
          <Icon name="i-arrow-right" />
        </button>
      </div>
    </div>
  );
}
