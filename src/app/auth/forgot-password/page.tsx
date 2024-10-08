'use client';

import { useForgotPasswordMutation } from '@/state/api';
import Image from 'next/image';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { useFormik, FormikHelpers } from 'formik';
import { ForgotPasswordFormValues } from '@/types/formik';
import { ResponseError } from '@/types/response';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const ForgotPassword = () => {
  const [isSuccessResponse, setIsSuccessResponse] = useState<boolean>(false);
  const router = useRouter();

  const initialValues: ForgotPasswordFormValues = {
    identifier: '',
    password: '',
    confirmPassword: '',
  };

  const validationSchema = Yup.object({
    identifier: Yup.string().required('Username or email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), ''], 'Passwords must match')
      .required('Confirm password is required'),
  });

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleForgotPassword = async (
    values: ForgotPasswordFormValues,
    { resetForm }: FormikHelpers<ForgotPasswordFormValues>
  ) => {
    try {
      const response = await forgotPassword({ identifier: values.identifier, newPassword: values.password }).unwrap();

      if (response.success) {
        toast.success(response.message);
        setIsSuccessResponse(true);
        resetForm();
      } else {
        setIsSuccessResponse(false);
        throw new Error(response.message);
      }
    } catch (error) {
      setIsSuccessResponse(false);
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';
      toast.error('Action failed: ' + errorMessage);
    }
  };

  const formik = useFormik<ForgotPasswordFormValues>({
    initialValues,
    validationSchema,
    onSubmit: handleForgotPassword,
  });

  const handleRedirectToLogin = () => {
    router.push('/auth/login');
    setIsSuccessResponse(false);
  };

  return (
    <div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-6 w-full h-full min-h-screen'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Image
          src='https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/a3bjct2zdyoellxszezp.png'
          alt='Workflow'
          width={100}
          height={100}
          className='mx-auto h-10 sm:h-16 w-auto'
        />
        <h2 className='mt-6 text-center text-3xl leading-9 font-extrabold text-gray-900'>Reset Password</h2>
      </div>
      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <form onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor='identifier' className='block text-sm font-medium leading-5  text-gray-700'>
                Username or Email
              </label>
              <div className='mt-1 relative rounded-md shadow-sm'>
                <input
                  id='identifier'
                  name='identifier'
                  placeholder='Type your username or email here...'
                  type='text'
                  value={formik.values.identifier}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formik.touched.identifier && formik.errors.identifier ? 'border-red-500' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-white text-gray-900`}
                />
                {formik.touched.identifier && formik.errors.identifier ? (
                  <p className='mt-2 text-sm text-red-600'>{formik.errors.identifier}</p>
                ) : null}
              </div>
            </div>
            <div className='mt-6'>
              <label htmlFor='password' className='block text-sm font-medium leading-5 text-gray-700'>
                Password
              </label>
              <div className='mt-1 rounded-md shadow-sm'>
                <input
                  id='password'
                  name='password'
                  type='password'
                  value={formik.values.password}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-white text-gray-900`}
                />
                {formik.touched.password && formik.errors.password ? (
                  <p className='mt-2 text-sm text-red-600'>{formik.errors.password}</p>
                ) : null}
              </div>
            </div>
            <div className='mt-6'>
              <label htmlFor='confirmPassword' className='block text-sm font-medium leading-5 text-gray-700'>
                Confirm Password
              </label>
              <div className='mt-1 rounded-md shadow-sm'>
                <input
                  id='confirmPassword'
                  name='confirmPassword'
                  type='password'
                  value={formik.values.confirmPassword}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${
                    formik.touched.confirmPassword && formik.errors.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-white text-gray-900`}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword ? (
                  <p className='mt-2 text-sm text-red-600'>{formik.errors.confirmPassword}</p>
                ) : null}
              </div>
            </div>
            {!isSuccessResponse && (
              <div className='mt-6 flex items-center justify-end'>
                <div className='text-sm leading-5'>
                  <Link
                    href='/auth/login'
                    className='font-medium text-blue-500 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150'
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
            <div className={`mt-6 ${isSuccessResponse ? 'flex justify-between items-center gap-4' : ''}`}>
              <span className='block w-full rounded-md shadow-sm'>
                <button
                  type='submit'
                  className='w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out disabled:opacity-50 disabled::pointer-events-none'
                  disabled={isLoading || !formik.isValid}
                >
                  {isLoading ? 'Loading...' : 'Reset Password'}
                </button>
              </span>
              {isSuccessResponse && (
                <span className='block w-full rounded-md shadow-sm'>
                  <button
                    onClick={handleRedirectToLogin}
                    className='w-full flex justify-center py-2 px-4 border-2 rounded-md border-blue-500 text-blue-500 hover:shadow-md focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:pointer-events-none'
                  >
                    Back to Login
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
