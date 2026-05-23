import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import { Banner } from "../components/Banner";
import { FormField } from "../components/FormField";
import { Icon } from "../components/Icon";
import { Steps } from "../components/Steps";

type Provider = "local" | "s3";

type ProviderOption = {
  id: Provider;
  icon: string;
  title: string;
  body: string;
  tags: string[];
};

const providerOptions: ProviderOption[] = [
  {
    id: "local",
    icon: "i-folder",
    title: "Local Folder",
    body: "Sync via a folder you already share with Syncthing, iCloud Drive, Dropbox, or rclone.",
    tags: ["syncthing", "icloud", "dropbox"],
  },
  {
    id: "s3",
    icon: "i-cloud",
    title: "S3-Compatible",
    body: "AWS S3, Cloudflare R2, Backblaze B2, MinIO, Wasabi, or any S3-compatible endpoint.",
    tags: ["aws", "r2", "b2", "minio"],
  },
];

const workspaceModes = ["Create new workspace", "Open existing workspace"];
const s3Presets = ["AWS S3", "Cloudflare R2", "Backblaze B2", "MinIO", "Custom"];

export function ProviderSetupPage() {
  const [provider, setProvider] = createSignal<Provider>("local");
  const [workspaceMode, setWorkspaceMode] = createSignal(workspaceModes[0]);
  const [s3Preset, setS3Preset] = createSignal(s3Presets[0]);
  const [pathStyle, setPathStyle] = createSignal(false);

  return (
    <div class="stage stage-wide">
      <div class="rise rise-1">
        <Steps steps={["done", "current", "upcoming"]} label="Step 2 of 3 — Choose storage" />
      </div>

      <header class="mb-6 rise rise-1">
        <p class="eyebrow">Storage Provider</p>
        <h1 class="page-title">Where should encrypted data sync?</h1>
        <p class="page-subtitle">
          Pick a provider. All data is encrypted on your device before upload. The provider only stores ciphertext.
        </p>
      </header>

      <div class="provider-grid rise rise-2" role="radiogroup" aria-label="Storage Provider">
        <For each={providerOptions}>
          {(option) => (
            <button
              type="button"
              role="radio"
              aria-checked={provider() === option.id}
              class={`provider-card${provider() === option.id ? " selected" : ""}`}
              onClick={() => setProvider(option.id)}
            >
              <span class="provider-radio" aria-hidden="true" />
              <span class="p-icon">
                <Icon name={option.icon} size="sm" />
              </span>
              <span class="provider-title">{option.title}</span>
              <span class="provider-copy">{option.body}</span>
              <span class="tags">
                <For each={option.tags}>{(tag) => <span class="tag">{tag}</span>}</For>
              </span>
            </button>
          )}
        </For>
      </div>

      <Show when={provider() === "local"}>
        <section class="config-section rise rise-3" id="config-local">
          <h3>
            <span class="step-num">1</span>
            Configure Local Folder
          </h3>
          <div class="form-grid">
            <FormField
              label="Folder path"
              id="folder-path"
              required
              hint="Choose an empty folder or an existing RemoteVault sync folder."
            >
              {(field) => (
                <div class="input-group">
                  <input
                    class="input mono"
                    id={field.id}
                    aria-describedby={field.describedBy}
                    type="text"
                    value="/Users/simon/Sync/remotevault"
                    placeholder="/path/to/sync/folder"
                  />
                  <button type="button" class="input-affix input-action">Browse</button>
                </div>
              )}
            </FormField>

            <div class="field">
              <span class="label" id="workspace-mode-label">Workspace mode</span>
              <div class="preset-row" role="radiogroup" aria-labelledby="workspace-mode-label">
                <For each={workspaceModes}>
                  {(mode) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={workspaceMode() === mode}
                      class={`preset${workspaceMode() === mode ? " active" : ""}`}
                      onClick={() => setWorkspaceMode(mode)}
                    >
                      {mode}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>

          <div class="validation validation-success">
            <Icon name="i-check" size="xs" />
            <span>Folder exists, writable, no existing workspace found. Ready to initialize.</span>
          </div>
        </section>
      </Show>

      <Show when={provider() === "s3"}>
        <section class="config-section rise rise-3" id="config-s3">
          <h3>
            <span class="step-num">1</span>
            Configure S3-Compatible Storage
          </h3>

          <div class="form-grid">
            <div class="field">
              <span class="label" id="s3-preset-label">Provider preset</span>
              <div class="preset-row" role="radiogroup" aria-labelledby="s3-preset-label">
                <For each={s3Presets}>
                  {(preset) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={s3Preset() === preset}
                      class={`preset${s3Preset() === preset ? " active" : ""}`}
                      onClick={() => setS3Preset(preset)}
                    >
                      {preset}
                    </button>
                  )}
                </For>
              </div>
            </div>

            <div class="field-row">
              <FormField label="Endpoint URL" id="s3-endpoint" required>
                {(field) => (
                  <input class="input mono" id={field.id} type="text" placeholder="https://s3.us-east-1.amazonaws.com" />
                )}
              </FormField>
              <FormField label="Region" id="s3-region">
                {(field) => <input class="input mono" id={field.id} type="text" placeholder="us-east-1" />}
              </FormField>
            </div>

            <FormField label="Bucket" id="s3-bucket" required>
              {(field) => <input class="input mono" id={field.id} type="text" placeholder="my-remotevault-sync" />}
            </FormField>

            <FormField label="Prefix" id="s3-prefix" hint="Optional path prefix inside the bucket. Useful for shared buckets.">
              {(field) => (
                <div class="input-group">
                  <span class="input-affix">/</span>
                  <input
                    class="input mono"
                    id={field.id}
                    aria-describedby={field.describedBy}
                    type="text"
                    placeholder="remotevault/v1/"
                  />
                </div>
              )}
            </FormField>

            <div class="field-row">
              <FormField label="Access Key" id="s3-access-key" required>
                {(field) => <input class="input mono" id={field.id} type="text" placeholder="AKIA..." />}
              </FormField>
              <FormField label="Secret Key" id="s3-secret-key" required>
                {(field) => <input class="input mono" id={field.id} type="password" placeholder="••••••••••••••••" />}
              </FormField>
            </div>

            <div class="field">
              <button
                type="button"
                role="switch"
                aria-checked={pathStyle()}
                class={`toggle${pathStyle() ? " on" : ""}`}
                onClick={() => setPathStyle(!pathStyle())}
              >
                <span class="toggle-track" />
                <span class="text-sm">Use path-style addressing</span>
              </button>
              <span class="hint">Enable for MinIO or providers that don't support virtual-hosted style.</span>
            </div>
          </div>

          <div class="validation validation-pending">
            <Icon name="i-info" size="xs" />
            <span>Testing bucket access... checking write + list permissions.</span>
          </div>

          <div class="mt-4">
            <button type="button" class="btn btn-secondary btn-sm">Test connection</button>
          </div>
        </section>
      </Show>

      <div class="rise rise-4">
        <Banner variant="accent" icon="i-shield" title="Zero-knowledge sync">
          Your storage provider receives only encrypted blobs. It cannot decrypt your Vault items, passwords, private keys, or connection details.
        </Banner>
      </div>

      <div class="footer-actions rise rise-5">
        <A class="btn btn-ghost" href="/welcome">← Back</A>
        <A class="btn btn-primary btn-lg" href="/vault-create">
          Continue to Vault setup
          <Icon name="i-arrow-right" size="xs" />
        </A>
      </div>
    </div>
  );
}
