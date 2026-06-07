export type UserRole = "owner" | "member";

export const OWNER_UIDS: string[] = [
  "a3lMaAkSnzPC7IyV3zgDQCttni12",
  "cTEj7okFu5MTZhkT7iioyDoPvZ22",
];

export function isOwnerUid(uid?: string | null) {
  return !!uid && OWNER_UIDS.includes(uid);
}

export function roleForUid(uid?: string | null): UserRole {
  return isOwnerUid(uid) ? "owner" : "member";
}
