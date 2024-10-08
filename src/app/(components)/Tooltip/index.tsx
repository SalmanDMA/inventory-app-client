import { useState } from 'react';

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <div
      className='relative inline-block w-full'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && text && (
        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-md text-center z-10 block sm:hidden'>
          <span className='block whitespace-nowrap'>{text}</span>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
