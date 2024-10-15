'use client';
import { CreateOrUpdateWarehouseFormValues } from '@/types/formik';
import * as Yup from 'yup';
import { FormikHelpers, useFormik } from 'formik';
import { useCreateWarehouseMutation, useGetUsersQuery, useUpdateWarehouseMutation } from '@/state/api';
import { useEffect } from 'react';
import { Button } from '@mui/material';
import { toast } from 'react-toastify';
import { ResponseError } from '@/types/response';
import { IWarehouse } from '@/types/model';

const WarehouseForm = ({
  type,
  warehouses,
  warehouseId,
  isAnimationModalOpen,
  closeModal,
}: {
  type: 'create' | 'update';
  warehouses?: IWarehouse[];
  warehouseId?: string;
  isAnimationModalOpen: boolean;
  closeModal: () => void;
}) => {
  const { data: users } = useGetUsersQuery();
  const [createWarehouse, { isLoading: isCreating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: isUpdating }] = useUpdateWarehouseMutation();

  const initialValues: CreateOrUpdateWarehouseFormValues = {
    name: '',
    capacity: null,
    location: '',
    description: '',
    picId: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    capacity: Yup.number().required('Capacity is required').min(1, 'Capacity must be greater than 0'),
    location: Yup.string().required('Location is required'),
    description: Yup.string(),
    picId: Yup.string().required('PIC is required'),
  });

  const handleSubmit = async (
    values: CreateOrUpdateWarehouseFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateWarehouseFormValues>
  ) => {
    try {
      let response;
      if (type === 'create') {
        response = await createWarehouse({ ...values }).unwrap();
      } else if (type === 'update') {
        response = await updateWarehouse({ ...values, warehouseId }).unwrap();
      }

      if (response && response.success) {
        toast.success(response.message || `Warehouse ${type} successfully!`);
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

  const formik = useFormik<CreateOrUpdateWarehouseFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values, formikHelpers) => handleSubmit(values, formikHelpers),
  });

  useEffect(() => {
    if (type === 'update' && warehouseId && warehouses) {
      const currentWarehouse = warehouses.find((warehouse) => warehouse.warehouseId === warehouseId);
      if (currentWarehouse) {
        formik.setValues({
          name: currentWarehouse.name,
          capacity: currentWarehouse.capacity,
          location: currentWarehouse.location,
          picId: currentWarehouse.picId,
          description: currentWarehouse.description || '',
        });
      }
    } else {
      formik.resetForm();
    }
  }, [type, warehouseId, warehouses]);

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
        <h2 className='text-2xl font-semibold mb-4'>{type === 'create' ? 'Create Warehouse' : 'Update Warehouse'}</h2>
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

            {/* Capacity Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>Capacity</label>
              <input
                type='number'
                name='capacity'
                value={formik.values.capacity as number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                  formik.touched.capacity && formik.errors.capacity ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.capacity && formik.errors.capacity && (
                <p className='text-red-500 text-sm'>{formik.errors.capacity}</p>
              )}
            </div>

            {/* Location Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>Location</label>
              <input
                type='text'
                name='location'
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                  formik.touched.location && formik.errors.location ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.location && formik.errors.location && (
                <p className='text-red-500 text-sm'>{formik.errors.location}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700'>PIC</label>
              <select
                name='picId'
                value={formik.values.picId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  formik.touched.picId && formik.errors.picId ? 'border-red-500' : ''
                }`}
              >
                <option value='' className='text-gray-900 border-2 border-gray-300 bg-white' disabled>
                  Select a PIC
                </option>
                {users?.data
                  .filter((user) => user.role.name.toLowerCase() === 'manager')
                  .map((user) => (
                    <option
                      key={user.userId}
                      value={user.userId}
                      className='text-gray-700 border-2 border-gray-300 bg-white'
                    >
                      {user.name}
                    </option>
                  ))}
              </select>
              {formik.touched.picId && formik.errors.picId && (
                <p className='text-red-500 text-sm'>{formik.errors.picId}</p>
              )}
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

export default WarehouseForm;
