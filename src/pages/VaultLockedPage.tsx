import { createSignal, onMount, Show } from "solid-js";
import { Icon } from "../components/Icon";

export function VaultLockedPage() {
  onMount(() => localStorage.setItem("rv:vaultLocked", "1"));
  const [showPassphrase, setShowPassphrase] = createSignal(false);
  const [showError, setShowError] = createSignal(false);

  const unlock = (event: SubmitEvent) => {
    event.preventDefault();
    setShowError(true);
  };

  return (
    <div class="lock-stage">
      <div class="lock-icon rise rise-1">
        <Icon name="i-lock" />
      </div>
      <h2 class="lock-title rise rise-2">Vault is locked</h2>
      <p class="lock-sub rise rise-2">
        Enter your master passphrase to decrypt secrets and use Vault items in connections.
      </p>

      <form class="unlock-form rise rise-3" onSubmit={unlock}>
        <div class="unlock-input-wrap">
          <input
            class="input"
            type={showPassphrase() ? "text" : "password"}
            placeholder="Master passphrase..."
            aria-label="Master passphrase"
            autofocus
          />
          <button
            class="toggle-vis"
            type="button"
            aria-label="Toggle master passphrase visibility"
            onClick={() => setShowPassphrase((visible) => !visible)}
          >
            <Icon name={showPassphrase() ? "i-eye" : "i-eye-off"} />
          </button>
        </div>

        <Show when={showError()}>
          <div class="error-msg">
            <Icon name="i-alert" />
            <span>Wrong passphrase. Vault remains locked.</span>
          </div>
        </Show>

        <button class="btn btn-primary btn-lg btn-block" type="submit">
          Unlock Vault
        </button>
      </form>

      <div class="lock-meta rise rise-4">
        <span>4 items encrypted · last unlocked 2h ago</span>
        <span class="chip chip-encrypted chip-mono">XChaCha20-Poly1305</span>
      </div>
    </div>
  );
}
