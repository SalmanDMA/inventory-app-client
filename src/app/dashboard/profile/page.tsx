'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  useCreateUploadMutation,
  useForceDeleteUploadsMutation,
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/state/api';
import Image from 'next/image';
import { Map, Phone } from 'lucide-react';
import Header from '@/app/(components)/Header';
import { ResponseError } from '@/types/response';
import { toast } from 'react-toastify';
import { CreateOrUpdateUserFormValues } from '@/types/formik';
import { setUserLogin } from '@/state';
import { useAppDispatch, useAppSelector } from '@/app/redux';
import { optimizeBase64 } from '@/utils/image';
import { deleteAvatarFromCloudinary, uploadAvatarToCloudinary } from '@/utils/httpClient';
import React from 'react';
import { useFetchFile } from '@/app/hooks/useFetchFile';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { data: user, isLoading } = useUserProfileQuery();
  const [updateUserProfile, { isLoading: isLoadingUpdateProfile }] = useUpdateUserProfileMutation();
  const [createUpload, { isLoading: isLoadingCreateUpload }] = useCreateUploadMutation();
  const [deleteUpload, { isLoading: isLoadingDeleteUpload }] = useForceDeleteUploadsMutation();
  const token = useAppSelector((state) => state.global.token);

  const { fileUrl } = useFetchFile(
    user?.data?.avatarId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${user?.data?.avatarId}` : null,
    token as string
  );

  const [isEditingForm, setIsEditingForm] = useState<boolean>(false);
  const inputFileAvatar = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoadingUploadAvatar, setIsLoadingUploadAvatar] = useState<boolean>(false);

  const handleEditAvatar = () => {
    inputFileAvatar.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAvatar = async () => {
    const file = inputFileAvatar.current?.files?.[0];

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2 MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG and PNG files are allowed');
        return;
      }

      try {
        setIsLoadingUploadAvatar(true);
        const base64Image = avatarPreview;

        if (user?.data?.avatarId && user?.data?.avatar) {
          await deleteAvatarFromCloudinary(user.data.avatar.path, token as string);
          await deleteUpload({
            ids: [user.data.avatarId],
          }).unwrap();
        }

        const optimizedBase64Image = await optimizeBase64(base64Image as string);

        const payload = {
          image: optimizedBase64Image as string,
          folder: 'users',
          prefix: 'users',
        };

        const response = await uploadAvatarToCloudinary(payload, token as string);

        if (response.success) {
          const responseUpload = await createUpload({
            category: 'users',
            extension: file.type.split('/')[1],
            filename: `${response.data.public_id}.${file.type.split('/')[1]}`,
            filenameOrigin: file.name,
            mime: file.type,
            path: response.data.url,
            size: file.size,
            type: 'image',
          }).unwrap();

          if (responseUpload.success) {
            const responseUpdate = await updateUserProfile({
              username: user?.data?.username as string,
              name: user?.data?.name as string,
              email: user?.data?.email as string,
              address: user?.data?.address as string,
              phone: user?.data?.phone as string,
              avatarId: responseUpload.data.uploadId,
              roleId: user?.data?.roleId as string,
            }).unwrap();

            if (responseUpdate.success) {
              dispatch(setUserLogin(responseUpdate.data));
              toast.success('Avatar updated successfully');
              setAvatarPreview(null);
            } else {
              throw new Error(responseUpdate.message);
            }
          } else {
            throw new Error(responseUpload.message);
          }
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        const err = error as ResponseError;
        const errorMessage =
          err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

        toast.error('Action failed: ' + errorMessage);
      } finally {
        setIsLoadingUploadAvatar(false);
      }
    }
  };

  const handleUpdateProfile = async (values: CreateOrUpdateUserFormValues) => {
    try {
      const response = await updateUserProfile({
        ...values,
        avatarId: user?.data?.avatarId,
      }).unwrap();

      if (response.success) {
        toast.success('Profile updated successfully');
        dispatch(setUserLogin(response.data));
        setIsEditingForm(false);
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

  const formik = useFormik<CreateOrUpdateUserFormValues>({
    initialValues: {
      username: '',
      name: '',
      email: '',
      address: '',
      phone: '',
      roleId: '',
      avatarId: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required'),
      name: Yup.string().required('Name is required').min(3, 'Name must be at least 3 characters'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      address: Yup.string().required('Address is required'),
      phone: Yup.string().required('Phone number is required'),
    }),
    onSubmit: handleUpdateProfile,
  });

  useEffect(() => {
    if (user) {
      formik.setValues({
        username: user.data.username || '',
        name: user.data.name || '',
        email: user.data.email || '',
        address: user.data.address || '',
        phone: user.data.phone || '',
        roleId: user.data.roleId || '',
        avatarId: user.data.avatarId || '',
      });
    }
  }, [user]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <Header name='Profile' />
      <div className='flex flex-col lg:flex-row mt-6 gap-10'>
        {/* Profile Card */}
        <div className='w-full lg:w-1/3 p-6 border border-gray-200 rounded-md shadow-md bg-white flex flex-col justify-center items-center'>
          <div className='flex justify-center w-full'>
            <div className='relative flex justify-center w-40 h-40'>
              <Image
                src={
                  avatarPreview ||
                  fileUrl ||
                  'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/m0vrgvjze72wxgqqsrad.png'
                }
                alt='avatar'
                width={300}
                height={300}
                className='w-full rounded-full object-cover'
              />
              <button
                type='button'
                onClick={handleEditAvatar}
                className='absolute bottom-0 right-4 bg-gray-200 p-2 rounded-full cursor-pointer'
              >
                ✏️
              </button>
              <input
                type='file'
                accept='image/png, image/jpeg, image/jpg'
                className='hidden'
                ref={inputFileAvatar}
                onChange={handleAvatarChange}
              />
            </div>
          </div>
          {avatarPreview && (
            <div className='my-4 flex flex-col items-center'>
              <div className='mt-4 flex gap-3'>
                <button
                  className='bg-blue-500 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:pointer-events-none'
                  onClick={() => {
                    handleUpdateAvatar();
                  }}
                  disabled={isLoadingUploadAvatar}
                >
                  {isLoadingUploadAvatar ? 'Uploading...' : 'Save'}
                </button>
                <button
                  className='bg-gray-300 px-4 py-2 rounded-md disabled:opacity-50 disabled:pointer-events-none'
                  onClick={() => setAvatarPreview(null)}
                  disabled={isLoadingUploadAvatar}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className='mt-2 text-center flex flex-col gap-3'>
            <h2 className='text-2xl font-semibold'>{user?.data?.name}</h2>
            <p className='bg-yellow-500 text-white px-4 py-2 rounded-md max-w-max m-auto'>
              {user?.data?.role?.name.toLocaleUpperCase()}
            </p>
            <div className='text-sm text-gray-500 flex justify-center items-center gap-3'>
              <p className='flex items-center gap-1'>
                <Map className='w-4 h-4' />
                {user?.data?.address} -{' '}
              </p>
              <p className='flex items-center gap-1'>
                <Phone className='w-4 h-4' />
                {user?.data?.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className='w-full lg:w-2/3 py-6 px-10 border border-gray-200 rounded-md shadow-md bg-white'>
          <form onSubmit={formik.handleSubmit} className='space-y-4'>
            {['username', 'name', 'email', 'address', 'phone'].map((field) => {
              const fieldKey = field as keyof CreateOrUpdateUserFormValues;
              return (
                <div key={field}>
                  <label className='block text-sm font-semibold'>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type={fieldKey === 'email' ? 'email' : 'text'}
                    name={fieldKey}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values[fieldKey]}
                    disabled={!isEditingForm}
                    className={`w-full p-2 mt-1 border ${
                      formik.touched[fieldKey] && formik.errors[fieldKey] ? 'border-red-500' : 'border-gray-300'
                    } rounded-md bg-white text-gray-900`}
                  />
                  {formik.touched[fieldKey] && formik.errors[fieldKey] && (
                    <p className='text-red-500 text-sm mt-1'>{formik.errors[fieldKey]}</p>
                  )}
                </div>
              );
            })}

            <div className='flex justify-end gap-4'>
              {isEditingForm ? (
                <>
                  <button
                    type='button'
                    onClick={() => setIsEditingForm(false)}
                    className='bg-gray-300 text-gray-700 py-2 px-4 rounded-md'
                  >
                    Cancel Edit
                  </button>
                  <button
                    type='submit'
                    className='bg-blue-500 text-white py-2 px-4 rounded-md'
                    disabled={isLoadingUpdateProfile || isLoadingCreateUpload || isLoadingDeleteUpload}
                  >
                    {isLoadingUpdateProfile ? 'Updating...' : 'Update Profile'}
                  </button>
                </>
              ) : (
                <button
                  type='button'
                  onClick={() => setIsEditingForm(true)}
                  className='bg-blue-500 text-white py-2 px-4 rounded-md'
                >
                  Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Profile;
