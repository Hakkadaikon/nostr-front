// Legacy placeholder retained for backward compatibility; prefer secureStore for secrets.
export async function encrypt(plain: string, password: string) {
  return plain + ':' + password.length; // do not use in production; kept as stub
}
export async function decrypt(data: string, password: string) {
  return data.split(':')[0];
}
