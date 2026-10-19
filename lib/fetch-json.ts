// Bound the complete request, including reading the response body.
export async function fetchJson<T>(url: string, signal: AbortSignal, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  if (signal.aborted) cancel();
  else signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Oplysningerne kunne ikke hentes. Prøv igen.');
    return data as T;
  } catch (error) {
    if (timedOut && !signal.aborted) throw new Error('Forbindelsen tog for lang tid. Prøv igen.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
  }
}
