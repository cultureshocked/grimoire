import { redirect, query } from "@solidjs/router";
import { useSession } from "vinxi/http"

const getSessionMin = async () => {
  "use server";
  const s = await useSession({password: "pwreallylongpwstringpwpwpwpwpwpwpwpwpw"});
}

type userData = {
  userId: number
}

const getSession = async () => {
  "use server";
  const s = await getRawSession();

  if (s.data == null || s.data == undefined || Object.keys(s.data).length == 0){
    await s.update({userId: 0});
  }
  return s.data;
}

const getRawSession = async () => {
  "use server";
  const s = await useSession<userData>({
    password: import.meta.env.VITE_SESSION_KEY ?? "youshouldconsidersettingupasessionsecret",
    name: "user",
  });
  return s;
}

const get_article_data = async (slug) => {
  "use server";
  const res_post = await fetch("http://127.0.0.1:8080/posts/by-slug/" + slug)
  const text_post = await res_post.text();

  const res_tags = await fetch("http://127.0.0.1:8080/posts/tags/" + slug)
  const text_tags = await res_tags.text();
  return [JSON.parse(text_post), JSON.parse(text_tags)];
}

async function get_index_data() {
    "use server";
    const posts_res = await fetch("http://127.0.0.1:8080/posts");
    const posts_body = await posts_res.text();
    const post_data = JSON.parse(posts_body);

    const tags_res = await fetch("http://127.0.0.1:8080/tags");
    const tags_body = await tags_res.text();
    const tag_data = JSON.parse(tags_body);
    
    return [post_data, tag_data];
  }

const populate_edit = async (slug) => {
  "use server";
  if (!(await isLoggedIn())) {
    throw redirect("/posts/" + slug);
  }
  const res_post = await fetch("http://127.0.0.1:8080/posts/by-slug/" + slug)
  const text_post = await res_post.text();

  const res_tags = await fetch("http://127.0.0.1:8080/posts/tags/" + slug)
  const text_tags = await res_tags.text();
  return [JSON.parse(text_post), JSON.parse(text_tags)];
}

async function isLoggedIn() {
  "use server";
  const user = await getSession();
  return user.userId != 0;
};

const handleLoginRender = query(async function() {
  const cond = await isLoggedIn();
  if (cond) {
    throw redirect("/");
  }
  return true;
});

const getUser = query(async () => {
  "use server";
  const user = await getSession();
  return user.userId;
})

const populate_edit_as_query = query(async function(slug) {
  "use server";
  if (!(await isLoggedIn())) {
    throw redirect("/post/" + slug);
  }
  const res_post = await fetch("http://127.0.0.1:8080/posts/by-slug/" + slug)
  const text_post = await res_post.text();

  const res_tags = await fetch("http://127.0.0.1:8080/posts/tags/" + slug)
  const text_tags = await res_tags.text();
  return [JSON.parse(text_post), JSON.parse(text_tags)];
});

const update_edit = async (new_data) => {
  "use server";
  const options = {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(new_data)
  };
  const new_slug = await fetch("http://127.0.0.1:8080/posts/update", options);
}

const tag_filter = async (tag) => {
  "use server";
  const res = await fetch("http://127.0.0.1:8080/posts/by-tag/" + tag);
  const body = await res.text();
  return JSON.parse(body)
}

const login = async (data) => {
  "use server";
  const api_data = JSON.stringify({username: data.username, password: data.password});
  const fetch_config = {
    method: "POST",
    body: api_data,
  };
  const res = await fetch("http://127.0.0.1:8080/auth", fetch_config);
  const user = parseInt(await res.text());
  if (user == 0) {
    throw redirect("/");
  }
  const session = await getRawSession();
  await session.update(d => {
    d.userId = user;
  });
  throw redirect("/");
}

const logout = async () => {
  "use server";
  const session = await getSession();
  session.clear();
  throw redirect("/");
}

export { get_article_data, get_index_data, populate_edit, update_edit, tag_filter, login, logout, getSessionMin, getSession, populate_edit_as_query, isLoggedIn, handleLoginRender };
