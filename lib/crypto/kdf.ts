export async function deriveKey(password: string, salt: string) {
  return `key:${password}:${salt}`;
}
