import { Route, Navigate } from "@solidjs/router";
import { ConnectionsPage } from "./pages/ConnectionsPage";
import { ProviderSetupPage } from "./pages/ProviderSetupPage";
import { DevicesPage } from "./pages/DevicesPage";
import { SecurityPage } from "./pages/SecurityPage";
import { SessionPage } from "./pages/SessionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SyncPage } from "./pages/SyncPage";
import { VaultCreatePage } from "./pages/VaultCreatePage";
import { VaultLockedPage } from "./pages/VaultLockedPage";
import { VaultPage } from "./pages/VaultPage";
import { WelcomePage } from "./pages/WelcomePage";

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
      <Route path="/session" component={SessionPage} />
      <Route path="/sync" component={SyncPage} />
      <Route path="/devices" component={DevicesPage} />
      <Route path="/security" component={SecurityPage} />
      <Route path="/settings" component={SettingsPage} />
    </>
  );
}
