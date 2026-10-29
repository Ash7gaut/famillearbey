import fs from 'node:fs';
import {
  ADMIN,
  AUTH_DIR,
  MEMBER,
  STORAGE_FILE,
  USERS_FILE,
  ensureAuthUser,
  ensureFamilyMember,
  passwordLogin,
  toStorageState,
} from './helpers';

/** Prépare les comptes de test (admin seedé + un membre E2E) et écrit les storageState. */
export default async function globalSetup() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  await ensureAuthUser(MEMBER.email, MEMBER.password);

  const adminSession = await passwordLogin(ADMIN.email, ADMIN.password);
  const memberSession = await passwordLogin(MEMBER.email, MEMBER.password);

  const adminMemberId = await ensureFamilyMember(adminSession.user.id, 'Admin', 'Local', true);
  const memberMemberId = await ensureFamilyMember(memberSession.user.id, 'E2E', 'Membre', false);

  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify({
      admin: { authId: adminSession.user.id, memberId: adminMemberId, token: adminSession.access_token },
      member: { authId: memberSession.user.id, memberId: memberMemberId, token: memberSession.access_token },
    }),
  );
  fs.writeFileSync(STORAGE_FILE.admin, JSON.stringify(toStorageState(adminSession)));
  fs.writeFileSync(STORAGE_FILE.member, JSON.stringify(toStorageState(memberSession)));
}
