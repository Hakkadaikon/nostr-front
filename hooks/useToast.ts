"use client";
import { useUiStore } from '../stores/ui.store';

export function useToast() {
  const toast = useUiStore(s => s.toast);
  const show = useUiStore(s => s.showToast);
  const clear = useUiStore(s => s.clearToast);
  return { toast, show, clear };
}
