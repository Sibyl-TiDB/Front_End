import React from 'react'

import { Card } from '../../components/Card'

export const MetricCard: React.FC<{
  title: string
  chart: React.ReactNode
  className?: string
}> = ({ title, className, chart }) => {
  return (
    <Card className={className} expandModalContent={<>{chart}</>}>
      <p className='card-title'>{title}</p>
      {chart}
    </Card>
  )
}
