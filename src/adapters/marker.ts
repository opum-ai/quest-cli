import { portsLayer } from "../ports/marker.ts";

/** Marks the adapter boundary without introducing an infrastructure integration. */
export const adaptersLayer = `${portsLayer}:adapters`;
