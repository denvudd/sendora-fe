import { type PaymentStatus, type Prisma } from '@prisma/client'
import { prisma } from '@shared/utils/prisma'

interface CreatePaymentParams {
  workspaceId: string
  amountCents: number
  currency?: string
  leadId?: string
  bookingId?: string
  stripeCustomerId?: string
  stripePaymentIntentId?: string
  metadata?: Prisma.InputJsonValue
}

interface ListPaymentsByWorkspaceParams {
  workspaceId: string
  limit?: number
}

interface UpdatePaymentStatusParams {
  workspaceId: string
  paymentId: string
  status: PaymentStatus
}

export async function createPayment({
  workspaceId,
  amountCents,
  currency,
  leadId,
  bookingId,
  stripeCustomerId,
  stripePaymentIntentId,
  metadata,
}: CreatePaymentParams) {
  return prisma.payment.create({
    data: {
      workspaceId,
      amountCents,
      currency,
      leadId,
      bookingId,
      stripeCustomerId,
      stripePaymentIntentId,
      metadata,
    },
  })
}

export async function listPaymentsByWorkspace({
  workspaceId,
  limit = 50,
}: ListPaymentsByWorkspaceParams) {
  return prisma.payment.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    where: {
      workspaceId,
    },
  })
}

export async function updatePaymentStatus({
  workspaceId,
  paymentId,
  status,
}: UpdatePaymentStatusParams) {
  return prisma.payment.update({
    data: {
      status,
      paidAt: status === 'SUCCEEDED' ? new Date() : null,
      refundedAt:
        status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED'
          ? new Date()
          : null,
    },
    where: {
      id: paymentId,
      workspaceId,
    },
  })
}
