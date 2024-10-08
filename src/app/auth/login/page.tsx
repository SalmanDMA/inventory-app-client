'use client';
import { useLoginMutation } from '@/state/api';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCookies } from 'next-client-cookies';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { useFormik, FormikHelpers } from 'formik';
import { LoginFormValues } from '@/types/formik';
import { ResponseError } from '@/types/response';
import Link from 'next/link';
import { useAppDispatch } from '@/app/redux';
import { setToken, setUserLogin } from '@/state';
import { IUser } from '@/types/model';
import { useEffect, useState } from 'react';

const Login = () => {
  const dispatch = useAppDispatch();
  const setTokenValue = (token: string) => {
    dispatch(setToken(token));
  };

  const setUserLoginValue = (user: IUser) => {
    dispatch(setUserLogin(user));
  };

  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const handleRememberMe = () => {
    if (formik.values.identifier) {
      setRememberMe((prev) => {
        const newValue = !prev;

        if (newValue) {
          localStorage.setItem('identifier', formik.values.identifier);
        } else {
          localStorage.removeItem('identifier');
        }

        return newValue;
      });
    } else {
      toast.error('Username or email is required, please enter username or email');
    }
  };

  useEffect(() => {
    const savedIdentifier = localStorage.getItem('identifier');
    if (savedIdentifier) {
      formik.setFieldValue('identifier', savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const initialValues: LoginFormValues = {
    identifier: '',
    password: '',
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
  });

  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();
  const cookie = useCookies();

  const handleLogin = async (values: LoginFormValues, { resetForm }: FormikHelpers<LoginFormValues>) => {
    try {
      const response = await login({
        identifier: values.identifier,
        password: values.password,
      }).unwrap();

      if (response.success) {
        const expirationDate = new Date();
        expirationDate.setTime(expirationDate.getTime() + response.data.expiresIn * 1000);

        cookie.set('access_token', response.data.token, { path: '/', expires: expirationDate });
        setTokenValue(response.data.token);
        setUserLoginValue(response.data.user);

        toast.success(response.message + ' redirecting to home page...');
        router.push('/dashboard');

        resetForm();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
    }
  };

  const formik = useFormik<LoginFormValues>({
    initialValues,
    validationSchema,
    onSubmit: handleLogin,
  });

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
        <h2 className='mt-6 text-center text-3xl leading-9 font-extrabold text-gray-900'>Sign in to your account</h2>
      </div>
      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <form onSubmit={formik.handleSubmit}>
            <div>
              <label htmlFor='identifier' className='block text-sm font-medium leading-5 text-gray-700'>
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
                  } rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 text-gray-900 bg-white`}
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
                  } rounded-md placeholder-gray-400 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 text-gray-900 bg-white`}
                />
                {formik.touched.password && formik.errors.password ? (
                  <p className='mt-2 text-sm text-red-600'>{formik.errors.password}</p>
                ) : null}
              </div>
            </div>
            <div className='mt-6 flex items-center justify-between'>
              <div className='flex items-center'>
                <input
                  id='remember_me'
                  name='remember'
                  type='checkbox'
                  className='form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out'
                  disabled={!formik.values.identifier}
                  checked={rememberMe}
                  onChange={handleRememberMe}
                />
                <label htmlFor='remember_me' className='ml-2 block text-sm leading-5 text-gray-900'>
                  Remember me
                </label>
              </div>
              <div className='text-sm leading-5'>
                <Link
                  href='/auth/forgot-password'
                  className='font-medium text-blue-500 hover:text-blue-500 focus:outline-none focus:underline transition ease-in-out duration-150'
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
            <div className='mt-6'>
              <span className='block w-full rounded-md shadow-sm'>
                <button
                  type='submit'
                  className='w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:pointer-events-none'
                  disabled={isLoading || !formik.isValid}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
