export function withTimeout<T>(
  promise: PromiseLike<T> | T,
  milliseconds: number,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), milliseconds);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}
