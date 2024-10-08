'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/app/(components)/Navbar';
import Sidebar from '@/app/(components)/Sidebar';
import StoreProvider, { useAppSelector } from './redux';
import { usePathname, useRouter } from 'next/navigation';
import { ToastContainer, Slide, toast } from 'react-toastify';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { useCookies } from 'next-client-cookies';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const isSidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const pathName = usePathname();
  const isAuthPath = pathName.startsWith('/auth');
  const cookie = useCookies();
  const token = cookie.get('access_token');
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const darkTheme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

  useEffect(() => {
    setIsClient(true);
    if (isClient && !token) {
      toast.error('Your session expired, please login again');
      router.push('/auth/login');
    }

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className={`${isDarkMode ? 'dark' : 'light'} flex bg-gray-50 text-gray-900 w-full min-h-screen`}>
        {isAuthPath ? (
          children
        ) : (
          <>
            <Sidebar />
            <main
              className={`flex flex-col w-full h-full py-5 px-7 sm:py-7 sm:px-9 bg-gray-50 ${
                isSidebarCollapsed ? 'md:pl-24' : 'md:pl-72'
              }`}
            >
              <Navbar />
              {children}
            </main>
          </>
        )}
        <ToastContainer
          position='top-right'
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? 'dark' : 'light'}
          transition={Slide}
        />
      </div>
    </ThemeProvider>
  );
};

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <StoreProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </StoreProvider>
  );
};

export default DashboardWrapper;
