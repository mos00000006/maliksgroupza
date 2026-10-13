import { headers } from "next/headers";

export type AuthenticatedUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_EMAIL_HEADER = "x-maliks-hub-user-email";
const USER_FULL_NAME_HEADER = "x-maliks-hub-user-name";

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const requestHeaders = await headers();
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!email) return null;

  const fullName = requestHeaders.get(USER_FULL_NAME_HEADER);

  return {
    displayName: fullName ?? email,
    email,
    fullName,
  };
}
