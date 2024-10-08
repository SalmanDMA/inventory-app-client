'use client';

import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsDarkMode, setLanguage } from '@/state';
import { Sun, Moon, Globe } from 'lucide-react';

const Preferences = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const language = useAppSelector((state) => state.global.language);

  const handleThemeChange = (mode: 'light' | 'dark'): void => {
    const newMode = mode === 'dark';
    dispatch(setIsDarkMode(newMode));
  };

  const handleLanguageChange = (lang: 'en' | 'id'): void => {
    dispatch(setLanguage(lang));
  };

  return (
    <div className='p-4 bg-gray-100 rounded-md shadow-md'>
      <h3 className='text-xl font-semibold mb-6'>Preferences</h3>

      {/* Theme Preferences Card */}
      <div className='mb-6 bg-white p-6 rounded-md shadow-md'>
        <h4 className='text-md font-semibold mb-4'>Theme </h4>
        <div className='flex justify-around'>
          {/* Light Mode */}
          <div
            onClick={() => handleThemeChange('light')}
            className={`cursor-pointer p-4 min-w-[100px] border rounded-md flex flex-col items-center ${
              !isDarkMode ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
            }`}
          >
            <Sun className='w-8 h-8 text-yellow-500' />
            <span className='mt-2 text-sm font-semibold'>Light Mode</span>
          </div>

          {/* Dark Mode */}
          <div
            onClick={() => handleThemeChange('dark')}
            className={`cursor-pointer p-4 min-w-[100px] border rounded-md flex flex-col items-center ${
              isDarkMode ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
            }`}
          >
            <Moon className='w-8 h-8 text-gray-800' />
            <span className='mt-2 text-sm font-semibold'>Dark Mode</span>
          </div>
        </div>
        <button
          type='button'
          onClick={() => handleThemeChange(isDarkMode ? 'light' : 'dark')}
          className='mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 w-full'
        >
          Toggle Theme
        </button>
      </div>

      {/* Language Preferences Card */}
      <div className='bg-white p-6 rounded-md shadow-md'>
        <h4 className='text-md font-semibold mb-4'>Language</h4>
        <div className='flex justify-around'>
          {/* English */}
          <div
            onClick={() => handleLanguageChange('en')}
            className={`cursor-pointer p-4 min-w-[100px] border rounded-md flex flex-col items-center ${
              language === 'en' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
            }`}
          >
            <Globe className='w-8 h-8 text-green-500' />
            <span className='mt-2 text-sm font-semibold'>English</span>
          </div>

          {/* Indonesian */}
          <div
            onClick={() => handleLanguageChange('id')}
            className={`cursor-pointer p-4 min-w-[100px] border rounded-md flex flex-col items-center ${
              language === 'id' ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
            }`}
          >
            <Globe className='w-8 h-8 text-red-500' />
            <span className='mt-2 text-sm font-semibold'>Indonesian</span>
          </div>
        </div>
        <button
          type='button'
          onClick={() => handleLanguageChange(language === 'en' ? 'id' : 'en')}
          className='mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 w-full'
        >
          Toggle Language
        </button>
      </div>
    </div>
  );
};

export default Preferences;
