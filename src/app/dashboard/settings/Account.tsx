'use client';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setToken, setUserLogin } from '@/state';
import { useDeactiveAccountMutation } from '@/state/api';
import { ResponseError } from '@/types/response';
import { useCookies } from 'next-client-cookies';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

const Account = () => {
  const dispatch = useAppDispatch();
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [deactiveAccount, { isLoading }] = useDeactiveAccountMutation();
  const userLogin = useAppSelector((state) => state.global.userLogin);
  const router = useRouter();
  const cookie = useCookies();

  const openModal = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsVisible(true);
    }, 10);
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsConfirming(false);
    }, 300);
  };

  const handleDeactivate = async () => {
    try {
      const userId = userLogin?.userId;

      if (!userId) {
        throw new Error('User ID is missing');
      }

      const response = await deactiveAccount({ ids: [userId] }).unwrap();

      if (response.success) {
        toast.success('Your account has been successfully deactivated.');
        cookie.remove('access_token');
        dispatch(setToken(null));
        dispatch(setUserLogin(null));
        router.push('/auth/login');
        closeModal();
      } else {
        throw new Error(response.message || 'Failed to deactivate account');
      }
    } catch (error) {
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
    }
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
  };

  return (
    <div className='p-6 bg-gray-100 rounded-md shadow-lg'>
      <h3 className='text-xl font-bold mb-4 text-red-600'>Deactivate Account</h3>
      <div className='mb-6 p-6 bg-white rounded-md shadow-md'>
        <p className='text-gray-700 mb-4'>
          Are you sure you want to deactivate your account? <strong>This action cannot be undone.</strong>
        </p>
        <button
          onClick={openModal}
          className='w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-700 transition duration-300'
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Deactivate Account'}
        </button>
      </div>

      {isConfirming && (
        <Confirmation
          title='Confirm Deactivation'
          description='Are you absolutely sure? Deactivating your account will permanently remove your data and this cannot be
          undone.'
          closeModal={closeModal}
          handleModalClick={handleModalClick}
          handleDeactivate={handleDeactivate}
          isVisible={isVisible}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default Account;
