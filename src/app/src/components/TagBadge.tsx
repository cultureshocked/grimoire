import { A } from "@solidjs/router";

const TagBadge = (props) => {
  return <A href={"/tag/" + props.slug}>
    <div class={`p-2 rounded-md font-medium text-gray-950 ${(props.active) ? "bg-green-300" : "bg-white"} text-sm hover:bg-zinc-200 duration-300`}>{props.slug}</div>
  </A>
}

export default TagBadge;
