'use client';

import {
  useCreateUploadMutation,
  useForceDeleteUploadsMutation,
  useGetCustomerQuery,
  useUpdateCustomerMutation,
} from '@/state/api';
import { CreateOrUpdateCustomerFormValues } from '@/types/formik';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { useFormik, FormikHelpers } from 'formik';
import { useEffect, useState } from 'react';
import { ResponseError } from '@/types/response';
import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { optimizeBase64 } from '@/utils/image';
import axios from 'axios';
import { useAppSelector } from '@/app/redux';
import { useFetchFile } from '@/app/hooks/useFetchFile';
import { formatToISOString, formatToMMDDYYYY, removeFileExtension } from '@/utils/common';

const Page = () => {
  const { id } = useParams();
  const { data: customerData, isLoading: isCustomerLoading } = useGetCustomerQuery({ customerId: id as string });
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [createUpload] = useCreateUploadMutation();
  const [deleteUpload] = useForceDeleteUploadsMutation();

  const token = useAppSelector((state) => state.global.token);
  const router = useRouter();
  const { fileUrl } = useFetchFile(
    customerData?.data.imageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${customerData?.data.imageId}` : null,
    token as string
  );
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);

  // Initial values
  const initialValues: CreateOrUpdateCustomerFormValues = {
    companyName: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    contractStartDate: '',
    contractEndDate: '',
    paymentTerms: '',
    creditLimit: '',
    discount: '',
    imageId: '',
    publicId: '',
  };

  // Validation schema with Yup
  const validationSchema = Yup.object({
    companyName: Yup.string(),
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    phone: Yup.string().required('Phone is required'),
    address: Yup.string(),
    taxNumber: Yup.string(),
    contractStartDate: Yup.string(),
    contractEndDate: Yup.string(),
    paymentTerms: Yup.string(),
    creditLimit: Yup.string(),
    discount: Yup.string(),
    imageId: Yup.string(),
    publicId: Yup.string(),
  });

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [deletedImages, setDeletedImages] = useState<{ imageId: string; publicId: string }[]>([]);

  const handleFileUpload = async (file: File, base64Image: string) => {
    try {
      setLoadingUpload(true);

      const optimizedBase64Image = await optimizeBase64(base64Image);
      const payload = { file, image: optimizedBase64Image, folder: 'customers', prefix: 'customers' };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload-image`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const responseUpload = await createUpload({
          category: 'customers',
          extension: file.type.split('/')[1],
          filename: `${response.data.data.public_id}.${file.type.split('/')[1]}`,
          filenameOrigin: file.name,
          mime: file.type,
          path: response.data.data.url,
          size: file.size,
          type: 'image',
        }).unwrap();

        if (responseUpload.success) setLoadingUpload(false);
        return { uploadId: responseUpload.data.uploadId, publicId: response.data.data.public_id };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
      setLoadingUpload(false);
      return null;
    }
  };

  const handleFileChange = async (file: File) => {
    if (file) {
      if (formik.values.imageId) {
        setDeletedImages((prev) => {
          if (formik.values.imageId) {
            return [...prev, { imageId: formik.values.imageId, publicId: formik.values.publicId as string }];
          }
          return prev;
        });
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        setImagePreview(base64Image);

        const uploadedUrl = await handleFileUpload(file, base64Image);

        if (uploadedUrl) {
          formik.setFieldValue('imageId', uploadedUrl.uploadId);
          formik.setFieldValue('publicId', uploadedUrl.publicId);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) handleFileChange(files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleSubmit = async (
    values: CreateOrUpdateCustomerFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateCustomerFormValues>
  ) => {
    try {
      const dataToSend = {
        customerId: id as string,
        companyName: values.companyName || undefined,
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address || undefined,
        taxNumber: values.taxNumber || undefined,
        contractStartDate: formatToISOString(values.contractStartDate),
        contractEndDate: formatToISOString(values.contractEndDate),
        paymentTerms: values.paymentTerms || undefined,
        creditLimit: values.creditLimit || undefined,
        discount: values.discount || undefined,
        imageId: values.imageId || undefined,
      };

      const response = await updateCustomer(dataToSend).unwrap();

      if (deletedImages.length > 0) {
        await Promise.all(
          deletedImages.map(async (image) => {
            await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/remove-image`,
              { public_id: image.publicId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          })
        );

        await deleteUpload({
          ids: deletedImages.map((image) => image.imageId),
        }).unwrap();
      }

      if (response.success) {
        toast.success(response.message || 'Customer updated successfully!');
        setDeletedImages([]);
        router.push('/dashboard/customers');
      } else {
        throw new Error(response.message);
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

  // Formik setup
  const formik = useFormik<CreateOrUpdateCustomerFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (customerData) {
      formik.setValues({
        companyName: customerData.data.companyName || '',
        name: customerData.data.name || '',
        email: customerData.data.email || '',
        phone: customerData.data.phone || '',
        address: customerData.data.address || '',
        taxNumber: customerData.data.taxNumber || '',
        contractStartDate: formatToMMDDYYYY(customerData.data.contractStartDate),
        contractEndDate: formatToMMDDYYYY(customerData.data.contractEndDate),
        paymentTerms: customerData.data.paymentTerms || '',
        creditLimit: customerData.data.creditLimit || '',
        discount: customerData.data.discount || '',
        imageId: customerData.data.imageId || '',
        publicId: customerData?.data?.image?.filename ? removeFileExtension(customerData.data.image.filename) : '',
      });

      if (customerData.data.imageId) setImagePreview(fileUrl);
    }
  }, [customerData, fileUrl]);

  if (isCustomerLoading) return <p>Loading customer data...</p>;

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4'>Edit Customer</h2>
      <form onSubmit={formik.handleSubmit} className='bg-white shadow-md rounded-lg p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Company Name</label>
            <input
              type='text'
              name='companyName'
              value={formik.values.companyName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.companyName && formik.errors.companyName ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.companyName && formik.errors.companyName ? (
              <p className='text-red-500 text-sm'>{formik.errors.companyName}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Name<span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.name && formik.errors.name ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.name && formik.errors.name ? (
              <p className='text-red-500 text-sm'>{formik.errors.name}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Email<span className='text-red-500'>*</span>
            </label>
            <input
              type='email'
              name='email'
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.email && formik.errors.email ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.email && formik.errors.email ? (
              <p className='text-red-500 text-sm'>{formik.errors.email}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Phone<span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='phone'
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.phone && formik.errors.phone ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.phone && formik.errors.phone ? (
              <p className='text-red-500 text-sm'>{formik.errors.phone}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Address</label>
            <input
              type='text'
              name='address'
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.address && formik.errors.address ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.address && formik.errors.address ? (
              <p className='text-red-500 text-sm'>{formik.errors.address}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Tax Number</label>
            <input
              type='text'
              name='taxNumber'
              value={formik.values.taxNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.taxNumber && formik.errors.taxNumber ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.taxNumber && formik.errors.taxNumber ? (
              <p className='text-red-500 text-sm'>{formik.errors.taxNumber}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Contract Start Date</label>
            <input
              type='date'
              name='contractStartDate'
              value={formik.values.contractStartDate as string}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.contractStartDate && formik.errors.contractStartDate ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.contractStartDate && formik.errors.contractStartDate ? (
              <p className='text-red-500 text-sm'>{formik.errors.contractStartDate}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Contract End Date</label>
            <input
              type='date'
              name='contractEndDate'
              value={formik.values.contractEndDate as string}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.contractEndDate && formik.errors.contractEndDate ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.contractEndDate && formik.errors.contractEndDate ? (
              <p className='text-red-500 text-sm'>{formik.errors.contractEndDate}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Credit Limit</label>
            <input
              type='number'
              name='creditLimit'
              value={formik.values.creditLimit}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.creditLimit && formik.errors.creditLimit ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.creditLimit && formik.errors.creditLimit ? (
              <p className='text-red-500 text-sm'>{formik.errors.creditLimit}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Discount</label>
            <input
              type='number'
              name='discount'
              value={formik.values.discount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.discount && formik.errors.discount ? 'border-red-500' : ''
              }`}
              max={5}
            />
            {formik.touched.discount && formik.errors.discount ? (
              <p className='text-red-500 text-sm'>{formik.errors.discount}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700'>Image</label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md ${
              isDragOver ? 'border-blue-500 bg-blue-100' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className='space-y-1 text-center'>
              <div className='flex justify-center items-center'>
                {imagePreview ? (
                  <div className='relative w-40 h-40 mb-4'>
                    <Image
                      src={imagePreview}
                      alt='Image Preview'
                      className='w-full h-full object-cover'
                      width={200}
                      height={200}
                    />
                  </div>
                ) : (
                  <ImagePlus className='w-12 h-12 text-gray-400' />
                )}
              </div>
              <div className='flex items-center text-sm text-gray-600'>
                <label
                  htmlFor='file-upload'
                  className={`relative cursor-pointer bg-blue-500 rounded-md font-medium text-white p-1 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500
    ${loadingUpload || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                >
                  <span>{imagePreview ? 'Change' : 'Upload'} a file</span>
                  <input
                    id='file-upload'
                    name='file-upload'
                    type='file'
                    className='sr-only'
                    accept='image/jpeg, image/png, image/jpg'
                    onChange={(e) => handleFileChange(e.target.files?.[0] as File)}
                    disabled={loadingUpload || isUpdating}
                  />
                </label>
                <p className='pl-1 text-gray-500'>or drag and drop</p>
              </div>
              <p className='text-xs text-gray-500'>PNG, JPG up to 2MB</p>
            </div>
          </div>
        </div>

        <div className='mt-6 flex justify-end'>
          <button
            type='submit'
            disabled={isUpdating || loadingUpload || formik.isSubmitting}
            className='bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50'
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;
