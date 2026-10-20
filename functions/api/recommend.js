
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

function extractJSON(text) {
  if (typeof text !== "string") return null;

  const cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {}

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }

  return null;
}

function getAnswer(result) {
  if (typeof result === "string") return result;

  if (typeof result?.response === "string") {
    return result.response;
  }

  if (result?.response && typeof result.response === "object") {
    return JSON.stringify(result.response);
  }

  if (typeof result?.output === "string") {
    return result.output;
  }

  if (result?.output && typeof result.output === "object") {
    return JSON.stringify(result.output);
  }

  return "";
}

function validResult(data) {
  return (
    data &&
    !Array.isArray(data) &&
    typeof data === "object" &&
    data.first &&
    data.second &&
    Array.isArray(data.picks) &&
    data.picks.some(
      p =>
        p &&
        typeof p.title_fa === "string" &&
        p.title_fa.trim() &&
        typeof p.why === "string" &&
        p.why.trim()
    )
  );
}

export async function onRequestPost({ request, env }) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "اطلاعات درخواست نامعتبر است." },
        { status: 400 }
      );
    }

    const prompt =
      typeof body?.prompt === "string" ? body.prompt : "";

    if (!prompt || prompt.length > 18000) {
      return Response.json(
        { error: "درخواست نامعتبر است؛ دوباره امتحان کن." },
        { status: 400 }
      );
    }

    if (!env.AI) {
      return Response.json(
        { error: "سرویس هوش مصنوعی فعال نیست." },
        { status: 503 }
      );
    }

    const instructions = `
You are an expert book recommendation assistant.

Return ONLY one complete valid JSON object.

Required structure:
{
  "first": {"known": true, "note": ""},
  "second": {"known": true, "note": ""},
  "picks": [
    {
      "title_fa": "",
      "title_orig": "",
      "author": "",
      "type": "",
      "stars": 5,
      "fa_published": "unsure",
      "from_first": "",
      "from_second": "",
      "why": ""
    }
  ]
}

Follow the user's book selection instructions.
Recommend real books only.
Use short Persian text in all descriptive fields.
Keep each explanation under 15 Persian words.
Do not include Markdown.
Do not add text outside JSON.
Do not leave JSON unfinished.
`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await env.AI.run(MODEL, {
          prompt:
            instructions +
            "\nUSER REQUEST:\n" +
            prompt +
            (attempt === 1
              ? "\nIMPORTANT: Your previous response was invalid. Return complete JSON with a nonempty picks array."
              : ""),
          max_tokens: 4096,
          temperature: 0.2
        });

        const answer = getAnswer(result);
        const parsed = extractJSON(answer);

        if (validResult(parsed)) {
          return Response.json({
            response: JSON.stringify(parsed)
          });
        }

        console.warn(
          "Invalid book recommendation response",
          {
            attempt: attempt + 1,
            responseLength: answer.length,
            preview: answer.slice(0, 150)
          }
        );
      } catch (error) {
        console.error(
          "AI attempt failed:",
          attempt + 1,
          error
        );
      }
    }

    return Response.json(
      {
        error:
          "این بار نتوانستم پیشنهاد کتاب کاملی بسازم؛ لطفاً دوباره امتحان کن."
      },
      { status: 502 }
    );

  } catch (error) {
    console.error("Book recommendation API error:", error);

    return Response.json(
      {
        error:
          "سرویس پیشنهاد کتاب موقتاً در دسترس نیست؛ کمی بعد دوباره امتحان کن."
      },
      { status: 500 }
    );
  }
}
