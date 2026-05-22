import { Route, Navigate } from "@solidjs/router";

const Stub = (props: { name: string }) => <div>{props.name}</div>;

function RootRedirect() {
  const hasLaunched = localStorage.getItem("rv:launched");
  if (!hasLaunched) {
    return <Navigate href="/welcome" />;
  }
  return <Navigate href="/connections" />;
}

export const routes = (
  <>
    <Route path="/" component={RootRedirect} />
    <Route path="/welcome" component={() => <Stub name="welcome" />} />
    <Route path="/provider-setup" component={() => <Stub name="provider-setup" />} />
    <Route path="/vault-create" component={() => <Stub name="vault-create" />} />
    <Route path="/vault-locked" component={() => <Stub name="vault-locked" />} />
    <Route path="/vault" component={() => <Stub name="vault" />} />
    <Route path="/vault-edit" component={() => <Stub name="vault-edit" />} />
    <Route path="/connections" component={() => <Stub name="connections" />} />
    <Route path="/connection-edit" component={() => <Stub name="connection-edit" />} />
    <Route path="/session" component={() => <Stub name="session" />} />
    <Route path="/sync" component={() => <Stub name="sync" />} />
    <Route path="/devices" component={() => <Stub name="devices" />} />
    <Route path="/security" component={() => <Stub name="security" />} />
    <Route path="/settings" component={() => <Stub name="settings" />} />
  </>
);
