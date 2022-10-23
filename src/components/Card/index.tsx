import React from 'react'
import { IconButton, Modal } from '@fluentui/react'
import { Icon } from '@fluentui/react/lib/Icon'
import { useId, useBoolean } from '@fluentui/react-hooks'

import './index.css'

export const Card: React.FC<{
  className?: string
  onClick?: () => void
  expandModalContent?: React.ReactNode
}> = ({ className, onClick, children, expandModalContent }) => {
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] =
    useBoolean(false)
  const titleId = useId('title')
  return (
    <div
      className={`card relative ${className ? className : ''}`}
      onClick={onClick}
    >
      {children}

      {!!expandModalContent && (
        <Icon
          className='absolute top-3 right-2 cursor-pointer pb-2 px-2 z-100 text-[#ccc]'
          iconName='FullScreen'
          onClick={showModal}
        />
      )}
      <Modal
        titleAriaId={titleId}
        isOpen={isModalOpen}
        onDismiss={hideModal}
        isBlocking={false}
        isModeless={true}
        containerClassName='w-full h-full p-4'
      >
        <IconButton
          className='absolute right-4 top-4'
          iconProps={{ iconName: 'Cancel' }}
          onClick={hideModal}
        />
        {expandModalContent}
      </Modal>
    </div>
  )
}
