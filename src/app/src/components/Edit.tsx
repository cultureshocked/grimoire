import { useParams, createAsync } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import { populate_edit, update_edit, populate_edit_as_query } from "~/lib/server_functions"

const Edit = () => {
  const [article, setArticle] = createSignal<ArticleType>(null);
  const [tags, setTags] = createSignal<ArticleType>(null);
  const [body, setBody] = createSignal(null);
  const [title, setTitle] = createSignal(null);

  const params = useParams();
  const all_data = createAsync(() => {return populate_edit_as_query(params.slug)});

  onMount(async () => {
    await new Promise(r => setTimeout(r, 50));
    console.log(all_data);
    setArticle(all_data()[0]);
    setTitle(article().title);
    setBody(article().body);
    setTags(all_data()[1]);
  });

  const onBodyChange = (e) => setBody(e.target.value);
  const onTitleChange = (e) => setTitle(e.target.value);
  const onTagsChange = (e) => setTags(e.target.value.split(" "));

  const submitHandler = (e) => {
    setArticle({
      id: article().id,
      title: title(),
      body: body(),
      deleted: article().deleted,
      slug: article().slug
    });

    const data = {
      p: article(),
      t: tags()
    };

    console.log(JSON.stringify(data));

    update_edit(data);
  }

  return (
    <Show when={tags()} fallback={"Loading content..."}>
      <div>
        <label>Title:</label>
        <input class="border" type="text" value={title()} onChange={onTitleChange}/>
        <br></br>
        <label>Body:</label>
        <textarea class="border" onChange={onBodyChange}>{body()}</textarea>
        <br></br>
        <label>Tags (space-separated):</label>
        <input class="border" type="text" value={tags().join(" ")} onChange = {onTagsChange}/>
        <br></br>
        <button class="border" onClick={submitHandler}>Submit</button>
      </div>
    </Show>
  )
}

export default Edit;
