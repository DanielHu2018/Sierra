import { useState, useCallback, useRef, useEffect } from 'react';

export function useReasoningStream() {
  const [displayText, setDisplayText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<string[]>([]);
  const cancelledRef = useRef(false);
  const drainingRef = useRef(false);

  const startStream = useCallback(
    async (params: Record<string, string>, onComplete?: () => void) => {
      // Reset state
      cancelledRef.current = false;
      queueRef.current = [];
      setDisplayText('');
      setIsStreaming(true);

      abortRef.current = new AbortController();

      let streamDone = false;

      // Drain loop that knows when stream is done
      function drainTick() {
        if (cancelledRef.current) {
          drainingRef.current = false;
          return;
        }
        if (queueRef.current.length === 0) {
          if (streamDone) {
            drainingRef.current = false;
            setIsStreaming(false);
            onComplete?.();
            return;
          }
          // Queue empty but stream not done — wait and retry
          setTimeout(drainTick, 20);
          return;
        }
        const char = queueRef.current.shift()!;
        setDisplayText((prev) => prev + char);
        setTimeout(drainTick, 15);
      }

      // Start drain immediately
      drainingRef.current = true;
      setTimeout(drainTick, 50); // small delay to let first chunks arrive

      try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/stream/reasoning?${queryString}`, {
          signal: abortRef.current.signal,
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (cancelledRef.current) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE: split on double newline
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const event of events) {
            if (!event.startsWith('data: ')) continue;
            const payload = event.slice(6).trim();
            if (payload === '[DONE]') {
              streamDone = true;
              break;
            }
            try {
              const { chunk } = JSON.parse(payload) as { chunk: string };
              // Push each character into queue
              for (const char of chunk) {
                queueRef.current.push(char);
              }
            } catch {
              // Malformed SSE chunk — skip
            }
          }
          if (streamDone) break;
        }

        streamDone = true; // ensure set even if sentinel missed
      } catch (err: unknown) {
        if ((err as Error).name === 'AbortError') {
          // User cancelled — clean exit
        } else {
          // Network error — stream is done
          streamDone = true;
        }
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    queueRef.current = [];
    setIsStreaming(false);
    setDisplayText('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      abortRef.current?.abort();
      queueRef.current = [];
    };
  }, []);

  return { displayText, isStreaming, startStream, cancel };
}
