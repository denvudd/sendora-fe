import { defineStepper } from '@stepperize/react'

export const { Stepper, useStepper } = defineStepper(
  {
    id: 'profile',
    title: 'Your profile',
    description: 'Add your name and optional profile photo.',
  },
  {
    id: 'workspace',
    title: 'Workspace',
    description: 'Set up your Sendora workspace to get started.',
  },
)
