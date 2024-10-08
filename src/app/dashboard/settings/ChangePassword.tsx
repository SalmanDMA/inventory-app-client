'use client';

import { useChangePasswordMutation } from '@/state/api';
import { ChangePasswordFormValues } from '@/types/formik';
import { ResponseError } from '@/types/response';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import * as Yup from 'yup';

const ChangePassword = () => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleChangePassword = async (values: ChangePasswordFormValues, { resetForm }: { resetForm: () => void }) => {
    try {
      const response = await changePassword(values).unwrap();

      if (response.success) {
        toast.success(response.message);
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

  const formik = useFormik<ChangePasswordFormValues>({
    initialValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    validationSchema: Yup.object({
      oldPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
        .required('Password is required'),
      confirmNewPassword: Yup.string()
        .required('Confirm new password is required')
        .oneOf([Yup.ref('newPassword'), ''], 'Passwords must match'),
    }),
    onSubmit: handleChangePassword,
  });

  const passwordFields = [
    { name: 'oldPassword', label: 'Current Password' },
    { name: 'newPassword', label: 'New Password' },
    { name: 'confirmNewPassword', label: 'Confirm New Password' },
  ];

  return (
    <div className='p-6 bg-gray-100 rounded-md shadow-lg'>
      <h2 className='text-xl font-bold mb-6 text-center'>Change Password</h2>
      <div className='mb-6 p-6 bg-white rounded-md shadow-md'>
        <form onSubmit={formik.handleSubmit}>
          {passwordFields.map(({ name, label }) => {
            const fieldKey = name as keyof ChangePasswordFormValues;
            return (
              <div key={name} className='mb-4'>
                <label className='block text-sm font-semibold mb-2'>{label}</label>
                <input
                  type='password'
                  name={fieldKey}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values[fieldKey]}
                  className={`w-full p-2 mt-1 border ${
                    formik.touched[fieldKey] && formik.errors[fieldKey] ? 'border-red-500' : 'border-gray-300'
                  } rounded-md`}
                />
                {formik.touched[fieldKey] && formik.errors[fieldKey] && (
                  <p className='text-red-500 text-sm mt-1'>{formik.errors[fieldKey]}</p>
                )}
              </div>
            );
          })}
          <button
            type='submit'
            className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none'
            disabled={isLoading || formik.isSubmitting || !formik.isValid}
          >
            Update Password
          </button>
        </form>
        <div className='mt-4 text-xs text-gray-500'>
          <p>
            <strong>Note:</strong> Your password must be at least 8 characters long, contain at least one uppercase
            letter, one lowercase letter, and one number. This action will replace your current password with a new one,
            so be careful.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
