'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Bell, LogOut, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsDarkMode, setIsSidebarCollapsed, setToken, setUserLogin } from '@/state';
import clsx from 'clsx';
import { useCookies } from 'next-client-cookies';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Breadcrumbs, Typography } from '@mui/material';
import { fetchUserById } from '@/utils/httpClient';
import { toast } from 'react-toastify';
import { useFetchFile } from '@/app/hooks/useFetchFile';

const Navbar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const userLogin = useAppSelector((state) => state.global.userLogin);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const token = useAppSelector((state) => state.global.token);
  const { fileUrl } = useFetchFile(
    userLogin?.avatarId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${userLogin?.avatarId}` : null,
    token as string
  );

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cookie = useCookies();
  const router = useRouter();

  const toggleDropdown = (): void => {
    setIsOpen((prev: boolean) => !prev);
  };

  const toggleSidebar = (): void => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const toggleDarkMode = (): void => {
    dispatch(setIsDarkMode(!isDarkMode));
  };

  const handleLinkDropdown = (link: string): void => {
    router.push(link);
    toggleDropdown();
  };

  const handleLogout = (): void => {
    router.push('/auth/login');
    cookie.remove('access_token');
    dispatch(setToken(null));
    dispatch(setUserLogin(null));
    toast.success('Logout successfully');
  };

  const pathName = usePathname();
  const [breadcrumbsState, setBreadcrumbsState] = useState<
    { label: string; path: string; isLast: boolean; isNonClickable: boolean }[]
  >([]);
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  // Helper to get breadcrumbs
  const getBreadcrumbs = async () => {
    const pathArray = pathName.split('/').filter((x) => x);
    const breadcrumbs = await Promise.all(
      pathArray.map(async (value, index) => {
        const path = `/${pathArray.slice(0, index + 1).join('/')}`;

        let label = value.charAt(0).toUpperCase() + value.slice(1);
        let isLast = index === pathArray.length - 1;
        const isNonClickable = value.toLowerCase() === 'edit' || value.toLowerCase() === 'create';

        if (uuidRegex.test(value)) {
          const entityType = pathArray[index - 1]?.toLowerCase();
          isLast = index === pathArray.length - 1 || index === pathArray.length - 2;

          if (entityType === 'users') {
            const user = await fetchUserById(value, token as string);
            label = user.data.name || label;
          }
        }

        return {
          label,
          path,
          isLast,
          isNonClickable: isLast || isNonClickable,
        };
      })
    );

    setBreadcrumbsState(breadcrumbs);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    getBreadcrumbs();
  }, [pathName]);

  return (
    <div className='flex justify-between items-center w-full mb-7'>
      {/* left side */}
      <div className='flex justify-between items-center gap-3 sm:gap-5'>
        <button className='px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100' onClick={toggleSidebar}>
          <Menu className='w-4 h-4' />
        </button>
        <Breadcrumbs aria-label='breadcrumb' className='hidden sm:block'>
          {breadcrumbsState.map((crumb, index) => (
            <div key={index}>
              {crumb.isNonClickable ? (
                <Typography color='text.primary'>{crumb.label}</Typography>
              ) : (
                <Link href={crumb.path} className='text-blue-500 hover:underline'>
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </Breadcrumbs>
      </div>

      {/* right side */}
      <div className='flex justify-between items-center gap-5'>
        <div className='hidden sm:block'>
          <button onClick={toggleDarkMode}>
            {isDarkMode ? (
              <Sun className='cursor-pointer text-gray-500' size={24} />
            ) : (
              <Moon className='cursor-pointer text-gray-500' size={24} />
            )}
          </button>
        </div>
        <div className='relative'>
          <Bell className='cursor-pointer text-gray-500' size={24} />
          <span className='absolute -top-2 -right-2 inline-flex items-center justify-center px-[0.4rem] py-1 font-semibold leading-none text-red-100 bg-red-400 rounded-full'>
            3
          </span>
        </div>
        <hr className='w-0 h-7 border-solid border-l border-gray-300 mx-3 hidden sm:block' />
        <div className='relative' ref={dropdownRef}>
          <div className='flex items-center gap-3 cursor-pointer' onClick={toggleDropdown}>
            <Image
              src={
                fileUrl ||
                'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/m0vrgvjze72wxgqqsrad.png'
              }
              alt='avatar'
              width={100}
              height={100}
              className='rounded-full w-9 h-9 object-cover object-center'
            />
            <span className='font-semibold hidden sm:block'>{userLogin?.name}</span>
          </div>

          <div
            className={clsx(
              'absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10 overflow-hidden transform transition-all duration-300 ease-out',
              {
                'opacity-100 scale-100': isOpen,
                'opacity-0 scale-95 pointer-events-none': !isOpen,
              }
            )}
          >
            <div className='flex flex-col p-4 border-b border-gray-200 justify-start items-start'>
              <p className='font-semibold'>Signed in as</p>
              <p className='text-sm text-gray-500'>{userLogin?.username}</p>
            </div>
            <ul className='py-2'>
              <li className='px-4 py-2 hover:bg-gray-100 cursor-pointer'>
                <button
                  type='button'
                  onClick={() => handleLinkDropdown('/dashboard/profile')}
                  className='flex items-center gap-2'
                >
                  <User className='cursor-pointer text-gray-500' size={16} />
                  Profile
                </button>
              </li>
              <li className='px-4 py-2 hover:bg-gray-100 cursor-pointer'>
                <button
                  type='button'
                  onClick={() => handleLinkDropdown('/dashboard/settings')}
                  className='flex items-center gap-2'
                >
                  <Settings className='cursor-pointer text-gray-500' size={16} />
                  Settings
                </button>
              </li>
              <li className='px-4 py-2 hover:bg-gray-100 cursor-pointer block sm:hidden'>
                <button onClick={toggleDarkMode}>
                  {isDarkMode ? (
                    <div className='flex gap-2 items-center'>
                      <Sun className='cursor-pointer text-gray-500' size={16} />
                      Light Mode
                    </div>
                  ) : (
                    <div className='flex gap-2 items-center'>
                      <Moon className='cursor-pointer text-gray-500' size={16} />
                      Dark Mode
                    </div>
                  )}
                </button>
              </li>
              <li className='py-2'>
                <hr className='w-full h-px border-0 bg-gray-200 ' />
              </li>
              <li className='px-4 py-2 hover:bg-gray-100 cursor-pointer'>
                <button onClick={handleLogout} className='flex items-center gap-2 bg-transparent w-full h-full'>
                  <LogOut className='cursor-pointer text-gray-500' size={16} />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
