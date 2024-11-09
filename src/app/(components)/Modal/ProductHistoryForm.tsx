'use client';
import { CreateOrUpdateProductHistoryFormValues } from '@/types/formik';
import * as Yup from 'yup';
import { FormikHelpers, useFormik } from 'formik';
import { useCreateProductHistoryMutation, useGetProductsQuery, useUpdateProductHistoryMutation } from '@/state/api';
import { useEffect } from 'react';
import { Button } from '@mui/material';
import { toast } from 'react-toastify';
import { ResponseError } from '@/types/response';
import { IProductHistory } from '@/types/model';

const ProductHistoryForm = ({
  type,
  productHistories,
  productHistoryId,
  isAnimationModalOpen,
  closeModal,
}: {
  type: 'create' | 'update';
  productHistories?: IProductHistory[];
  productHistoryId?: string;
  isAnimationModalOpen: boolean;
  closeModal: () => void;
}) => {
  const { data: products } = useGetProductsQuery();
  const [createProductHistory, { isLoading: isCreating }] = useCreateProductHistoryMutation();
  const [updateProductHistory, { isLoading: isUpdating }] = useUpdateProductHistoryMutation();

  // Initialize form values
  const initialValues: CreateOrUpdateProductHistoryFormValues = {
    newPrice: '',
    productId: '',
  };

  // Validation schema
  const validationSchema = Yup.object({
    newPrice: Yup.number().required('New price is required'),
    productId: Yup.string().required('Product id is required'),
  });

  // Initialize formik
  const formik = useFormik<CreateOrUpdateProductHistoryFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values, formikHelpers) => handleSubmit(values, formikHelpers),
  });

  // Handle form submission
  const handleSubmit = async (
    values: CreateOrUpdateProductHistoryFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateProductHistoryFormValues>
  ) => {
    try {
      let response;
      if (type === 'create') {
        response = await createProductHistory({
          newPrice: values.newPrice,
          productId: values.productId,
        }).unwrap();
      } else if (type === 'update') {
        response = await updateProductHistory({
          newPrice: values.newPrice,
          productId: values.productId,
          productHistoryId: productHistoryId as string,
        }).unwrap();
      }

      if (response && response.success) {
        toast.success(response.message || `ProductHistory ${type} successfully!`);
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

  // Handle form reset and data prefill for update
  useEffect(() => {
    if (type === 'update' && productHistoryId && productHistories) {
      const currentProductHistory = productHistories.find(
        (productHistory) => productHistory.productHistoryId === productHistoryId
      );
      if (currentProductHistory) {
        formik.setValues({
          newPrice: currentProductHistory.newPrice || '',
          productId: currentProductHistory.productId || '',
        });
      }
    } else {
      formik.resetForm();
    }
  }, [type, productHistoryId, productHistories]);

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
        <h2 className='text-2xl font-semibold mb-4'>
          {type === 'create' ? 'Create ProductHistory' : 'Update ProductHistory'}
        </h2>
        <form onSubmit={formik.handleSubmit} className='bg-white rounded-lg p-6'>
          {/* New Price Input */}
          <div>
            <label className='block text-sm font-medium text-gray-700'>New Price</label>
            <input
              type='number'
              name='newPrice'
              value={formik.values.newPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                formik.touched.newPrice && formik.errors.newPrice ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.newPrice && formik.errors.newPrice && (
              <p className='text-red-500 text-sm'>{formik.errors.newPrice}</p>
            )}
          </div>

          {/* Product Input */}
          <div className='mt-6'>
            <label className='block text-sm font-medium text-gray-700'>Product</label>
            <select
              name='productId'
              value={formik.values.productId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.productId && formik.errors.productId ? 'border-red-500' : ''
              }`}
            >
              <option value='' className='text-gray-900 border-2 border-gray-300 bg-white' disabled>
                Select a Product
              </option>
              {products?.data.map((product) => (
                <option
                  key={product.productId}
                  value={product.productId}
                  className='text-gray-700 border-2 border-gray-300 bg-white'
                >
                  {product.name}
                </option>
              ))}
            </select>
            {formik.touched.productId && formik.errors.productId && (
              <p className='text-red-500 text-sm'>{formik.errors.productId}</p>
            )}
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

export default ProductHistoryForm;
