import "whatwg-fetch";
import { createBrowserHistory } from "history";
import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
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
  document.getElementById("app"),
);
