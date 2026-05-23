import { For, createSignal } from "solid-js";
import { Banner } from "../components/Banner";
import { Btn } from "../components/Btn";
import { Card } from "../components/Card";
import { Chip } from "../components/Chip";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { TopbarTitle } from "../components/Topbar";

type DeviceState = "current" | "active" | "revoked";

const DEVICES: { name: string; icon: string; state: DeviceState; id: string; added: string; seen: string }[] = [
  { name: "Simon's MacBook Pro", icon: "i-laptop", state: "current", id: "dev_01abc...def", added: "Added 2026-05-15", seen: "Last seen: just now" },
  { name: "Desktop Workstation", icon: "i-monitor", state: "active", id: "dev_02ghi...jkl", added: "Added 2026-05-18", seen: "Last seen: 18 min ago" },
  { name: "Old Phone", icon: "i-phone", state: "revoked", id: "dev_03mno...pqr", added: "Added 2026-04-01", seen: "Revoked 2026-05-10" },
];

export function DevicesPage() {
  const [revokeOpen, setRevokeOpen] = createSignal(false);

  return (
    <>
      <TopbarTitle title="Devices" actions={<Chip variant="mono">Workspace key v1</Chip>} />

      <header class="page-header rise rise-1">
        <div>
          <h1 class="page-title">Registered Devices</h1>
          <p class="page-subtitle">Devices that have accessed this workspace. Revoke lost devices to rotate encryption keys.</p>
        </div>
      </header>

      <section aria-label="Registered devices">
        <For each={DEVICES}>
          {(device, index) => (
            <div class={`device-card ${device.state} rise rise-${index() + 2}`}>
              <div class="device-icon"><Icon name={device.icon} /></div>
              <div class="device-info">
                <h4>
                  {device.name}
                  {device.state === "current" && <Chip variant="accent">This device</Chip>}
                  {device.state === "revoked" && <Chip variant="danger">Revoked</Chip>}
                </h4>
                <div class="device-meta"><span>{device.id}</span><span>{device.added}</span><span>{device.seen}</span></div>
              </div>
              {device.state === "active" && <div class="device-actions"><Btn variant="danger" size="sm" onClick={() => setRevokeOpen(true)}>Revoke</Btn></div>}
            </div>
          )}
        </For>
      </section>

      <section class="mt-6 rise rise-5">
        <Card title="Key Rotation" actions={<Btn variant="secondary" size="sm">Rotate now</Btn>}>
          <p class="card-copy">
            Workspace key was last rotated on <strong class="text-mono">2026-05-10</strong> after revoking Old Phone.
            Active records were re-encrypted with workspace key v1. Revoked devices cannot decrypt data encrypted after rotation.
          </p>
        </Card>
      </section>

      <div class="mt-5 rise rise-5">
        <Banner variant="warning" icon="i-alert" title="Revocation limitations">
          Revoking a device prevents future decrypts after key rotation. It cannot erase data already downloaded or decrypted. If the device has storage provider credentials, revoke those separately.
        </Banner>
      </div>

      <Modal open={revokeOpen()} onClose={() => setRevokeOpen(false)} label="Revoke Device">
        <div class="modal-stack">
          <header><h2>Revoke Desktop Workstation?</h2><p>This rotates the workspace key and re-encrypts all active records.</p></header>
          <ul class="revoke-checklist">
            <li><Icon name="i-alert" />Data already downloaded by this device cannot be erased remotely.</li>
            <li><Icon name="i-alert" />If this device has S3 credentials, revoke those separately.</li>
            <li><Icon name="i-alert" />Key rotation may take a moment for large workspaces.</li>
          </ul>
          <footer class="modal-actions">
            <Btn variant="ghost" onClick={() => setRevokeOpen(false)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => setRevokeOpen(false)}>Revoke & rotate key</Btn>
          </footer>
        </div>
      </Modal>
    </>
  );
}
