import {
  CreateOrUpdateBrandFormValues,
  CreateOrUpdateCategoryFormValues,
  CreateOrUpdateModuleFormValues,
  CreateOrUpdateModuleTypeFormValues,
  CreateOrUpdateProductFormValues,
  CreateOrUpdateRoleFormValues,
  CreateOrUpdateSupplierFormValues,
  CreateOrUpdateUploadFormValues,
  CreateOrUpdateUserFormValues,
  CreateOrUpdateWarehouseFormValues,
} from '@/types/formik';
import {
  ResponseAuth,
  ResponseBrand,
  ResponseBrands,
  ResponseCategories,
  ResponseCategory,
  ResponseModule,
  ResponseModules,
  ResponseModuleType,
  ResponseModuleTypes,
  ResponseProduct,
  ResponseProducts,
  ResponseRole,
  ResponseRoleModule,
  ResponseRoleModules,
  ResponseRoles,
  ResponseSupplier,
  ResponseSuppliers,
  ResponseUpload,
  ResponseUploads,
  ResponseUser,
  ResponseUsers,
  ResponseWarehouse,
  ResponseWarehouses,
} from '@/types/response';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { GlobalStateTypes } from '@/types/state';
// import { DashboardMetrics } from '@/types/model';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    if (endpoint !== 'login' && endpoint !== 'forgot-password') {
      const state = getState() as GlobalStateTypes;
      const token = state.global.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  },
});

