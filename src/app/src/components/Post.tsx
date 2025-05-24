import { A } from "@solidjs/router";

const truncate = (mystr) => mystr.split(" ").splice(0, 15).join(" ");
const timestampToDateString = (ts) => {
  const d = new Date(ts * 1000);
  return d.toString().split(" ").splice(1, 3).join(" ");
}

const Post = (props) => {
  return <div class="p-4 hover:bg-zinc-900 duration-300 overflow-hidden">
    <div class="flex justify-between">
      <A href={"/post/" + props.post.slug}><h3 class="text-xl font-bold text-white">{props.post.title}</h3></A>
      <h4 class="text-zinc-600">{timestampToDateString(props.post.date)}</h4>
    </div>
    <div class="text-left text-zinc-500">
      {truncate(props.post.body)}
    </div>
  </div>
}

export default Post;
