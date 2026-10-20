export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";

    if (!prompt || prompt.length > 18000) {
      return Response.json({ error: "Invalid prompt" }, { status: 400 });
    }
    if (!env.AI) {
      return Response.json(
        { error: "AI binding is missing. Add a Workers AI binding named AI in Cloudflare Pages settings." },
        { status: 503 }
      );
    }

    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt:
        "Follow the user's instructions exactly. If they request JSON only, return valid JSON only, without Markdown fences or extra commentary.\\n\\n" +
        prompt,
      max_tokens: 3000
    });

    const answer = typeof result === "string" ? result : result?.response;
    if (typeof answer !== "string" || !answer.trim()) {
      return Response.json({ error: "The AI model returned an empty response." }, { status: 502 });
    }
    return Response.json({ response: answer });
  } catch (error) {
    return Response.json(
      { error: "AI request failed", detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}
