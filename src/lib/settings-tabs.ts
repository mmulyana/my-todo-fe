export const SETTINGS_TABS = ["profile", "appearance", "mcp"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export function parseSettingsTab(value: string | null): SettingsTab | null {
  return SETTINGS_TABS.find((tab) => tab === value) ?? null;
}
