export interface LoginFormValues {
  identifier: string;
  password: string;
}

export interface ForgotPasswordFormValues {
  identifier: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordFormValues {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface CreateOrUpdateUserFormValues {
  userId?: string;
  username: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  roleId: string;
  avatarId?: string;
  password?: string;
  publicId?: string;
}

export interface CreateOrUpdateUploadFormValues {
  uploadId?: string;
  filename: string;
  category: string;
  path: string;
  type: string;
  mime: string;
  extension: string;
  size: number;
  filenameOrigin: string;
}

export interface CreateOrUpdateRoleFormValues {
  roleId?: string;
  name: string;
  alias: string;
  color: string;
  description?: string;
}

export interface CreateOrUpdateModuleFormValues {
  moduleId?: string;
  parentId?: string;
  moduleTypeId: string;
  path?: string;
  name: string;
  route?: string;
  icon?: string;
  description?: string;
}

export interface CreateOrUpdateModuleTypeFormValues {
  moduleTypeId?: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface CreateOrUpdateWarehouseFormValues {
  warehouseId?: string;
  name: string;
  location: string;
  capacity: number | null;
  description?: string;
  picId: string;
}

export interface CreateOrUpdateSaleFormValues {
  saleId?: string;
  userId: string;
  warehouseId: string;
  total: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'CANCELLED' | 'OVERDUE';
  paymentMethod: 'CASH' | 'CREDITCARD';
}

export interface CreateOrUpdatesSaleDetailFormValues {
  saleDetailId?: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
}

export interface CreateOrUpdatesPurchaseFormValues {
  purchaseId?: string;
  supplierId: string;
  warehouseId: string;
  total: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'CANCELLED' | 'OVERDUE';
  paymentMethod: 'CASH' | 'CREDITCARD';
}

export interface CreateOrUpdatesPurchaseDetailFormValues {
  purchaseDetailId?: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;
}

export interface CreateIStockMovementFormValues {
  stockMovementId?: string;
  warehouseId: string;
  productId: string;
  movementType: 'IN' | 'OUT';
  movementReason?: string;
  quantity: number;
  transactionDate: string;
}

export interface CreateOrUpdateSupplierFormValues {
  supplierId?: string;
  companyName: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  bankAccount?: string;
  contractStartDate?: string | Date | '';
  contractEndDate?: string | Date | '';
  paymentTerms?: string;
  deliveryLeadTime?: number | '';
  rating?: number | '';
  imageId?: string;
  publicId?: string;
}

export interface CreateOrUpdateCustomerFormValues {
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  companyName?: string;
  taxNumber?: string;
  contractStartDate?: string | Date | '';
  contractEndDate?: string | Date | '';
  paymentTerms?: string;
  creditLimit?: number | '';
  discount?: number | '';
  imageId?: string;
  publicId?: string;
}

export interface CreateOrUpdateBrandFormValues {
  brandId?: string;
  name: string;
  description?: string;
  imageId?: string;
  alias?: string;
  color?: string;
  publicId?: string;
}

export interface CreateOrUpdateProductHistoryFormValues {
  productHistoryId?: string;
  productId: string;
  oldPrice: number | '';
  newPrice: number | '';
  userId?: string;
}

export interface CreateOrUpdateCategoryFormValues {
  categoryId?: string;
  name: string;
  parentId: string | null;
  path?: string;
  name: string;
  alias?: string;
  color?: string;
  description?: string;
  categoryType?: string;
}

export interface CreateOrUpdateProductFormValues {
  productId?: string;
  sku?: string;
  discount?: number | '';
  costPrice: number | '';
  name: string;
  description: string;
  price: number | '';
  rating?: number | '';
  stock: number | '';
  reorderLevel: number | '';
  categoryId: number | '';
  brandId: string;
  supplierId: string;
  imageId: string;
  height?: number | '';
  width?: number | '';
  weight?: number | '';
  publicId?: string;
}
