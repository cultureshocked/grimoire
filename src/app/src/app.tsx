import { Router, Route } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Nav from "~/components/Nav";
import Article from "./components/Article";
import Edit from "./components/Edit";
import Tag from "./components/Tag";
import Login from "./components/Login";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Nav />
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <Route path="/post/:slug" component={Article} />
      <Route path="/post/:slug/edit" component={Edit} />
      <Route path="/tag/:tag" component={Tag} />
      <Route path="/admin" component={Login} />
      <FileRoutes />
    </Router>
  );
}
