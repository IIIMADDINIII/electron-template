

declare global {
  interface Window {
    readySignal?: {
      isUsed?(): void;
      send?(): void;
    };
  }
}

/**
 * Sends the Ready Signal used event to the RendererWindow.
 * Call this as soon as Possible in you code.
 * The RendererWindow will delay the show of the Window after you call readySignalSend().
 */
export function readySignalIsUsed() {
  window.readySignal?.isUsed?.();
}

/**
 * Sends the Ready Signal event to the RendererWindow.
 * This signalizes to the RendererWindow that the Window is ready to be shown.
 * This only works if the readySignalUsed was send early enough.
 */
export function readySignalSend() {
  window.readySignal?.send?.();
}