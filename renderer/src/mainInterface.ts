

declare global {
  interface Window {
    readySignal?: {
      isUsed?(): void;
      send?(): void;
    };
  }
}

export function readySignalIsUsed() {
  window.readySignal?.isUsed?.();
}

export function readySignalSend() {
  window.readySignal?.send?.();
}