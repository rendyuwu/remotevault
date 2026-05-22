import "./assets/tokens.css";
import "./assets/styles.css";
import { render } from "solid-js/web";
import { HashRouter } from "@solidjs/router";
import { App } from "./App";
import { routes } from "./routes";

render(
  () => <HashRouter root={App}>{routes}</HashRouter>,
  document.getElementById("root")!,
);
