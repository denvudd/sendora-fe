import type { ReactElement } from 'react'

import { HomePage } from '@features/home/components/home-page'

export const dynamic = 'force-dynamic'

const Home = (): ReactElement => <HomePage />

export default Home
