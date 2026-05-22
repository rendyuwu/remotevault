import "./assets/fonts.css";
import "./assets/tokens.css";
import "./assets/base.css";
import "./assets/components.css";
import "./assets/pages.css";
import "./assets/utilities.css";
import { render } from "solid-js/web";
import { HashRouter } from "@solidjs/router";
import { App } from "./App";
import { routes } from "./routes";

render(
  () => <HashRouter root={App}>{routes}</HashRouter>,
  document.getElementById("root")!,
);
