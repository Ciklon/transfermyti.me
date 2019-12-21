import "whatwg-fetch";
import "react-virtualized/styles.css";
import "react-sweet-progress/lib/style.css";
import "rsuite/dist/styles/rsuite-default.min.css";
import "./styles.css";
import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { createBrowserHistory } from "history";
import Routes from "./Routes";
import { configureStore } from "./redux/configureStore";
import { initInterceptor } from "./utils/httpInterceptor";

const history = createBrowserHistory();
const store = configureStore(history);

initInterceptor(store);

render(
  <Provider store={store}>
    <Routes history={history} />
  </Provider>,
  document.getElementById("root"),
);
