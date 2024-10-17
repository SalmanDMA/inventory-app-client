'use client';
import { CreateOrUpdateBrandFormValues } from '@/types/formik';
import * as Yup from 'yup';
import { FormikHelpers, useFormik } from 'formik';
import {
  useCreateBrandMutation,
  useCreateUploadMutation,
  useForceDeleteUploadsMutation,
  useUpdateBrandMutation,
} from '@/state/api';
import { removeFileExtension } from '@/utils/common';
import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { toast } from 'react-toastify';
import { ResponseError } from '@/types/response';
import { IBrand } from '@/types/model';
import axios from 'axios';
import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { optimizeBase64 } from '@/utils/image';
import { useFetchFile } from '@/app/hooks/useFetchFile';
import { useAppSelector } from '@/app/redux';

const BrandForm = ({
  type,
  brands,
  brandId,
  isAnimationModalOpen,
  closeModal,
}: {
  type: 'create' | 'update';
  brands?: IBrand[];
  brandId?: string;
  isAnimationModalOpen: boolean;
  closeModal: () => void;
}) => {
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();
  const [createUpload] = useCreateUploadMutation();
  const [deleteUpload] = useForceDeleteUploadsMutation();

  // Initialize form values
  const initialValues: CreateOrUpdateBrandFormValues = {
    name: '',
    alias: '',
    color: '',
    imageId: '',
    description: '',
    publicId: '',
  };

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    alias: Yup.string(),
    color: Yup.string(),
    imageId: Yup.string(),
    description: Yup.string(),
    publicId: Yup.string(),
  });

  // Initialize formik
  const formik = useFormik<CreateOrUpdateBrandFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values, formikHelpers) => handleSubmit(values, formikHelpers),
  });

  const token = useAppSelector((state) => state.global.token);
  const { fileUrl } = useFetchFile(
    formik.values.imageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${formik.values.imageId}` : null,
    token as string
  );
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [deletedImages, setDeletedImages] = useState<{ imageId: string; publicId: string }[]>([]);

  // Function to handle file upload
  const handleFileUpload = async (file: File, base64Image: string) => {
    try {
      setLoadingUpload(true);
      const optimizedBase64Image = await optimizeBase64(base64Image);
      const payload = { file, image: optimizedBase64Image, folder: 'brands', prefix: 'brands' };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload-image`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const responseUpload = await createUpload({
          category: 'brands',
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

  // Handle file change
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
    if (files.length) {
      handleFileChange(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Handle form submission
  const handleSubmit = async (
    values: CreateOrUpdateBrandFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateBrandFormValues>
  ) => {
    try {
      let response;
      if (type === 'create') {
        response = await createBrand({
          name: values.name,
          alias: values.alias || undefined,
          color: values.color || undefined,
          description: values.description || undefined,
          imageId: values.imageId || undefined,
        }).unwrap();
      } else if (type === 'update') {
        response = await updateBrand({
          name: values.name,
          alias: values.alias || undefined,
          color: values.color || undefined,
          description: values.description || undefined,
          imageId: values.imageId || undefined,
          brandId: brandId as string,
        }).unwrap();
      }

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

        await deleteUpload({ ids: deletedImages.map((image) => image.imageId) }).unwrap();
      }

      if (response && response.success) {
        toast.success(response.message || `Brand ${type} successfully!`);
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
    if (type === 'update' && brandId && brands) {
      const currentBrand = brands.find((brand) => brand.brandId === brandId);
      if (currentBrand) {
        formik.setValues({
          name: currentBrand.name || '',
          alias: currentBrand.alias || '',
          color: currentBrand.color || '',
          imageId: currentBrand.imageId || '',
          publicId: currentBrand.image?.filename ? removeFileExtension(currentBrand.image.filename) : '',
          description: currentBrand.description || '',
        });
        if (currentBrand.imageId) {
          setImagePreview(fileUrl);
        }
      }
    } else {
      formik.resetForm();
    }
  }, [type, brandId, brands, fileUrl]);

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
        <h2 className='text-2xl font-semibold mb-4'>{type === 'create' ? 'Create Brand' : 'Update Brand'}</h2>
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

            {/* Image */}
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
    ${
      loadingUpload || isCreating || isUpdating
        ? 'opacity-50 cursor-not-allowed pointer-events-none'
        : 'hover:bg-blue-700'
    }`}
                    >
                      <span>{imagePreview ? 'Change' : 'Upload'} a file</span>
                      <input
                        id='file-upload'
                        name='file-upload'
                        type='file'
                        className='sr-only'
                        accept='image/jpeg, image/png, image/jpg'
                        onChange={(e) => handleFileChange(e.target.files?.[0] as File)}
                        disabled={loadingUpload || isCreating || isUpdating}
                      />
                    </label>
                    <p className='pl-1 text-gray-500'>or drag and drop</p>
                  </div>
                  <p className='text-xs text-gray-500'>PNG, JPG up to 2MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className='mt-6 flex justify-end gap-4'>
            <Button
              type='button'
              variant='contained'
              color='error'
              disabled={formik.isSubmitting || isCreating || isUpdating || loadingUpload}
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={formik.isSubmitting || isCreating || isUpdating || loadingUpload}
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

export default BrandForm;
