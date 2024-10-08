'use client';
import { useState } from 'react';
import { Lock, Settings, Eye, LogOut } from 'lucide-react';
import ChangePassword from './ChangePassword';
import Tooltip from '@/app/(components)/Tooltip';
import Preferences from './Preferences';
import Privacy from './Privacy';
import Account from './Account';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('changePassword');

  const renderContent = () => {
    switch (activeTab) {
      case 'changePassword':
        return <ChangePassword />;
      case 'privacy':
        return <Privacy />;
      case 'Preferences':
        return <Preferences />;
      case 'Account':
        return <Account />;
      default:
        return null;
    }
  };

  return (
    <div className='flex flex-col sm:flex-row bg-gray-100 h-full gap-10'>
      {/* Navigasi Kiri - Tersembunyi di layar kecil */}
      <div className='w-full sm:w-1/4 bg-white p-5 shadow-md rounded-md'>
        <h2 className='text-center sm:text-start text-xl font-semibold mb-4'>Settings</h2>
        <ul className='flex flex-row sm:flex-col items-center justify-evenly sm:justify-normal sm:space-y-2'>
          {[
            { name: 'Change Password', icon: <Lock className='sm:mr-2' />, tab: 'changePassword' },
            { name: 'Privacy Settings', icon: <Settings className='sm:mr-2' />, tab: 'privacy' },
            { name: 'Preferences', icon: <Eye className='sm:mr-2' />, tab: 'Preferences' },
            { name: 'Account', icon: <LogOut className='sm:mr-2' />, tab: 'Account' },
          ].map(({ name, icon, tab }) => (
            <li key={tab} className='w-max sm:w-full relative'>
              <Tooltip text={name}>
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center p-2 rounded-lg hover:bg-gray-200 w-full ${
                    activeTab === tab ? 'bg-gray-300' : ''
                  }`}
                >
                  {icon}
                  <span className='hidden sm:inline'>{name}</span>
                </button>
              </Tooltip>
            </li>
          ))}
        </ul>
      </div>

      {/* Konten Kanan */}
      <div className='w-full sm:w-3/4 p-5 bg-white shadow-md rounded-md'>{renderContent()}</div>
    </div>
  );
};

export default SettingsPage;
