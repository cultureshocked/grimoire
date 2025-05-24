import { createAsync, redirect, action, useAction } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { handleLoginRender, login } from "~/lib/server_functions";

const loginAction = action(async (data) => {
  const login_data = {
    username: data.get('username'),
    password: data.get('password'),
  }
  login(login_data);
  throw redirect("/");
}, "login-action");

const Login = () => {
  const authStatus = createAsync(() => handleLoginRender());
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  const handleUserUpdate = (e) => setUsername(e.target.value);
  const handlePassUpdate = (e) => setPassword(e.target.value);

  return <Show when={authStatus() != undefined } fallback={"Checking auth status..."}>
    <form action={loginAction} method="POST">
      <label>Username:</label>
      <input class="border" type="text" onChange={handleUserUpdate} name="username"/>
      <br></br>
      <label>Password:</label>
      <input class="border" type="password" onChange={handlePassUpdate} name="password"/>
      <button class="border" type="submit">Login</button>
    </form>
  </Show>
}

export default Login;
