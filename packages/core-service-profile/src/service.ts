import { requireUser, type IdentityRepository } from '@acos/core-identity';

import type { ServiceProfileRepository } from './repository';
import { applySystemServiceProfileDefaults } from './systemDefaults';
import type { NewSearchServiceProfileInput, ServiceProfileInput, StoredServiceProfile } from './types';
import { validateServiceProfileInput } from './validation';

// Application/service boundary.
// -----------------------------------------------------------------------
// The only place a raw session token is accepted. Every function here
// resolves it through requireUser() FIRST — a caller never supplies a
// userId, and an unauthenticated token never reaches the repository
// (DEC-003). This is the authenticated session -> server-derived userId
// -> user-owned repository chain this phase exists to prove.
// -----------------------------------------------------------------------

export interface ServiceProfileDeps {
  identity: IdentityRepository;
  profiles: ServiceProfileRepository;
}

export async function createServiceProfile(
  deps: ServiceProfileDeps,
  rawToken: string | undefined | null,
  input: NewSearchServiceProfileInput,
  now: Date = new Date(),
): Promise<StoredServiceProfile> {
  const userId = await requireUser(deps.identity, rawToken, now);
  // CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002,
  // CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001 (system-
  // owned-field correction): input's type carries only service+geography,
  // so there is no caller-suppliable value for the other five fields to
  // read here at all — applySystemServiceProfileDefaults() always
  // constructs them, unconditionally, before validation runs.
  const fields = validateServiceProfileInput(applySystemServiceProfileDefaults(input));
  return deps.profiles.create(userId, fields, now);
}

export async function getServiceProfile(
  deps: ServiceProfileDeps,
  rawToken: string | undefined | null,
  id: string,
  now: Date = new Date(),
): Promise<StoredServiceProfile | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.profiles.getById(userId, id);
}

export async function listServiceProfiles(
  deps: ServiceProfileDeps,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<readonly StoredServiceProfile[]> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.profiles.list(userId);
}

export async function updateServiceProfile(
  deps: ServiceProfileDeps,
  rawToken: string | undefined | null,
  id: string,
  input: ServiceProfileInput,
  now: Date = new Date(),
): Promise<StoredServiceProfile | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const fields = validateServiceProfileInput(input);
  return deps.profiles.update(userId, id, fields, now);
}

export async function deleteServiceProfile(
  deps: ServiceProfileDeps,
  rawToken: string | undefined | null,
  id: string,
  now: Date = new Date(),
): Promise<boolean> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.profiles.delete(userId, id);
}
