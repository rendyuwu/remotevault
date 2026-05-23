import { A } from "@solidjs/router";
import { For, createSignal } from "solid-js";
import { Icon } from "../components/Icon";

const localBenefits = [
  "Works offline forever",
  "Encrypted Vault stored locally",
  "Enable sync any time later",
];

const syncBenefits = [
  "Encrypted before it leaves your device",
  "Local Folder, S3, R2, B2, MinIO",
  "Storage provider can't decrypt anything",
];

function BenefitList(props: { items: string[] }) {
  return (
    <ul class="welcome-benefits">
      <For each={props.items}>
        {(item) => (
          <li>
            <Icon name="i-check" size="xs" />
            <span>{item}</span>
          </li>
        )}
      </For>
    </ul>
  );
}

export function WelcomePage() {
  const [setupMode, setSetupMode] = createSignal<"local" | "sync">("sync");
  const continueHref = () => setupMode() === "local" ? "/vault-create" : "/provider-setup";

  return (
    <main class="stage stage-wide">
      <header class="welcome-hero rise rise-1">
        <span class="welcome-brand-pill">
          <span class="welcome-brand-mark">RV</span>
          <span>RemoteVault · v0.1.0 · open source</span>
        </span>

        <h1 class="welcome-title">
          Your servers, your secrets,
          <br />
          <span class="accent">your storage.</span>
        </h1>

        <p class="welcome-sub">
          A local-first SSH and RDP manager with an encrypted Vault. Sync through storage you already control — or skip
          sync entirely.
        </p>
      </header>

      <section class="choice-grid" aria-label="Setup options">
        <button
          class={`choice rise rise-2${setupMode() === "local" ? " selected" : ""}`}
          type="button"
          aria-pressed={setupMode() === "local"}
          onClick={() => setSetupMode("local")}
        >
          <div class="choice-icon">
            <Icon name="i-laptop" size="sm" />
          </div>
          <h2>Use locally only</h2>
          <p>Everything stays on this device. No account, no servers, no cloud.</p>
          <BenefitList items={localBenefits} />
        </button>

        <button
          class={`choice rise rise-3${setupMode() === "sync" ? " selected" : ""}`}
          type="button"
          aria-pressed={setupMode() === "sync"}
          onClick={() => setSetupMode("sync")}
        >
          <div class="choice-icon">
            <Icon name="i-cloud" size="sm" />
          </div>
          <h2>Sync with my own storage</h2>
          <p>Bring a folder, S3 bucket, or compatible storage. We never see your data.</p>
          <BenefitList items={syncBenefits} />
        </button>
      </section>

      <div class="welcome-action-row rise rise-4">
        <A class="btn btn-primary btn-lg" href={continueHref()}>
          Continue
          <Icon name="i-arrow-right" size="xs" />
        </A>
      </div>

      <p class="welcome-foot rise rise-5">
        <Icon name="i-shield" size="xs" />
        <span>SSH/RDP sessions always connect direct.</span>
        <span>·</span>
        <A href="/security">Read the security model</A>
      </p>
    </main>
  );
}
