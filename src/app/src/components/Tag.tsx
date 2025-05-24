import { A, useParams } from "@solidjs/router";
import Counter from "~/components/Counter";
import { onMount, createSignal, createResource, createEffect } from "solid-js";
import { get_index_data, getSession, tag_filter } from "~/lib/server_functions";
import TagList from "~/components/TagList";
import PostList from "~/components/PostList";
import { MetaProvider, Title } from "@solidjs/meta";

export default function Home() {
  const params = useParams();
  const fetchPosts = async () => {
    return await tag_filter(params.tag);
  }
  const [posts, setPosts] = createSignal(null);
  const [tags, setTags] = createSignal(null);
  const [sess, setSess] = createSignal(null);
  const [activeTag] = createResource(() => params.tag, fetchPosts);

  onMount(async () => {
    const data = await get_index_data();
    const posts_by_tag = await tag_filter(params.tag);
    setTags(data[1]);
    const user = await getSession();
    setSess(user);
  });

  createEffect(async () => {
    setPosts(activeTag());
  });

  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <MetaProvider>
        <Title>Grimoire • Incantations tagged with {params.tag}</Title>
      </MetaProvider>
      <h1 class="max-6-xs text-6xl text-zinc-400 font-thin uppercase my-16">THE GRIMOIRE</h1>
      <br></br>
      <Show when={sess() !== null} fallback={<br></br>}>
        {(sess().userId != 0) ?
          <span class="text-lime-300">Logged in</span> : <span class="text-red-400">Not logged in</span> 
        }
      </Show>
      <br></br>
      <div class="flex gap-4 justify-center">
        <Show when={tags()} fallback={"Loading tags..."}>
          <TagList tags={tags()} active={params.tag}/>
        </Show>
        <Show when={posts()} fallback={"Loading posts..."}>
          <PostList posts={posts()} />
        </Show>

        
      </div>
    </main>
  );
}
