import { createSignal, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { ArticleType } from "~/types";
import { marked } from "marked";
import { get_article_data } from "~/lib/server_functions";
import { MetaProvider, Title } from "@solidjs/meta";
import TagBadge from "~/components/TagBadge";


const Article = () => {
  const [article, setArticle] = createSignal<ArticleType>(null);
  const [tags, setTags] = createSignal<ArticleType>(null);
  const [body, setBody] = createSignal<string>(null);
  const params = useParams();

  const render_options = {
    heading({text, depth}) {
      console.log("Invoking header styler");
      console.log(text, depth);
      const size = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-md"];
      return `<h${depth} class="${size[depth-1]} font-semibold text-zinc-200 p-2">${text}</h${depth}>`
    },
    paragraph({text}) {
      return `<p class="text-lg p-4 text-zinc-400 pb-8">${text}</p>`;
    }
  }

  onMount(async () => {
    const data = await get_article_data(params.slug);
    console.log(data);
    setArticle(data[0]);
    setTags(data[1]);
    
    marked.use({renderer: render_options});
    const html = await marked.parse(article().body);
    console.log(html);
    setBody(html);
  });
  
  return <main class="text-center mx-auto text-gray-700 p-4">
    <MetaProvider>
      <Title>Grimoire • {(article()) ? article().title : params.slug}</Title>
    </MetaProvider>
    <Show when={body()} fallback={"Loading article"}>
      <div class="mx-auto w-4xl">
      <h1 class="max-6-xs text-6xl text-zinc-400 font-thin uppercase my-16 text-center">{article().title}</h1>
      <h2 class="max-6-xs text-2xl text-zinc-400 font-thin uppercase my-4 text-center">Tags:</h2>
        <div class="flex gap-2 justify-center">
          <For each={tags()}>{(n, idx) => <TagBadge slug={n} />}</For>
        </div>
        <div class="text-left my-16 mx-auto w-4xl prose text-lg text-zinc-100" innerHTML={body()}></div>
      </div>
    </Show>
  </main>
}

export default Article;
