import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SeedFeature {
  code: string
  description: string
  name: string
}

interface SeedPlanFeature {
  code: string
  isEnabled: boolean
  limitValue?: number
}

interface SeedPlan {
  code: string
  description: string
  monthlyPriceCents: number
  name: string
  yearlyPriceCents: number
  features: SeedPlanFeature[]
}

const features: SeedFeature[] = [
  {
    code: 'MAX_CHATBOTS',
    description: 'Maximum number of chatbots per workspace.',
    name: 'Max chatbots',
  },
  {
    code: 'MAX_LEADS_PER_MONTH',
    description: 'Maximum leads captured each month.',
    name: 'Max leads per month',
  },
  {
    code: 'EMAIL_CAMPAIGNS',
    description: 'Access to email campaign builder and sending.',
    name: 'Email campaigns',
  },
  {
    code: 'WHITE_LABEL',
    description: 'Enable white-label branding options.',
    name: 'White-label',
  },
  {
    code: 'PRIORITY_SUPPORT',
    description: 'Priority support channel access.',
    name: 'Priority support',
  },
]

const plans: SeedPlan[] = [
  {
    code: 'STARTER',
    description: 'Freelancers and small sites.',
    features: [
      { code: 'MAX_CHATBOTS', isEnabled: true, limitValue: 1 },
      { code: 'MAX_LEADS_PER_MONTH', isEnabled: true, limitValue: 500 },
      { code: 'EMAIL_CAMPAIGNS', isEnabled: true },
      { code: 'WHITE_LABEL', isEnabled: false },
      { code: 'PRIORITY_SUPPORT', isEnabled: false },
    ],
    monthlyPriceCents: 4900,
    name: 'Starter',
    yearlyPriceCents: 49000,
  },
  {
    code: 'GROWTH',
    description: 'Growing SMB teams.',
    features: [
      { code: 'MAX_CHATBOTS', isEnabled: true, limitValue: 5 },
      { code: 'MAX_LEADS_PER_MONTH', isEnabled: true, limitValue: 5000 },
      { code: 'EMAIL_CAMPAIGNS', isEnabled: true },
      { code: 'WHITE_LABEL', isEnabled: false },
      { code: 'PRIORITY_SUPPORT', isEnabled: true },
    ],
    monthlyPriceCents: 14900,
    name: 'Growth',
    yearlyPriceCents: 149000,
  },
  {
    code: 'PRO',
    description: 'Agencies and power users.',
    features: [
      { code: 'MAX_CHATBOTS', isEnabled: true },
      { code: 'MAX_LEADS_PER_MONTH', isEnabled: true },
      { code: 'EMAIL_CAMPAIGNS', isEnabled: true },
      { code: 'WHITE_LABEL', isEnabled: true },
      { code: 'PRIORITY_SUPPORT', isEnabled: true },
    ],
    monthlyPriceCents: 29900,
    name: 'Pro',
    yearlyPriceCents: 299000,
  },
]

async function upsertFeatures(): Promise<Map<string, string>> {
  const featureIdByCode = new Map<string, string>()

  for (const feature of features) {
    const record = await prisma.feature.upsert({
      create: feature,
      update: {
        description: feature.description,
        name: feature.name,
      },
      where: {
        code: feature.code,
      },
    })

    featureIdByCode.set(feature.code, record.id)
  }

  return featureIdByCode
}

async function upsertPlansWithFeatures(featureIdByCode: Map<string, string>) {
  for (const plan of plans) {
    const planRecord = await prisma.plan.upsert({
      create: {
        code: plan.code,
        description: plan.description,
        monthlyPriceCents: plan.monthlyPriceCents,
        name: plan.name,
        yearlyPriceCents: plan.yearlyPriceCents,
      },
      update: {
        description: plan.description,
        isActive: true,
        monthlyPriceCents: plan.monthlyPriceCents,
        name: plan.name,
        yearlyPriceCents: plan.yearlyPriceCents,
      },
      where: {
        code: plan.code,
      },
    })

    for (const planFeature of plan.features) {
      const featureId = featureIdByCode.get(planFeature.code)

      if (!featureId) {
        throw new Error(
          `Feature with code "${planFeature.code}" was not seeded.`,
        )
      }

      await prisma.planFeature.upsert({
        create: {
          featureId,
          isEnabled: planFeature.isEnabled,
          limitValue: planFeature.limitValue,
          planId: planRecord.id,
        },
        update: {
          isEnabled: planFeature.isEnabled,
          limitValue: planFeature.limitValue,
        },
        where: {
          planId_featureId: {
            featureId,
            planId: planRecord.id,
          },
        },
      })
    }
  }
}

async function main() {
  const featureIdByCode = await upsertFeatures()
  await upsertPlansWithFeatures(featureIdByCode)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
