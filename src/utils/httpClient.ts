import { ResponseError } from '@/types/response';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getPublicId } from './image';

interface IPayloadUpload {
  image: string;
  folder: string;
  prefix: string;
  subFolder?: string;
}

// FetchData
const fetchData = async (url: string, token: string) => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const err = error as ResponseError;
    const errorMessage =
      err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

    toast.error('Action failed: ' + errorMessage);
    return null;
  }
};

export const fetchUserById = (id: string, token: string) => {
  return fetchData(`/users/${id}`, token);
};

export const fetchProductById = (id: string, token: string) => {
  return fetchData(`/products/${id}`, token);
};

export const fetchRoleModuleByRoleId = (roleId: string, token: string) => {
  return fetchData(`/roles/${roleId}/modules`, token);
};

export const fetchBrandById = (id: string, token: string) => {
  return fetchData(`/brands/${id}`, token);
};

export const fetchSupplierById = (id: string, token: string) => {
  return fetchData(`/suppliers/${id}`, token);
};

export const fetchCustomerById = (id: string, token: string) => {
  return fetchData(`/customers/${id}`, token);
};

// Cloudinari
export const deleteAvatarFromCloudinary = async (avatarUrl: string, token: string) => {
  try {
    const publicId = getPublicId(avatarUrl);

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/remove-image`,
      { public_id: publicId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (response.data.success) return response.data;
    else throw new Error(response.data.message);
  } catch (error) {
    const err = error as ResponseError;
    const errorMessage =
      err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

    toast.error('Action failed: ' + errorMessage);
  }
};

export const uploadAvatarToCloudinary = async (payload: IPayloadUpload, token: string) => {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/cloudinary/upload-image`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.success) return response.data;
    else throw new Error(response.data.message);
  } catch (error) {
    const err = error as ResponseError;
    const errorMessage =
      err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

    toast.error('Action failed: ' + errorMessage);
  }
};
