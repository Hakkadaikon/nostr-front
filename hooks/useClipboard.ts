"use client";

export function useClipboard() {
  return {
    async copy(text: string) {
      await navigator.clipboard.writeText(text);
      return true;
    },
  };
}
