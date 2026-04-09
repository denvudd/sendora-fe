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
    code: 'MAX_DOMAINS',
    description: 'Maximum number of domains per workspace.',
    name: 'Domains',
  },
  {
    code: 'MAX_CONTACTS',
    description: 'Maximum number of contacts per workspace.',
    name: 'Contacts',
  },
  {
    code: 'MAX_EMAILS_PER_MONTH',
    description: 'Maximum emails sent per month.',
    name: 'Emails per month',
  },
]

const plans: SeedPlan[] = [
  {
    code: 'STANDARD',
    description: 'Get started for free.',
    features: [
      { code: 'MAX_DOMAINS', isEnabled: true, limitValue: 1 },
      { code: 'MAX_CONTACTS', isEnabled: true, limitValue: 10 },
      { code: 'MAX_EMAILS_PER_MONTH', isEnabled: true, limitValue: 10 },
    ],
    monthlyPriceCents: 0,
    name: 'Standard',
    yearlyPriceCents: 0,
  },
  {
    code: 'PLUS',
    description: 'For growing teams.',
    features: [
      { code: 'MAX_DOMAINS', isEnabled: true, limitValue: 2 },
      { code: 'MAX_CONTACTS', isEnabled: true, limitValue: 50 },
      { code: 'MAX_EMAILS_PER_MONTH', isEnabled: true, limitValue: 50 },
    ],
    monthlyPriceCents: 6700,
    name: 'Plus',
    yearlyPriceCents: 67000,
  },
  {
    code: 'ULTIMATE',
    description: 'Unlimited power for your business.',
    features: [
      { code: 'MAX_DOMAINS', isEnabled: true },
      { code: 'MAX_CONTACTS', isEnabled: true, limitValue: 500 },
      { code: 'MAX_EMAILS_PER_MONTH', isEnabled: true, limitValue: 500 },
    ],
    monthlyPriceCents: 9700,
    name: 'Ultimate',
    yearlyPriceCents: 97000,
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
