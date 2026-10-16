import { env } from "cloudflare:workers";
import type { HubMember } from "../access";

export type EcommerceSettings = Record<string, string>;

export function canAccessEcommerceControl(member: HubMember | null | undefined) {
  return Boolean(
    member &&
      (["Owner / Admin", "Developer / Technical Admin"].includes(member.role) ||
        member.access_scope === "Full company"),
  );
}


export function canManageEcommercePricing(member: HubMember | null | undefined) {
  return Boolean(member && member.access_scope === "Full company");
}

export function publicProductImage(row: Record<string, unknown>) {
  const imageKey = String(row.image_key || "");
  return imageKey.startsWith("static:")
    ? imageKey.slice("static:".length)
    : imageKey
      ? `/api/ecommerce/product-image/${row.id}`
      : "";
}

export async function readEcommerceSettings(): Promise<EcommerceSettings> {
  const { results } = await env.DB.prepare(
    "SELECT setting_key,setting_value FROM ecommerce_settings",
  ).all<{ setting_key: string; setting_value: string }>();
  return Object.fromEntries(results.map((row) => [row.setting_key, row.setting_value]));
}

export function boolSetting(value: string | undefined, fallback = true) {
  if (value == null || value === "") return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

export function money(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function cleanPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `27${digits.slice(1)}`;
  return digits;
}

export function makeOrderNumber(channel: "B2C" | "B2B") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 7).toUpperCase();
  return `WEB-${channel}-${date}-${suffix}`;
}

export function makePortalCode() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}
