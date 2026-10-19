import { createStreamDataTransformer, type Message } from "ai";

export const runtime = "edge";

function safeErrorResponse(message: string, status: number) {
  return Response.json(
    {
      error: message,
    },
    { status },
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { messages?: Message[]; chat_id?: string }
      | null;

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return safeErrorResponse("Please provide a valid chat message.", 400);
    }

    const messages = body.messages;
    const chatIdFromHeader = req.headers.get("x-chat-id") || undefined;
    const chatId = chatIdFromHeader || body.chat_id;

    const backendUrl = process.env.TACOS_API_URL?.trim();
    const apiKey = process.env.TACOS_API_KEY?.trim();

    if (!backendUrl || !apiKey) {
      return safeErrorResponse(
        "The chatbot is temporarily unavailable. Please configure the backend URL and API key.",
        503,
      );
    }

    const normalizedBackendUrl = backendUrl.replace(/\/$/, "");

    const backendHeaders: HeadersInit = {
      "Content-Type": "application/json",
      "X-TACOS-Key": apiKey,
    };

    if (chatId) {
      backendHeaders["X-Chat-Id"] = chatId;
    }

    const backendBody = JSON.stringify({
      messages,
      ...(chatId ? { chat_id: chatId } : {}),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response: Response;

    try {
      response = await fetch(`${normalizedBackendUrl}/prompt`, {
        method: "POST",
        headers: backendHeaders,
        body: backendBody,
        signal: controller.signal,
      });
    } catch (fetchError) {
      console.error("[API Chat Route Fetch Error]", fetchError);
      return safeErrorResponse(
        "The chatbot is taking too long to respond. Please try again.",
        504,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.error("[API Chat Route Backend Error]", {
        status: response.status,
      });
      return safeErrorResponse(
        "The chatbot is temporarily unavailable. Please try again later.",
        response.status >= 500 ? 502 : 400,
      );
    }

    if (!response.body) {
      return safeErrorResponse(
        "The chatbot is temporarily unavailable. Please try again later.",
        502,
      );
    }

    const rawStream = response.body;
    const stream = rawStream.pipeThrough(createStreamDataTransformer());
    const responseChatId = response.headers.get("X-Chat-Id");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        ...(responseChatId ? { "X-Chat-Id": responseChatId } : {}),
      },
    });
  } catch (error) {
    console.error("[API Chat Route Error]", error);
    return safeErrorResponse(
      "The chatbot is temporarily unavailable. Please try again later.",
      500,
    );
  }
}
