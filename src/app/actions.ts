"use server";

import { PointTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, signIn, signOut } from "@/lib/auth";
import { getChildBalance, normalizeSignedPoints, transactionSnapshot } from "@/lib/points";
import { prisma } from "@/lib/prisma";

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

export async function loginAction(formData: FormData) {
  const ok = await signIn(requiredString(formData, "username"), requiredString(formData, "password"));

  if (!ok) {
    redirect("/login?error=1");
  }

  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
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

export async function deleteChildAction(formData: FormData) {
  await requireUser();

  const id = requiredString(formData, "id");
  const confirmations = [
    checked(formData, "confirm_delete"),
    checked(formData, "confirm_records"),
    checked(formData, "confirm_irreversible")
  ];

  if (confirmations.some((value) => !value)) {
    redirect(`/children?childId=${id}&error=childDeleteConfirmRequired`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.transactionRevision.deleteMany({
      where: { transaction: { childId: id } }
    });

    await tx.pointTransaction.deleteMany({
      where: { childId: id }
    });

    await tx.child.delete({
      where: { id }
    });
  });

  revalidatePath("/");
  revalidatePath("/children");
  revalidatePath("/transactions");
  revalidatePath("/stats");
  redirect("/children");
}

export async function createItemAction(formData: FormData) {
  await requireUser();
  const type = requiredString(formData, "type") as PointTransactionType;

  await prisma.pointItem.create({
    data: {
      type,
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

  await prisma.pointItem.update({
    where: { id: requiredString(formData, "id") },
    data: {
      name: requiredString(formData, "name"),
      defaultPoints: positiveInt(formData, "defaultPoints"),
      description: optionalString(formData, "description"),
      sortOrder: optionalInt(formData, "sortOrder"),
      enabled: formData.get("enabled") === "on"
    }
  });

  revalidatePath("/items");
}

export async function deleteItemAction(formData: FormData) {
  await requireUser();
  const id = requiredString(formData, "id");
  const confirmations = [
    checked(formData, "confirm_delete"),
    checked(formData, "confirm_history"),
    checked(formData, "confirm_next")
  ];

  if (confirmations.some((value) => !value)) {
    redirect(`/items?itemId=${id}&error=itemDeleteConfirmRequired`);
  }

  await prisma.pointItem.delete({
    where: { id }
  });

  revalidatePath("/items");
  revalidatePath("/transactions");
  revalidatePath("/stats");
  redirect("/items?deleted=1");
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
    where: { id: itemId, type, enabled: true }
  });

  if (!item) {
    throw new Error("积分项目不存在或已停用。");
  }

  const points = normalizeSignedPoints(type, positiveInt(formData, "points"));

  if (type === PointTransactionType.REWARD) {
    const balance = await getChildBalance(childId);

    if (balance + points < 0) {
      redirect("/rewards/redeem?error=balance");
    }
  }

  await prisma.pointTransaction.create({
    data: {
      childId,
      type,
      itemId,
      itemNameSnapshot: item.name,
      points,
      note: optionalString(formData, "note"),
      occurredAt: dateTime(formData, "occurredAt"),
      createdByUsername: user.username
    }
  });

  revalidatePath("/");
  revalidatePath("/transactions");
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
  const itemId = requiredString(formData, "itemId");
  const item = await prisma.pointItem.findFirst({
    where: { id: itemId, type }
  });

  if (!item) {
    throw new Error("积分项目不存在。");
  }

  const nextPoints = normalizeSignedPoints(type, positiveInt(formData, "points"));
  const nextChildId = requiredString(formData, "childId");
  const nextChild = await prisma.child.findUnique({
    where: { id: nextChildId }
  });

  if (!nextChild) {
    throw new Error("孩子不存在。");
  }

  if (type === PointTransactionType.REWARD) {
    const balanceWithoutCurrent = await getChildBalance(nextChildId, id);

    if (balanceWithoutCurrent + nextPoints < 0) {
      redirect(`/transactions/${id}?error=balance`);
    }
  }

  const afterData = {
    childId: nextChildId,
    type,
    itemId,
    itemNameSnapshot: item.name,
    points: nextPoints,
    note: optionalString(formData, "note"),
    occurredAt: dateTime(formData, "occurredAt")
  };

  await prisma.$transaction(async (tx) => {
    await tx.pointTransaction.update({
      where: { id },
      data: afterData
    });

    await tx.transactionRevision.create({
      data: {
        transactionId: id,
        beforeData: transactionSnapshot(current),
        afterData: transactionSnapshot(afterData),
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
