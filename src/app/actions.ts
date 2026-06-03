"use server";

import { PointTransactionType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  accountManagementErrorHref,
  createInitialAdmin,
  hashPassword,
  updateAccountWithAdminGuard,
  validateAccountMutation
} from "@/lib/accounts";
import { requireAdmin, requireUser, signIn, signOut } from "@/lib/auth";
import { getChildBalance, normalizeSignedPoints } from "@/lib/points";
import { prisma } from "@/lib/prisma";
import {
  canApplyTransaction,
  createRevisionSnapshot,
  normalizeTransactionInput,
  preserveTransactionInput
} from "@/lib/transactions";

function requiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

function optionalString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function positiveInt(formData: FormData, key: string) {
  const value = Number(formData.get(key));

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return value;
}

function optionalInt(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key) ?? fallback);
  return Number.isInteger(value) ? value : fallback;
}

async function resolveItemBinding(formData: FormData) {
  const scope = requiredString(formData, "scope");

  if (scope === "ALL") {
    return null;
  }

  if (scope !== "CHILD") {
    throw new Error("scope is invalid.");
  }

  const childId = requiredString(formData, "bindChildId");
  const child = await prisma.child.findUnique({
    where: { id: childId }
  });

  if (!child) {
    throw new Error("绑定档案不存在。");
  }

  return childId;
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function dateTime(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "");
  const value = raw ? new Date(raw) : new Date();

  if (Number.isNaN(value.getTime())) {
    throw new Error(`${key} must be a valid date.`);
  }

  return value;
}

function isPrismaKnownRequestError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export async function loginAction(formData: FormData) {
  const ok = await signIn(requiredString(formData, "username"), requiredString(formData, "password"));

  if (!ok) {
    redirect("/login?error=1");
  }

  redirect("/");
}

