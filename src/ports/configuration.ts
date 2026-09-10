export interface ConfigurationSource {
  readonly read: () => Promise<string | undefined>;
}
