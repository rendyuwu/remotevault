import { createContext, useContext, createSignal, type JSX, type Accessor } from "solid-js";

interface TopbarContextValue {
  topbar: Accessor<JSX.Element>;
  setTopbar: (content: JSX.Element) => void;
}

const Ctx = createContext<TopbarContextValue>();

export function TopbarProvider(props: { children: JSX.Element }) {
  const [topbar, setTopbar] = createSignal<JSX.Element>(null);
  return <Ctx.Provider value={{ topbar, setTopbar }}>{props.children}</Ctx.Provider>;
}

export function useTopbar() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTopbar: missing TopbarProvider");
  return ctx;
}
