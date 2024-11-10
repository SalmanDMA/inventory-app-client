'use client';

import {
  useCreateUploadMutation,
  useForceDeleteUploadsMutation,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetSuppliersQuery,
  useGetProductQuery,
  useUpdateProductMutation,
} from '@/state/api';
import { CreateOrUpdateProductFormValues } from '@/types/formik';
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
import { removeFileExtension } from '@/utils/common';

const Page = () => {
  const { id } = useParams();
  const { data: productData, isLoading: isProductLoading } = useGetProductQuery({ productId: id as string });
  const { data: brands } = useGetBrandsQuery();
  const { data: categories } = useGetCategoriesQuery();
  const { data: suppliers } = useGetSuppliersQuery();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createUpload] = useCreateUploadMutation();
  const [deleteUpload] = useForceDeleteUploadsMutation();

  const token = useAppSelector((state) => state.global.token);
  const router = useRouter();
  const { fileUrl } = useFetchFile(
    productData?.data.imageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${productData?.data.imageId}` : null,
    token as string
  );
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);

  // Initial values
  const initialValues: CreateOrUpdateProductFormValues = {
    name: '',
    costPrice: '',
    brandId: '',
    categoryId: '',
    description: '',
    imageId: '',
    price: '',
    reorderLevel: '',
    rating: '',
    stock: '',
    supplierId: '',
    weight: '',
    width: '',
    height: '',
    publicId: '',
  };

  // Validation schema with Yup
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    costPrice: Yup.number().required('Cost price is required'),
    price: Yup.number().required('Price is required'),
    stock: Yup.number().required('Stock is required'),
    reorderLevel: Yup.number().required('Reorder level is required'),
    categoryId: Yup.string().required('Category is required'),
    brandId: Yup.string().required('Brand is required'),
    supplierId: Yup.string().required('Supplier is required'),
    imageId: Yup.string().required('Image is required'),
    description: Yup.string(),
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
      const payload = { file, image: optimizedBase64Image, folder: 'products', prefix: 'products' };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload-image`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const responseUpload = await createUpload({
          category: 'products',
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

  // Submit handler
  const handleSubmit = async (
    values: CreateOrUpdateProductFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateProductFormValues>
  ) => {
    try {
      const dataToSend = {
        productId: id as string,
        name: values.name,
        costPrice: values.costPrice,
        discount: values.discount,
        rating: values.rating,
        price: values.price,
        stock: values.stock,
        reorderLevel: values.reorderLevel,
        categoryId: values.categoryId,
        brandId: values.brandId,
        supplierId: values.supplierId,
        imageId: values.imageId,
        weight: values.weight,
        height: values.height,
        width: values.width,
        description: values.description,
      };

      const response = await updateProduct(dataToSend).unwrap();

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
        toast.success(response.message || 'Product created successfully!');
        setDeletedImages([]);
        router.push('/dashboard/products');
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
  const formik = useFormik<CreateOrUpdateProductFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (productData) {
      formik.setValues({
        name: productData.data.name || '',
        costPrice: productData.data.costPrice || '',
        discount: productData?.data?.discount || '',
        rating: productData?.data?.rating || '',
        price: productData.data.price || '',
        stock: productData.data.stock || '',
        reorderLevel: productData.data.reorderLevel || '',
        categoryId: productData.data.categoryId || '',
        brandId: productData.data.brandId || '',
        supplierId: productData.data.supplierId,
        imageId: productData?.data?.imageId || '',
        weight: productData?.data?.weight || '',
        height: productData?.data?.height || '',
        width: productData?.data?.width || '',
        description: productData?.data?.description || '',
        publicId: productData?.data?.image?.filename ? removeFileExtension(productData.data.image.filename) : '',
      });
      if (productData.data.imageId) setImagePreview(fileUrl);
    }
  }, [productData, fileUrl]);

  if (isProductLoading) return <p>Loading product data...</p>;

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4'>Edit Product</h2>
      <form onSubmit={formik.handleSubmit} className='bg-white shadow-md rounded-lg p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
              Cost Price<span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              name='costPrice'
              value={formik.values.costPrice ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.costPrice && formik.errors.costPrice ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.costPrice && formik.errors.costPrice ? (
              <p className='text-red-500 text-sm'>{formik.errors.costPrice}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Discount</label>
            <input
              type='number'
              name='discount'
              value={formik.values.discount ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.discount && formik.errors.discount ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.discount && formik.errors.discount ? (
              <p className='text-red-500 text-sm'>{formik.errors.discount}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Rating</label>
            <input
              type='number'
              name='rating'
              value={formik.values.rating ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.rating && formik.errors.rating ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.rating && formik.errors.rating ? (
              <p className='text-red-500 text-sm'>{formik.errors.rating}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Price<span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              name='price'
              value={formik.values.price ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.price && formik.errors.price ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.price && formik.errors.price ? (
              <p className='text-red-500 text-sm'>{formik.errors.price}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Stock<span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              name='stock'
              value={formik.values.stock ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.stock && formik.errors.stock ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.stock && formik.errors.stock ? (
              <p className='text-red-500 text-sm'>{formik.errors.stock}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Reorder Level<span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              name='reorderLevel'
              value={formik.values.reorderLevel ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.reorderLevel && formik.errors.reorderLevel ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.reorderLevel && formik.errors.reorderLevel ? (
              <p className='text-red-500 text-sm'>{formik.errors.reorderLevel}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Category<span className='text-red-500'>*</span>
            </label>
            <select
              name='categoryId'
              value={formik.values.categoryId ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.categoryId && formik.errors.categoryId ? 'border-red-500' : ''
              }`}
            >
              <option value='' className='text-gray-900 border-2 border-gray-300 bg-white' disabled>
                Select a category
              </option>
              {categories?.data.map((category) => (
                <option
                  key={category.categoryId}
                  value={category.categoryId}
                  className='text-gray-700 border-2 border-gray-300 bg-white'
                >
                  {category.name}
                </option>
              ))}
            </select>
            {formik.touched.categoryId && formik.errors.categoryId && (
              <p className='text-red-500 text-sm'>{formik.errors.categoryId}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Brand<span className='text-red-500'>*</span>
            </label>
            <select
              name='brandId'
              value={formik.values.brandId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.brandId && formik.errors.brandId ? 'border-red-500' : ''
              }`}
            >
              <option value='' className='text-gray-900 border-2 border-gray-300 bg-white' disabled>
                Select a brand
              </option>
              {brands?.data.map((brand) => (
                <option
                  key={brand.brandId}
                  value={brand.brandId}
                  className='text-gray-700 border-2 border-gray-300 bg-white'
                >
                  {brand.name}
                </option>
              ))}
            </select>
            {formik.touched.brandId && formik.errors.brandId && (
              <p className='text-red-500 text-sm'>{formik.errors.brandId}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Supplier<span className='text-red-500'>*</span>
            </label>
            <select
              name='supplierId'
              value={formik.values.supplierId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.supplierId && formik.errors.supplierId ? 'border-red-500' : ''
              }`}
            >
              <option value='' className='text-gray-900 border-2 border-gray-300 bg-white' disabled>
                Select a supplier
              </option>
              {suppliers?.data.map((supplier) => (
                <option
                  key={supplier.supplierId}
                  value={supplier.supplierId}
                  className='text-gray-700 border-2 border-gray-300 bg-white'
                >
                  {supplier.name}
                </option>
              ))}
            </select>
            {formik.touched.supplierId && formik.errors.supplierId && (
              <p className='text-red-500 text-sm'>{formik.errors.supplierId}</p>
            )}
          </div>
        </div>

        <div className='mt-6 grid gridcols-1 md:grid-cols-3 gap-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>Weight</label>
            <input
              type='number'
              name='weight'
              value={formik.values.weight ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.weight && formik.errors.weight ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.weight && formik.errors.weight ? (
              <p className='text-red-500 text-sm'>{formik.errors.weight}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Width</label>
            <input
              type='number'
              name='width'
              value={formik.values.width ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.width && formik.errors.width ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.width && formik.errors.width ? (
              <p className='text-red-500 text-sm'>{formik.errors.width}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Height</label>
            <input
              type='number'
              name='height'
              value={formik.values.height ?? ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.height && formik.errors.height ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.height && formik.errors.height ? (
              <p className='text-red-500 text-sm'>{formik.errors.height}</p>
            ) : null}
          </div>
        </div>

        <div className='mt-6'>
          <label className='block text-sm font-medium text-gray-700'>Description</label>
          <textarea
            name='description'
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
              formik.touched.description && formik.errors.description ? 'border-red-500' : ''
            }`}
          />
          {formik.touched.description && formik.errors.description && (
            <p className='text-red-500 text-sm'>{formik.errors.description}</p>
          )}
        </div>

        <div className='mt-6'>
          <label className='block text-sm font-medium text-gray-700'>Image<span className='text-red-500'>*</span></label>
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
    ${loadingUpload || isUpdating ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-blue-700'}`}
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
          {formik.touched.imageId && formik.errors.imageId ? (
            <p className='text-red-500 text-sm'>{formik.errors.imageId}</p>
          ) : null}
        </div>

        <div className='mt-6 flex justify-end'>
          <button
            type='submit'
            disabled={isUpdating || loadingUpload || formik.isSubmitting}
            className={`bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition duration-300`}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;
