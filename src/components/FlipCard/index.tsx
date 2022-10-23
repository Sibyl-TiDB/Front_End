import React, { useState } from 'react'
import { Icon } from '@fluentui/react/lib/Icon'

import { Card } from '../Card'
import './index.css'

export const FlipCard: React.FC<{
  className?: string
  front?: React.ReactNode
  back?: React.ReactNode
  expandModalContent?: React.ReactNode
}> = ({ className, front, back }) => {
  const [flip, setFlip] = useState(false)
  return (
    <div
      className={`flip-card ${className ? className : ''} ${
        flip ? 'flip' : ''
      }`}
    >
      <div className='content'>
        <Card className='front cursor-pointer' onClick={() => setFlip(true)}>
          {front}
        </Card>
        <Card className='back'>
          <Icon
            className='absolute top-3 left-1 cursor-pointer px-4 pb-1 z-10 text-[#ccc]'
            iconName='Back'
            onClick={() => setFlip(false)}
          />
          {back}
        </Card>
      </div>
    </div>
  )
}
