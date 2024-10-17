'use client';
import { CreateOrUpdateRoleFormValues } from '@/types/formik';
import * as Yup from 'yup';
import { FormikHelpers, useFormik } from 'formik';
import { useCreateRoleMutation, useUpdateRoleMutation } from '@/state/api';
import { getRandomColor } from '@/utils/common';
import { useEffect } from 'react';
import { Button } from '@mui/material';
import { toast } from 'react-toastify';
import { ResponseError } from '@/types/response';
import { IRole } from '@/types/model';

const RoleForm = ({
  type,
  roles,
  roleId,
  isAnimationModalOpen,
  closeModal,
}: {
  type: 'create' | 'update';
  roles?: IRole[];
  roleId?: string;
  isAnimationModalOpen: boolean;
  closeModal: () => void;
}) => {
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const initialValues: CreateOrUpdateRoleFormValues = {
    name: '',
    alias: '',
    color: '',
    description: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    alias: Yup.string(),
    color: Yup.string(),
    description: Yup.string(),
  });

  const handleSubmit = async (
    values: CreateOrUpdateRoleFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateRoleFormValues>
  ) => {
    try {
      let response;
      if (type === 'create') {
        response = await createRole({ ...values }).unwrap();
      } else if (type === 'update') {
        response = await updateRole({ ...values, roleId }).unwrap();
      }

      if (response && response.success) {
        toast.success(response.message || `Role ${type} successfully!`);
        closeModal();
      } else {
        throw new Error(response?.message || 'Something went wrong');
      }
    } catch (error) {
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formik = useFormik<CreateOrUpdateRoleFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values, formikHelpers) => handleSubmit(values, formikHelpers),
  });

  useEffect(() => {
    if (type === 'update' && roleId && roles) {
      const currentRole = roles.find((role) => role.roleId === roleId);
      if (currentRole) {
        formik.setValues({
          name: currentRole.name || '',
          alias: currentRole.alias || '',
          color: currentRole.color || '',
          description: currentRole.description || '',
        });
      }
    } else {
      formik.resetForm();
      formik.setFieldValue('color', getRandomColor());
    }
  }, [type, roleId, roles]);

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 ${
        isAnimationModalOpen ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
      onClick={closeModal}
    >
      <div
        className={`bg-white p-6 rounded-md shadow-lg max-w-lg w-full transform transition-all duration-300 ${
          isAnimationModalOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <h2 className='text-2xl font-semibold mb-4'>{type === 'create' ? 'Create Role' : 'Update Role'}</h2>
        <form onSubmit={formik.handleSubmit} className='bg-white rounded-lg p-6'>
          <div className='grid grid-cols-1 gap-6'>
            {/* Name Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>Name</label>
              <input
                type='text'
                name='name'
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                  formik.touched.name && formik.errors.name ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.name && formik.errors.name && (
                <p className='text-red-500 text-sm'>{formik.errors.name}</p>
              )}
            </div>

            <div className='grid  grid-cols-1 sm:grid-cols-2 gap-6'>
              {/* Alias Input */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Alias</label>
                <input
                  type='text'
                  name='alias'
                  value={formik.values.alias}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                    formik.touched.alias && formik.errors.alias ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.alias && formik.errors.alias && (
                  <p className='text-red-500 text-sm'>{formik.errors.alias}</p>
                )}
              </div>

              {/* Color Input */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Color</label>
                <input
                  type='color'
                  name='color'
                  value={formik.values.color}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                    formik.touched.color && formik.errors.color ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.color && formik.errors.color && (
                  <p className='text-red-500 text-sm'>{formik.errors.color}</p>
                )}
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>Description</label>
              <textarea
                name='description'
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] resize-none ${
                  formik.touched.description && formik.errors.description ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.description && formik.errors.description && (
                <p className='text-red-500 text-sm'>{formik.errors.description}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className='mt-6 flex justify-end gap-4'>
            <Button
              type='button'
              variant='contained'
              color='error'
              disabled={formik.isSubmitting || isCreating || isUpdating}
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={formik.isSubmitting || isCreating || isUpdating}
            >
              {type === 'create'
                ? formik.isSubmitting
                  ? 'Creating...'
                  : 'Create'
                : formik.isSubmitting
                ? 'Updating...'
                : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;
