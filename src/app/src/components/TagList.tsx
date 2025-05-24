import TagBadge from "~/components/TagBadge";

const TagList = (props) => {
  return (
    <div class="max-w-sm border-1 border-zinc-700 rounded-xl pt-2 shadow-xl shadow-zinc-900">
      <h2 class="text-2xl font-medium text-white p-4"> Filter by Tag:</h2>
      <div class="flex justify-center"><div class="h-0 border-t-1 border-zinc-700 w-9/10"></div></div>
      <div class="flex flex-wrap gap-2 p-4">
      <For each={props.tags}>
        {(n, idx) => <TagBadge slug={n.name} active={n.name == props.active}/>}
      </For>
      </div>
    </div>
  )
}

export default TagList;
