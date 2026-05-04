const fallbackAdminEmails = ["rpierlioni@gmail.com"];

export function adminEmails() {
  const configured = process.env.ADMIN_EMAILS?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configured?.length ? configured : fallbackAdminEmails;
}

export function isAdminEmail(email: string | null | undefined) {
  return adminEmails().includes(String(email || "").trim().toLowerCase());
}
