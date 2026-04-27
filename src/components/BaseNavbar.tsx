import React from 'react'

interface BaseNavbarProps {
  title?: string
  actionButton?: React.ReactNode
}

const BaseNavbar: React.FC<BaseNavbarProps> = ({
  title = 'Vendor Portal',
  actionButton,
}) => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <img src="/assets/sgh-logo.png" alt="SGH" className="h-10" />
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          </div>
          {actionButton}
        </div>
      </div>
    </nav>
  )
}

export default BaseNavbar
