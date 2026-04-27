import React from 'react'

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType: 'primary' | 'secondary'
}

const CustomButton: React.FC<CustomButtonProps> = ({
  buttonType,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg transition-colors cursor-pointer'
  const primaryStyles = 'bg-indigo-600 text-white hover:bg-indigo-700'
  const secondaryStyles = 'bg-gray-100 text-gray-700 hover:bg-gray-200'

  const appliedStyles =
    buttonType === 'primary' ? primaryStyles : secondaryStyles

  return (
    <button
      className={`${baseStyles} ${appliedStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default CustomButton
