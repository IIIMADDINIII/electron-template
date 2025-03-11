/**
 * RemoteObject Api for the Ready Signal for a RendererWindow.
 * Used to only show the Window once it finished loading and rendering.
 * @public
 */
export type RendererWindowApi = {
  /**
   * Call this when you want to use the Ready Signal very early on.
   */
  readySignalIsUsed(): void;
  /**
   * Call this once the Window has finished loading and rendering.
   */
  readySignalSend(): void;
};

/**
 * Name of the Remote Object providing the Ready Signal Api
 */
export const RENDERER_WINDOW_API_ID = "renderer-window-api";

/**
 * Channel Used to Communicate remote Objects messages.
 * @public
 */
export const RENDERER_WINDOW_REMOTE_OBJECTS_CHANNEL = "remote-objects";