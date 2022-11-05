
export interface MessagePortDetail<Port> {
  port: Port,
  id: string | undefined,
}

export function getEventPort<T>(event: { readonly ports: ReadonlyArray<T>; }): T {
  let port = event.ports[0];
  if (port === undefined) throw new Error("Received MessagePort Event without an MessagePort!");
  return port;
}