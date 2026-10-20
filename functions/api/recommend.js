export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt : "";

    if (!prompt || prompt.length > 18000) {
      return Response.json({ error: "درخواست نامعتبر است؛ دوباره امتحان کن." }, { status: 400 });
    }
    if (!env.AI) {
      return Response.json(
        { error: "سرویس هوش مصنوعی هنوز توسط مدیر سایت فعال نشده است." },
        { status: 503 }
      );
    }

    const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
      prompt:
        "Follow the user's instructions exactly. If they request JSON only, return valid JSON only, without Markdown fences or extra commentary.\n\n" +
        prompt,
            max_tokens: 3000,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const answer =
  typeof result === "string"
    ? result
    : typeof result?.response === "string"
      ? result.response
      : result?.response != null
        ? JSON.stringify(result.response)
        : result?.output != null
          ? JSON.stringify(result.output)
          : "";
    if (typeof answer !== "string" || !answer.trim()) {
      return Response.json({ error: "پاسخی دریافت نشد؛ دوباره امتحان کن." }, { status: 502 });
    }
    return Response.json({ response: answer });
  } catch (error) {
  console.error("Book recommendation API error:", error);

  return Response.json(
    { error: "سرویس پیشنهاد کتاب موقتاً در دسترس نیست؛ کمی بعد دوباره امتحان کن." },
    { status: 500 }
  );
  }
}
