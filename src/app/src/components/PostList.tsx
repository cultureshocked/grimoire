import Post from "~/components/Post.tsx";

const PostList = (props) => {
  return <div class="border-1 rounded-xl border-zinc-700 min-w-4xl pt-2 shadow-xl shadow-zinc-900 overflow-hidden">
    <h2 class="text-2xl text-white font-medium p-4">Incantations</h2>
    <div class="flex justify-center"><div class="h-0 border-t-1 border-zinc-700 w-9/10"></div></div>
    <div>
      <For each={props.posts}>
        {(n, idx) => <Post post={n} />}
      </For>
    </div>
  </div>
}

export default PostList;
