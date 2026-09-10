import { domainLayer } from "../domain/marker.ts";
import { portsLayer } from "../ports/marker.ts";

/** Marks the use-case boundary without defining a Quest operation. */
export const applicationLayer = `${domainLayer}:${portsLayer}:application`;