export async function setupAdminAction(formData: FormData) {
  const username = requiredString(formData, "username");
  const displayName = requiredString(formData, "displayName");
  const password = requiredString(formData, "password");

  await createInitialAdmin({
    username,
    displayName,
    password
  });

  await signIn(username, password);
  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createAccountAction(formData: FormData) {
  await requireAdmin();
  const password = requiredString(formData, "password");
  const account = validateAccountMutation({
    username: requiredString(formData, "username"),
    displayName: requiredString(formData, "displayName"),
    role: optionalString(formData, "role"),
    enabled: checked(formData, "enabled"),
    password
  });

  try {
    await prisma.userAccount.create({
      data: {
        ...account,
        passwordHash: hashPassword(password)
      }
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2002")) {
      redirect(accountManagementErrorHref("duplicate"));
    }

    throw error;
  }

  revalidatePath("/settings/accounts");
  redirect("/settings/accounts");
}

export async function updateAccountAction(formData: FormData) {
  const user = await requireAdmin();
  const id = requiredString(formData, "id");
  const account = validateAccountMutation({
    username: requiredString(formData, "username"),
    displayName: requiredString(formData, "displayName"),
    role: optionalString(formData, "role"),
    enabled: checked(formData, "enabled")
  });

  const result = await updateAccountWithAdminGuard({
    id,
    currentUserId: user.userId,
    account
  });

  if (!result.ok) {
    redirect(accountManagementErrorHref(result.error));
  }

  revalidatePath("/settings/accounts");
  redirect("/settings/accounts");
}

export async function resetAccountPasswordAction(formData: FormData) {
  await requireAdmin();
  const id = requiredString(formData, "id");
  const password = requiredString(formData, "password");

  if (password.length < 8) {
    redirect("/settings/accounts?error=password");
  }

  try {
    await prisma.userAccount.update({
      where: { id },
      data: {
        passwordHash: hashPassword(password)
      }
    });
  } catch (error) {
    if (isPrismaKnownRequestError(error, "P2025")) {
      redirect(accountManagementErrorHref("missing"));
    }

    throw error;
  }

  revalidatePath("/settings/accounts");
  redirect("/settings/accounts");
}

export async function createChildAction(formData: FormData) {
  await requireUser();

  await prisma.child.create({
    data: {
      name: requiredString(formData, "name"),
      avatarText: optionalString(formData, "avatarText"),
      displayColor: optionalString(formData, "displayColor") || "#2563EB",
      sortOrder: optionalInt(formData, "sortOrder")
    }
  });

  revalidatePath("/");
  revalidatePath("/children");
  redirect("/children");
}

export async function updateChildAction(formData: FormData) {
  await requireUser();

  const id = requiredString(formData, "id");
  const enabled = formData.get("enabled") === "on";

  await prisma.child.update({
    where: { id },
    data: {
      name: requiredString(formData, "name"),
      avatarText: optionalString(formData, "avatarText"),
      displayColor: optionalString(formData, "displayColor") || "#2563EB",
      sortOrder: optionalInt(formData, "sortOrder"),
      enabled
    }
  });

  revalidatePath("/");
  revalidatePath("/children");
}

export async function createItemAction(formData: FormData) {
  await requireUser();
  const type = requiredString(formData, "type") as PointTransactionType;
  const childId = await resolveItemBinding(formData);

  await prisma.pointItem.create({
    data: {
      type,
      childId,
      name: requiredString(formData, "name"),
      defaultPoints: positiveInt(formData, "defaultPoints"),
      description: optionalString(formData, "description"),
      sortOrder: optionalInt(formData, "sortOrder")
    }
  });

  revalidatePath("/items");
  redirect("/items");
}

export async function updateItemAction(formData: FormData) {
  await requireUser();
  const childId = await resolveItemBinding(formData);

  await prisma.pointItem.update({
    where: { id: requiredString(formData, "id") },
    data: {
      childId,
      name: requiredString(formData, "name"),
      defaultPoints: positiveInt(formData, "defaultPoints"),
      description: optionalString(formData, "description"),
      sortOrder: optionalInt(formData, "sortOrder"),
      enabled: formData.get("enabled") === "on"
    }
  });

  revalidatePath("/items");
}

export async function createTransactionAction(type: PointTransactionType, formData: FormData) {
  const user = await requireUser();
  const childId = requiredString(formData, "childId");
  const child = await prisma.child.findFirst({
    where: { id: childId, enabled: true }
  });

  if (!child) {
    throw new Error("孩子不存在或已停用。");
  }

  const itemId = requiredString(formData, "itemId");
  const item = await prisma.pointItem.findFirst({
    where: {
      id: itemId,
      type,
      enabled: true,
      OR: [{ childId: null }, { childId }]
    }
  });

  if (!item) {
    throw new Error("积分项目不存在、已停用，或不适用于当前档案。");
  }

  const points = normalizeSignedPoints(type, positiveInt(formData, "points"));

  if (type === PointTransactionType.REWARD) {
    const result = canApplyTransaction({
      type,
      balanceBefore: await getChildBalance(childId),
      signedPoints: points
    });

    if (!result.ok) {
      redirect("/rewards/redeem?error=balance");
    }
  }

  const transactionInput = normalizeTransactionInput({
    childId,
    type,
    itemId,
    itemNameSnapshot: item.name,
    points,
    note: optionalString(formData, "note"),
    occurredAt: dateTime(formData, "occurredAt")
  });

  await prisma.pointTransaction.create({
    data: {
      ...transactionInput,
      createdByUsername: user.username
    }
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/stats");

  if (type === PointTransactionType.BONUS || type === PointTransactionType.PENALTY) {
    if (checked(formData, "continueAdding")) {
      const recordPath = type === PointTransactionType.BONUS ? "/record/bonus" : "/record/penalty";
      redirect(`${recordPath}?childId=${encodeURIComponent(childId)}`);
    }

    redirect("/");
  }

  redirect("/transactions");
}

export async function updateTransactionAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredString(formData, "id");
  const reason = requiredString(formData, "reason");
  const current = await prisma.pointTransaction.findUnique({
    where: { id }
  });

  if (!current) {
    throw new Error("流水不存在。");
  }

  const type = requiredString(formData, "type") as PointTransactionType;
  const nextChildId = requiredString(formData, "childId");
  const itemId = requiredString(formData, "itemId");
  const item = await prisma.pointItem.findFirst({
    where: {
      id: itemId,
      type,
      OR: [{ childId: null }, { childId: nextChildId }]
    }
  });

  if (!item) {
    throw new Error("积分项目不存在，或不适用于当前档案。");
  }

  const nextPoints = normalizeSignedPoints(type, positiveInt(formData, "points"));
  const nextChild = await prisma.child.findUnique({
    where: { id: nextChildId }
  });

  if (!nextChild) {
    throw new Error("孩子不存在。");
  }

  if (type === PointTransactionType.REWARD) {
    const result = canApplyTransaction({
      type,
      balanceBefore: await getChildBalance(nextChildId, id),
      signedPoints: nextPoints
    });

    if (!result.ok) {
      redirect(`/transactions/${id}?error=balance`);
    }
  }

  const beforeData = preserveTransactionInput({
    childId: current.childId,
    type: current.type,
    itemId: current.itemId,
    itemNameSnapshot: current.itemNameSnapshot,
    points: current.points,
    note: current.note,
    occurredAt: current.occurredAt
  });
  const afterData = normalizeTransactionInput({
    childId: nextChildId,
    type,
    itemId,
    itemNameSnapshot: item.name,
    points: nextPoints,
    note: optionalString(formData, "note"),
    occurredAt: dateTime(formData, "occurredAt")
  });

  await prisma.$transaction(async (tx) => {
    await tx.pointTransaction.update({
      where: { id },
      data: afterData
    });

    await tx.transactionRevision.create({
      data: {
        transactionId: id,
        beforeData: createRevisionSnapshot(beforeData),
        afterData: createRevisionSnapshot(afterData),
        reason,
        editedByUsername: user.username
      }
    });
  });

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath(`/transactions/${id}`);
  redirect(`/transactions/${id}`);
}
