// Theme utilities for the app
// This file contains shared theme constants and helpers

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  muted: string;
  border: string;
}

export const THEME_STORAGE_KEY = "site-theme-colors";
export const THEME_ID_KEY = "site-theme-id";

export const defaultTheme: ThemeColors = {
  primary: "263 70% 58%",
  secondary: "187 70% 53%",
  accent: "45 96% 53%",
  background: "240 15% 5%",
  card: "240 12% 8%",
  muted: "240 10% 20%",
  border: "240 10% 20%",
};
