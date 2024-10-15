'use client';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setIsSidebarCollapsed } from '@/state';
import { useGetRoleModulesQuery } from '@/state/api';
import { IModule, IRoleModule } from '@/types/model';
import { Tooltip } from '@mui/material';
import * as Icons from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

const getIconComponent = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons] as React.ElementType;
  return IconComponent || Icons.Layout;
};

interface AccordionProps {
  label: string;
  icon: string;
  children: React.ReactNode;
  isCollapsed: boolean;
}

const Accordion = ({ label, icon, children, isCollapsed }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleAccordion = () => setIsOpen(!isOpen);

  const content = (
    <div
      className={`cursor-pointer flex items-center ${
        isCollapsed ? 'justify-center py-4' : 'justify-start px-8 py-4'
      } hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors`}
      onClick={toggleAccordion}
    >
      {React.createElement(getIconComponent(icon), { className: 'w-6 h-6 !text-gray-700' })}
      <span className={`${isCollapsed ? 'hidden' : 'block'} font-medium text-gray-700`}>{label}</span>
      <span className={`${isCollapsed ? 'hidden' : 'block'} ml-auto`}>
        {isOpen ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
      </span>
    </div>
  );

  return (
    <div>
      {isCollapsed ? (
        <Tooltip title='Click for show another link' placement={'right'}>
          {content}
        </Tooltip>
      ) : (
        content
      )}
      <div className={`${isCollapsed ? '' : 'pl-8'} ${isOpen ? 'block' : 'hidden'}`}>{children}</div>
    </div>
  );
};

interface SidebarLinkProps {
  href: string | null;
  icon: string;
  label: string;
  isCollapsed: boolean;
}

const SidebarLink = ({ href, icon, label, isCollapsed }: SidebarLinkProps) => {
  const pathName = usePathname();
  const isActive = href && (pathName === href || (pathName === '/' && href === '/dashboard'));

  const content = (
    <div
      className={`cursor-pointer flex items-center ${
        isCollapsed ? 'justify-center py-4' : 'justify-start px-8 py-4'
      } hover:text-blue-500 hover:bg-blue-100 gap-3 transition-colors ${isActive ? 'bg-blue-200 text-white' : ''}`}
    >
      {React.createElement(getIconComponent(icon), { className: 'w-6 h-6 !text-gray-700' })}
      <span className={`${isCollapsed ? 'hidden' : 'block'} font-medium text-gray-700`}>{label}</span>
    </div>
  );

  const convertHref = (href: string) => {
    if (href === '/dashboard' || href.startsWith('/dashboard')) {
      return href;
    } else {
      return `/dashboard${href}`;
    }
  };

  return href ? (
    <Link href={convertHref(href)}>
      {isCollapsed ? (
        <Tooltip title={label} placement='right'>
          {content}
        </Tooltip>
      ) : (
        content
      )}
    </Link>
  ) : (
    <div>{content}</div>
  );
};

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const userLogin = useAppSelector((state) => state.global.userLogin);
  const { data: roleModules } = useGetRoleModulesQuery({ roleId: userLogin?.roleId });

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const sidebarClassNames = `fixed flex flex-col ${
    isSidebarCollapsed ? 'w-0 md:w-16' : 'w-72 md:w-64'
  } bg-white transition-all duration-300 overflow-hidden h-full shadow-md z-40`;

  return (
    <div className={sidebarClassNames}>
      {/* Top Logo */}
      <div
        className={`flex gap-3 justify-between md:justify-center items-center pt-8 ${
          isSidebarCollapsed ? 'px-5' : 'px-8'
        }`}
      >
        <Link href='/dashboard'>
          <Image
            src='https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/a3bjct2zdyoellxszezp.png'
            alt='Workflow'
            width={100}
            height={100}
            className='size-6'
          />
        </Link>
        <Link href='/dashboard' className={`${isSidebarCollapsed ? 'hidden' : 'block'} font-extrabold text-2xl`}>
          ManStock
        </Link>
        <button className='md:hidden px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100' onClick={toggleSidebar}>
          <Icons.Menu className='w-4 h-4' />
        </button>
      </div>

      {/* Links */}
      <div className='flex-grow mt-8'>
        {roleModules?.data.map((item: IRoleModule) => {
          const moduleData = item.module;
          if (
            item.checked &&
            moduleData?.moduleType?.name === 'Menu Directory' &&
            moduleData.childModules &&
            moduleData.childModules.length > 0
          ) {
            return (
              <Accordion
                key={moduleData?.moduleId}
                label={moduleData?.name ?? 'Unknown'}
                icon={moduleData?.icon ?? 'Layout'}
                isCollapsed={isSidebarCollapsed}
              >
                {moduleData.childModules.map((child: IModule) => {
                  const roleModuleForChild = child?.roleModules?.find(
                    (roleModule: IRoleModule) => Number(roleModule.moduleId) === Number(child.moduleId)
                  );

                  if (roleModuleForChild?.checked) {
                    return (
                      <SidebarLink
                        key={child?.moduleId ?? `child-${Math.random()}`}
                        href={child?.route ?? '#'}
                        icon={child?.icon ?? 'Layout'}
                        label={child?.name ?? 'Unknown'}
                        isCollapsed={isSidebarCollapsed}
                      />
                    );
                  }
                  return null;
                })}
              </Accordion>
            );
          } else if (item.checked && moduleData?.route && moduleData?.parentId === null) {
            return (
              <SidebarLink
                key={moduleData?.moduleId ?? `module-${Math.random()}`}
                href={moduleData?.route ?? '#'}
                icon={moduleData?.icon ?? 'Layout'}
                label={moduleData?.name ?? 'Unknown'}
                isCollapsed={isSidebarCollapsed}
              />
            );
          }
          return null;
        })}
      </div>

      {/* Footer */}
      <div className={`${isSidebarCollapsed ? 'hidden' : 'block'} mb-10`}>
        <p className='text-center text-xs text-gray-500'>&copy; {new Date().getFullYear()} ManStock</p>
      </div>
    </div>
  );
};

export default Sidebar;
