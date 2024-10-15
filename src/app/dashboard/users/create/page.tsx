'use client';

import {
  useCreateUploadMutation,
  useCreateUserMutation,
  useForceDeleteUploadsMutation,
  useGetRolesQuery,
} from '@/state/api';
import { CreateOrUpdateUserFormValues } from '@/types/formik';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import { useFormik, FormikHelpers } from 'formik';
import { useState } from 'react';
import { ResponseError } from '@/types/response';
import { ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { optimizeBase64 } from '@/utils/image';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { setUserLogin } from '@/state';

const Page = () => {
  const dispatch = useAppDispatch();
  const userLogin = useAppSelector((state) => state.global.userLogin);
  const token = useAppSelector((state) => state.global.token);
  const { data: rolesData } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [createUpload] = useCreateUploadMutation();
  const [deleteUpload] = useForceDeleteUploadsMutation();

  const router = useRouter();
  const [loadingUpload, setLoadingUpload] = useState<boolean>(false);

  // Initial values
  const initialValues: CreateOrUpdateUserFormValues = {
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    roleId: '',
    avatarId: '',
    publicId: '',
  };

  // Validation schema with Yup
  const validationSchema = Yup.object({
    username: Yup.string().required('Username is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    name: Yup.string().required('Name is required'),
    phone: Yup.string(),
    address: Yup.string(),
    roleId: Yup.string().required('Role is required'),
    avatarId: Yup.string(),
    publicId: Yup.string(),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[0-9]/, 'Password must contain at least one number')
      .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')
      .required('Password is required'),
  });

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [deletedAvatars, setDeletedAvatars] = useState<{ avatarId: string; publicId: string }[]>([]);

  const handleFileUpload = async (file: File, base64Image: string) => {
    try {
      setLoadingUpload(true);

      const optimizedBase64Image = await optimizeBase64(base64Image);
      const payload = { file, image: optimizedBase64Image, folder: 'users', prefix: 'users' };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload-image`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const responseUpload = await createUpload({
          category: 'users',
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
      if (formik.values.avatarId) {
        setDeletedAvatars((prev) => {
          if (formik.values.avatarId) {
            return [...prev, { avatarId: formik.values.avatarId, publicId: formik.values.publicId as string }];
          }
          return prev;
        });
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result as string;
        setAvatarPreview(base64Image);

        const uploadedUrl = await handleFileUpload(file, base64Image);

        if (uploadedUrl) {
          formik.setFieldValue('avatarId', uploadedUrl.uploadId);
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
    values: CreateOrUpdateUserFormValues,
    { setSubmitting }: FormikHelpers<CreateOrUpdateUserFormValues>
  ) => {
    try {
      const dataToSend = {
        username: values.username,
        name: values.name,
        email: values.email,
        address: values.address,
        phone: values.phone,
        roleId: values.roleId,
        avatarId: values.avatarId,
        password: values.password,
      };

      const response = await createUser(dataToSend).unwrap();

      if (deletedAvatars.length > 0) {
        await Promise.all(
          deletedAvatars.map(async (avatar) => {
            await axios.post(
              `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/remove-image`,
              { public_id: avatar.publicId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          })
        );

        await deleteUpload({
          ids: deletedAvatars.map((avatar) => avatar.avatarId),
        }).unwrap();
      }

      if (response.success) {
        if (response.data.userId === userLogin?.userId) {
          dispatch(setUserLogin(response.data));
        }
        toast.success(response.message || 'User created successfully!');
        setDeletedAvatars([]);
        router.push('/dashboard/users');
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
  const formik = useFormik<CreateOrUpdateUserFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: handleSubmit,
  });

  return (
    <div>
      <h2 className='text-2xl font-semibold mb-4'>Create User</h2>
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
              Username<span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              name='username'
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.username && formik.errors.username ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.username && formik.errors.username ? (
              <p className='text-red-500 text-sm'>{formik.errors.username}</p>
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
              Password<span className='text-red-500'>*</span>
            </label>
            <input
              type='password'
              name='password'
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.password && formik.errors.password ? 'border-red-500' : ''
              }`}
            />
            {formik.touched.password && formik.errors.password ? (
              <p className='text-red-500 text-sm'>{formik.errors.password}</p>
            ) : null}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Phone</label>
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
            <label className='block text-sm font-medium text-gray-700'>
              Role<span className='text-red-500'>*</span>
            </label>
            <select
              name='roleId'
              value={formik.values.roleId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                formik.touched.roleId && formik.errors.roleId ? 'border-red-500' : ''
              }`}
            >
              <option value='' className='text-gray-900 border-2 border-gray-300 bg-white' disabled>
                Select a role
              </option>
              {rolesData?.data.map((role) => (
                <option
                  key={role.roleId}
                  value={role.roleId}
                  className='text-gray-700 border-2 border-gray-300 bg-white'
                >
                  {role.name}
                </option>
              ))}
            </select>
            {formik.touched.roleId && formik.errors.roleId && (
              <p className='text-red-500 text-sm'>{formik.errors.roleId}</p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>Avatar</label>
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
                  {avatarPreview ? (
                    <div className='relative w-40 h-40 mb-4'>
                      <Image
                        src={avatarPreview}
                        alt='Avatar Preview'
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
    ${loadingUpload || isCreating ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:bg-blue-700'}`}
                  >
                    <span>{avatarPreview ? 'Change' : 'Upload'} a file</span>
                    <input
                      id='file-upload'
                      name='file-upload'
                      type='file'
                      className='sr-only'
                      accept='image/jpeg, image/png, image/jpg'
                      onChange={(e) => handleFileChange(e.target.files?.[0] as File)}
                      disabled={loadingUpload || isCreating}
                    />
                  </label>
                  <p className='pl-1 text-gray-500'>or drag and drop</p>
                </div>
                <p className='text-xs text-gray-500'>PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-6 flex justify-end'>
          <button
            type='submit'
            disabled={loadingUpload || isCreating || formik.isSubmitting}
            className={`bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition duration-300`}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Page;
