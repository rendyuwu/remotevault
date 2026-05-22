import { For } from "solid-js";
import { Modal } from "./Modal";
import { Btn } from "./Btn";

interface VersionField {
  label: string;
  value: string;
  changed?: boolean;
}

interface ConflictVersion {
  header: string;
  fields: VersionField[];
}

interface ConflictModalProps {
  open: boolean;
  onClose: () => void;
  local: ConflictVersion;
  remote: ConflictVersion;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
}

export function ConflictModal(props: ConflictModalProps) {
  return (
    <Modal open={props.open} onClose={props.onClose} class="conflict-modal">
      <h3 class="card-title">Sync Conflict</h3>
      <div class="conflict-versions">
        <VersionColumn version={props.local} />
        <VersionColumn version={props.remote} />
      </div>
      <div class="conflict-actions">
        <Btn variant="secondary" onClick={() => props.onKeepLocal()}>Keep Local</Btn>
        <Btn variant="primary" onClick={() => props.onKeepRemote()}>Keep Remote</Btn>
      </div>
    </Modal>
  );
}

function VersionColumn(props: { version: ConflictVersion }) {
  return (
    <div class="conflict-version">
      <div class="conflict-version-header">{props.version.header}</div>
      <For each={props.version.fields}>
        {(field) => (
          <div class="cv-field">
            <div class="cv-label">{field.label}</div>
            <div class={`cv-value${field.changed ? " cv-changed" : ""}`}>{field.value}</div>
          </div>
        )}
      </For>
    </div>
  );
}