export const api = createApi({
  baseQuery,
  reducerPath: 'api',
  tagTypes: [
    'DashboardMetrics',
    'Products',
    'Users',
    'Uploads',
    'Auth',
    'Roles',
    'Modules',
    'RoleModules',
    'ModuleTypes',
    'Warehouses',
    'Categories',
    'Brands',
    'Suppliers',
  ],
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => '/dashboard',
      providesTags: ['DashboardMetrics'],
    }),

    getProducts: build.query<ResponseProducts, void>({
      query: () => '/products',
      providesTags: ['Products'],
    }),

    getProduct: build.query<ResponseProduct, { productId: string }>({
      query: ({ productId }) => `/products/${productId}`,
      providesTags: ['Products'],
    }),

    createProduct: build.mutation<ResponseProduct, CreateOrUpdateProductFormValues>({
      query: (data) => ({
        url: '/products',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    updateProduct: build.mutation<ResponseProduct, CreateOrUpdateProductFormValues>({
      query: (data) => ({
        url: `/products/${data.productId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    softDeleteProducts: build.mutation<ResponseProduct, { ids: string[] }>({
      query: (data) => ({
        url: '/products/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    restoreProducts: build.mutation<ResponseProduct, { ids: string[] }>({
      query: (data) => ({
        url: '/products/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    forceDeleteProducts: build.mutation<ResponseProduct, { ids: string[] }>({
      query: (data) => ({
        url: '/products/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Products'],
    }),

    // Auth
    login: build.mutation<ResponseAuth, { identifier: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),

    forgotPassword: build.mutation<ResponseAuth, { identifier: string; newPassword: string }>({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    changePassword: build.mutation<ResponseAuth, { oldPassword: string; newPassword: string }>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),

    deactiveAccount: build.mutation<ResponseUser, { ids: string[] }>({
      query: (data) => ({
        url: '/users/me/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),

    // User
    getUsers: build.query<ResponseUsers, void>({
      query: () => '/users',
      providesTags: ['Users'],
    }),

    getUser: build.query<ResponseUser, { userId: string }>({
      query: ({ userId }) => `/users/${userId}`,
      providesTags: ['Users'],
    }),

    userProfile: build.query<ResponseUser, void>({
      query: () => '/users/me',
      providesTags: ['Auth'],
    }),

    updateUserProfile: build.mutation<ResponseUser, CreateOrUpdateUserFormValues>({
      query: (data) => ({
        url: '/users/me',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),

    createUser: build.mutation<ResponseUser, CreateOrUpdateUserFormValues>({
      query: (data) => ({
        url: '/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    updateUser: build.mutation<ResponseUser, CreateOrUpdateUserFormValues>({
      query: (data) => ({
        url: `/users/${data.userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    softDeleteUsers: build.mutation<ResponseUser, { ids: string[] }>({
      query: (data) => ({
        url: '/users/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    forceDeleteUsers: build.mutation<ResponseUser, { ids: string[] }>({
      query: (data) => ({
        url: '/users/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    restoreUsers: build.mutation<ResponseUser, { ids: string[] }>({
      query: (data) => ({
        url: '/users/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),

    // Upload
    getUploads: build.query<ResponseUploads, void>({
      query: () => '/uploads',
      providesTags: ['Uploads'],
    }),

    getUpload: build.query<ResponseUpload, { uploadId: string }>({
      query: ({ uploadId }) => `/uploads/${uploadId}`,
      providesTags: ['Uploads'],
    }),

    createUpload: build.mutation<ResponseUpload, CreateOrUpdateUploadFormValues>({
      query: (data) => ({
        url: '/uploads',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Uploads'],
    }),

    updateUpload: build.mutation<ResponseUpload, CreateOrUpdateUploadFormValues>({
      query: (data) => ({
        url: `/uploads/${data.uploadId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Uploads'],
    }),

    softDeleteUploads: build.mutation<ResponseUpload, { ids: string[] }>({
      query: (data) => ({
        url: '/uploads/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Uploads'],
    }),

    forceDeleteUploads: build.mutation<ResponseUpload, { ids: string[] }>({
      query: (data) => ({
        url: '/uploads/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Uploads'],
    }),

    restoreUploads: build.mutation<ResponseUpload, { ids: string[] }>({
      query: (data) => ({
        url: '/uploads/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Uploads'],
    }),

    // Role
    getRoles: build.query<ResponseRoles, void>({
      query: () => '/roles',
      providesTags: ['Roles'],
    }),

    getRole: build.query<ResponseRole, { roleId: string }>({
      query: ({ roleId }) => `/roles/${roleId}`,
      providesTags: ['Roles'],
    }),

    createRole: build.mutation<ResponseRole, CreateOrUpdateRoleFormValues>({
      query: (data) => ({
        url: '/roles',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),

    updateRole: build.mutation<ResponseRole, CreateOrUpdateRoleFormValues>({
      query: (data) => ({
        url: `/roles/${data.roleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),

    softDeleteRoles: build.mutation<ResponseRole, { ids: string[] }>({
      query: (data) => ({
        url: '/roles/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),

    forceDeleteRoles: build.mutation<ResponseRole, { ids: string[] }>({
      query: (data) => ({
        url: '/roles/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),

    restoreRoles: build.mutation<ResponseRole, { ids: string[] }>({
      query: (data) => ({
        url: '/roles/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),

    // Module
    getModules: build.query<ResponseModules, void>({
      query: () => '/modules',
      providesTags: ['Modules'],
    }),

    getModule: build.query<ResponseModule, { moduleId: string }>({
      query: ({ moduleId }) => `/modules/${moduleId}`,
      providesTags: ['Modules'],
    }),

    createModule: build.mutation<ResponseModule, CreateOrUpdateModuleFormValues>({
      query: (data) => ({
        url: '/modules',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Modules'],
    }),

    updateModule: build.mutation<ResponseModule, CreateOrUpdateModuleFormValues>({
      query: (data) => ({
        url: `/modules/${data.moduleId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Modules'],
    }),

    softDeleteModules: build.mutation<ResponseModule, { ids: string[] }>({
      query: (data) => ({
        url: '/modules/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Modules'],
    }),

    forceDeleteModules: build.mutation<ResponseModule, { ids: string[] }>({
      query: (data) => ({
        url: '/modules/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Modules'],
    }),

    restoreModules: build.mutation<ResponseModule, { ids: string[] }>({
      query: (data) => ({
        url: '/modules/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Modules'],
    }),

    // Module Type
    getModuleTypes: build.query<ResponseModuleTypes, void>({
      query: () => '/modules-types',
      providesTags: ['ModuleTypes'],
    }),

    getModuleType: build.query<ResponseModuleType, { moduleTypeId: string }>({
      query: ({ moduleTypeId }) => `/modules-types/${moduleTypeId}`,
      providesTags: ['ModuleTypes'],
    }),

    createModuleType: build.mutation<ResponseModuleType, CreateOrUpdateModuleTypeFormValues>({
      query: (data) => ({
        url: '/modules-types',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ModuleTypes'],
    }),

    updateModuleType: build.mutation<ResponseModuleType, CreateOrUpdateModuleTypeFormValues>({
      query: (data) => ({
        url: `/modules-types/${data.moduleTypeId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ModuleTypes'],
    }),

    softDeleteModuleTypes: build.mutation<ResponseModuleType, { ids: string[] }>({
      query: (data) => ({
        url: '/modules-types/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ModuleTypes'],
    }),

    forceDeleteModuleTypes: build.mutation<ResponseModuleType, { ids: string[] }>({
      query: (data) => ({
        url: '/modules-types/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['ModuleTypes'],
    }),

    restoreModuleTypes: build.mutation<ResponseModuleType, { ids: string[] }>({
      query: (data) => ({
        url: '/modules-types/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ModuleTypes'],
    }),

    // Role Module
    getRoleModules: build.query<ResponseRoleModules, { roleId: string }>({
      query: ({ roleId }) => `/roles/${roleId}/modules`,
      providesTags: ['Roles', 'Modules', 'RoleModules'],
    }),

    createOrUpdateRoleModule: build.mutation<
      ResponseRoleModule,
      { roleId: string; moduleId: string; checked: boolean }
    >({
      query: ({ roleId, moduleId, checked }) => ({
        url: `/roles/${roleId}/modules`,
        method: 'POST',
        body: { roleId, moduleId, checked },
      }),
      invalidatesTags: ['Roles', 'Modules', 'RoleModules'],
    }),

    // Warehouse
    getWarehouses: build.query<ResponseWarehouses, void>({
      query: () => '/warehouses',
      providesTags: ['Warehouses'],
    }),

    getWarehouse: build.query<ResponseWarehouse, { warehouseId: string }>({
      query: ({ warehouseId }) => `/warehouses/${warehouseId}`,
      providesTags: ['Warehouses'],
    }),

    createWarehouse: build.mutation<ResponseWarehouse, CreateOrUpdateWarehouseFormValues>({
      query: (data) => ({
        url: '/warehouses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Warehouses'],
    }),

    updateWarehouse: build.mutation<ResponseWarehouse, CreateOrUpdateWarehouseFormValues>({
      query: (data) => ({
        url: `/warehouses/${data.warehouseId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouses'],
    }),

    softDeleteWarehouses: build.mutation<ResponseWarehouse, { ids: string[] }>({
      query: (data) => ({
        url: '/warehouses/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouses'],
    }),

    forceDeleteWarehouses: build.mutation<ResponseWarehouse, { ids: string[] }>({
      query: (data) => ({
        url: '/warehouses/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Warehouses'],
    }),

    restoreWarehouses: build.mutation<ResponseWarehouse, { ids: string[] }>({
      query: (data) => ({
        url: '/warehouses/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Warehouses'],
    }),

    // Category
    getCategories: build.query<ResponseCategories, void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),

    getCategory: build.query<ResponseCategory, { categoryId: string }>({
      query: ({ categoryId }) => `/categories/${categoryId}`,
      providesTags: ['Categories'],
    }),

    createCategory: build.mutation<ResponseCategory, CreateOrUpdateCategoryFormValues>({
      query: (data) => ({
        url: '/categories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),

    updateCategory: build.mutation<ResponseCategory, CreateOrUpdateCategoryFormValues>({
      query: (data) => ({
        url: `/categories/${data.categoryId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),

    softDeleteCategories: build.mutation<ResponseCategory, { ids: string[] }>({
      query: (data) => ({
        url: '/categories/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),

    forceDeleteCategories: build.mutation<ResponseCategory, { ids: string[] }>({
      query: (data) => ({
        url: '/categories/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),

    restoreCategories: build.mutation<ResponseCategory, { ids: string[] }>({
      query: (data) => ({
        url: '/categories/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Categories'],
    }),

    // Brand
    getBrands: build.query<ResponseBrands, void>({
      query: () => '/brands',
      providesTags: ['Brands'],
    }),

    getBrand: build.query<ResponseBrand, { brandId: string }>({
      query: ({ brandId }) => `/brands/${brandId}`,
      providesTags: ['Brands'],
    }),

    createBrand: build.mutation<ResponseBrand, CreateOrUpdateBrandFormValues>({
      query: (data) => ({
        url: '/brands',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Brands'],
    }),

    updateBrand: build.mutation<ResponseBrand, CreateOrUpdateBrandFormValues>({
      query: (data) => ({
        url: `/brands/${data.brandId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Brands'],
    }),

    softDeleteBrands: build.mutation<ResponseBrand, { ids: string[] }>({
      query: (data) => ({
        url: '/brands/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Brands'],
    }),

    forceDeleteBrands: build.mutation<ResponseBrand, { ids: string[] }>({
      query: (data) => ({
        url: '/brands/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Brands'],
    }),

    restoreBrands: build.mutation<ResponseBrand, { ids: string[] }>({
      query: (data) => ({
        url: '/brands/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Brands'],
    }),

    // Supplier
    getSuppliers: build.query<ResponseSuppliers, void>({
      query: () => '/suppliers',
      providesTags: ['Suppliers'],
    }),

    getSupplier: build.query<ResponseSupplier, { supplierId: string }>({
      query: ({ supplierId }) => `/suppliers/${supplierId}`,
      providesTags: ['Suppliers'],
    }),

    createSupplier: build.mutation<ResponseSupplier, CreateOrUpdateSupplierFormValues>({
      query: (data) => ({
        url: '/suppliers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),

    updateSupplier: build.mutation<ResponseSupplier, CreateOrUpdateSupplierFormValues>({
      query: (data) => ({
        url: `/suppliers/${data.supplierId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),

    softDeleteSuppliers: build.mutation<ResponseSupplier, { ids: string[] }>({
      query: (data) => ({
        url: '/suppliers/soft-delete',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),

    forceDeleteSuppliers: build.mutation<ResponseSupplier, { ids: string[] }>({
      query: (data) => ({
        url: '/suppliers/force-delete',
        method: 'DELETE',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),

    restoreSuppliers: build.mutation<ResponseSupplier, { ids: string[] }>({
      query: (data) => ({
        url: '/suppliers/restore',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Suppliers'],
    }),
  }),
});

// Ekspor hooks yang dibuat otomatis dari endpoints
export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useSoftDeleteProductsMutation,
  useForceDeleteProductsMutation,
  useRestoreProductsMutation,
  useGetUsersQuery,
  useLoginMutation,
  useForgotPasswordMutation,
  useUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useDeactiveAccountMutation,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useSoftDeleteUsersMutation,
  useForceDeleteUsersMutation,
  useRestoreUsersMutation,
  useGetUploadsQuery,
  useGetUploadQuery,
  useCreateUploadMutation,
  useUpdateUploadMutation,
  useSoftDeleteUploadsMutation,
  useForceDeleteUploadsMutation,
  useRestoreUploadsMutation,
  useGetRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useSoftDeleteRolesMutation,
  useForceDeleteRolesMutation,
  useRestoreRolesMutation,
  useGetModulesQuery,
  useGetModuleQuery,
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useSoftDeleteModulesMutation,
  useForceDeleteModulesMutation,
  useRestoreModulesMutation,
  useGetRoleModulesQuery,
  useCreateOrUpdateRoleModuleMutation,
  useGetModuleTypesQuery,
  useGetModuleTypeQuery,
  useCreateModuleTypeMutation,
  useUpdateModuleTypeMutation,
  useSoftDeleteModuleTypesMutation,
  useForceDeleteModuleTypesMutation,
  useRestoreModuleTypesMutation,
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useSoftDeleteWarehousesMutation,
  useForceDeleteWarehousesMutation,
  useRestoreWarehousesMutation,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useForceDeleteCategoriesMutation,
  useRestoreCategoriesMutation,
  useSoftDeleteCategoriesMutation,
  useGetBrandsQuery,
  useGetBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useSoftDeleteBrandsMutation,
  useForceDeleteBrandsMutation,
  useRestoreBrandsMutation,
  useGetSuppliersQuery,
  useGetSupplierQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useSoftDeleteSuppliersMutation,
  useForceDeleteSuppliersMutation,
  useRestoreSuppliersMutation,
} = api;
