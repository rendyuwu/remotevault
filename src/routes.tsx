import { Route, Navigate } from "@solidjs/router";
import { ProviderSetupPage } from "./pages/ProviderSetupPage";
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
      <Route path="/connections" component={() => <Stub name="connections" />} />
      <Route path="/connection-edit" component={() => <Stub name="connection-edit" />} />
      <Route path="/session" component={() => <Stub name="session" />} />
      <Route path="/sync" component={() => <Stub name="sync" />} />
      <Route path="/devices" component={() => <Stub name="devices" />} />
      <Route path="/security" component={() => <Stub name="security" />} />
      <Route path="/settings" component={() => <Stub name="settings" />} />
    </>
  );
}
