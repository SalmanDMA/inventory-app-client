export interface IProduct {
  productId: string;
  sku: string;
  discount?: number;
  costPrice: number;
  name: string;
  description: string;
  price: number;
  rating?: number;
  stock: number;
  reorderLevel: number;
  categoryId: number;
  brandId: string;
  supplierId: string;
  imageId: string;
  height?: number;
  width?: number;
  weight?: number;

  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;

  image?: IUpload;
  category?: ICategory;
  brand?: IBrand;
  supplier?: ISupplier;
  stockMovements?: IStockMovement[];
  purchaseDetails?: IPurchaseDetail[];
  salesDetails?: ISalesDetail[];
}

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface IRole {
  roleId: string;
  name: string;
  alias: string;
  color: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface IUser {
  userId: string;
  username: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  avatarId: string;
  roleId: string;
  role: IRole;
  avatar: IUpload;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface IModule {
  moduleId: string;
  moduleTypeId: string;
  parentId: string | null;
  path?: string;
  name: string;
  route?: string;
  icon?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  childModules?: Module[];
  moduleType?: IModuleType;
  parentModule?: IModule;
  roleModules?: IRoleModule[];
}

export interface IModuleType {
  moduleTypeId: string;
  name: string;
  icon: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  modules: IModule[];
}

export interface IRoleModule {
  roleModuleId: string;
  roleId: string;
  moduleId: number;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  module: IModule;
  role: IRole;
}

export interface IUpload {
  uploadId: string;
  filename: string;
  category: string;
  path: string;
  type: string;
  mime: string;
  extension: string;
  size: number;
  filenameOrigin: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ICategory {
  categoryId: string;
  name: string;
  parentId: string | null;
  path?: string;
  name: string;
  alias?: string;
  description?: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  products?: Product[];
  parentCategory?: ICategory | null;
  childCategories?: ICategory[];
}

export interface IBrand {
  brandId: string;
  name: string;
  description?: string;
  imageId?: string;
  alias?: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  products?: Product[];
  image?: IUpload;
}

export interface ISupplier {
  supplierId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  country?: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  products?: Product[];
  purchases?: Purchase[];
}

export interface IStockMovement {
  stockMovementId: string;
  productId: string;
  warehouseId: string;
  movementType: 'IN' | 'OUT';
  movementReason?: string;
  quantity: number;
  transactionDate: string;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  product?: Product;
  warehouse?: IWarehouse;
}

export interface IPurchase {
  purchaseId: string;
  supplierId: string;
  warehouseId: string;
  total: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'CANCELLED' | 'OVERDUE';
  paymentMethod: 'CASH' | 'CREDITCARD';

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  supplier?: ISupplier;
  warehouse?: IWarehouse;
  details?: IPurchaseDetail[];
}

export interface IPurchaseDetail {
  purchaseDetailId: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  product?: Product;
  purchase?: Purchase;
}

export interface ISale {
  saleId: string;
  userId: string;
  warehouseId: string;
  total: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'CANCELLED' | 'OVERDUE';
  paymentMethod: 'CASH' | 'CREDITCARD';

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  user?: IUser;
  warehouse?: IWarehouse;
  details?: ISaleDetail[];
}

export interface ISaleDetail {
  saleDetailId: string;
  saleId: string;
  productId: string;
  quantity: number;
  price: number;
  discount?: number;
  tax?: number;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  product?: Product;
  sale?: Sale;
}

export interface IWarehouse {
  warehouseId: string;
  name: string;
  location: string;
  capacity: number;
  description?: string;
  picId: string;
  status?: 'AVAILABLE' | 'FULL';

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  products?: Product[];
  sales?: Sale[];
  purchases?: Purchase[];
  pic: IUser;
}
