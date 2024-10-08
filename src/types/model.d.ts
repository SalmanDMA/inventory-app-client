export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface NewProduct {
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
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
  path: string;
  name: string;
  route: string;
  icon: string;
  description: string;
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
