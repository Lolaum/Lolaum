export function getAdminEmails(): string[] {
  return [process.env.LOLAUM_ADMIN_EMAILS, process.env.ADMIN_EMAILS]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
}
