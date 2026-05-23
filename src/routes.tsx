import { Route, Navigate } from "@solidjs/router";
import { ConnectionEditPage } from "./pages/ConnectionEditPage";
import { ConnectionsPage } from "./pages/ConnectionsPage";
import { ProviderSetupPage } from "./pages/ProviderSetupPage";
import { SessionPage } from "./pages/SessionPage";
import { VaultCreatePage } from "./pages/VaultCreatePage";
import { VaultLockedPage } from "./pages/VaultLockedPage";
import { VaultPage } from "./pages/VaultPage";
import { WelcomePage } from "./pages/WelcomePage";

const Stub = (props: { name: string }) => <div>{props.name}</div>;

function RootRedirect() {
  const hasLaunched = localStorage.getItem("rv:launched");
  if (!hasLaunched) {
    return <Navigate href="/welcome" />;
  }
  return <Navigate href="/connections" />;
}

export function routes() {
  return (
    <>
      <Route path="/" component={RootRedirect} />
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/provider-setup" component={ProviderSetupPage} />
      <Route path="/vault-create" component={VaultCreatePage} />
      <Route path="/vault-locked" component={VaultLockedPage} />
      <Route path="/vault" component={VaultPage} />
      <Route path="/connections" component={ConnectionsPage} />
      <Route path="/connection-edit" component={ConnectionEditPage} />
      <Route path="/session" component={SessionPage} />
      <Route path="/sync" component={() => <Stub name="sync" />} />
      <Route path="/devices" component={() => <Stub name="devices" />} />
      <Route path="/security" component={() => <Stub name="security" />} />
      <Route path="/settings" component={() => <Stub name="settings" />} />
    </>
  );
}
