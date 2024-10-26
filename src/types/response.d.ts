import {
  IModule,
  IRole,
  IUpload,
  IUser,
  IBrand,
  ICategory,
  IModuleType,
  ISupplier,
  IProduct,
  IStockMovement,
  IPurchase,
  IPurchaseDetail,
  ISaleDetail,
  ISale,
} from './model';

export interface ResponseAuth {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    expiresIn: number;
  };
}

export interface ResponseError {
  data: {
    error: string;
    message?: string;
  };
  message?: string;
  success: boolean;
  status: number;
}

export interface ResponseUser {
  success: boolean;
  message: string;
  data: IUser;
}

export interface ResponseUsers {
  success: boolean;
  message: string;
  data: IUser[];
}

export interface ResponseUploads {
  success: boolean;
  message: string;
  data: IUpload[];
}

export interface ResponseUpload {
  success: boolean;
  message: string;
  data: IUpload;
}

export interface ResponseRole {
  success: boolean;
  message: string;
  data: IRole;
}

export interface ResponseRoles {
  success: boolean;
  message: string;
  data: IRole[];
}

export interface ResponseModule {
  success: boolean;
  message: string;
  data: IModule;
}

export interface ResponseModuleType {
  success: boolean;
  message: string;
  data: IModuleType;
}

export interface ResponseModuleTypes {
  success: boolean;
  message: string;
  data: IModuleType[];
}

export interface ResponseModules {
  success: boolean;
  message: string;
  data: IModule[];
}

export interface ResponseRoleModules {
  success: boolean;
  message: string;
  data: IRoleModule[];
}

export interface ResponseRoleModule {
  success: boolean;
  message: string;
  data: IRoleModule;
}

export interface ResponseProducts {
  success: boolean;
  message: string;
  data: IProduct[];
}

export interface ResponseProduct {
  success: boolean;
  message: string;
  data: IProduct;
}

export interface ResponseWarehouses {
  success: boolean;
  message: string;
  data: IWarehouse[];
}

export interface ResponseWarehouse {
  success: boolean;
  message: string;
  data: IWarehouse;
}

export interface ResponseCategories {
  success: boolean;
  message: string;
  data: ICategory[];
}

export interface ResponseCategory {
  success: boolean;
  message: string;
  data: ICategory;
}

export interface ResponseBrands {
  success: boolean;
  message: string;
  data: IBrand[];
}

export interface ResponseBrand {
  success: boolean;
  message: string;
  data: IBrand;
}

export interface ResponseProductHistories {
  success: boolean;
  message: string;
  data: IProductHistory[];
}

export interface ResponseProductHistory {
  success: boolean;
  message: string;
  data: IProductHistory;
}

export interface ResponseCustomers {
  success: boolean;
  message: string;
  data: ICustomer[];
}

export interface ResponseCustomer {
  success: boolean;
  message: string;
  data: ICustomer;
}

export interface ResponseSuppliers {
  success: boolean;
  message: string;
  data: ISupplier[];
}

export interface ResponseSupplier {
  success: boolean;
  message: string;
  data: ISupplier;
}

export interface ResponseStockMovements {
  success: boolean;
  message: string;
  data: IStockMovement[];
}

export interface ResponseStockMovement {
  success: boolean;
  message: string;
  data: IStockMovement;
}

export interface ResponsePurchases {
  success: boolean;
  message: string;
  data: IPurchase[];
}

export interface ResponsePurchase {
  success: boolean;
  message: string;
  data: IPurchase;
}

export interface ResponsePurchaseDetails {
  success: boolean;
  message: string;
  data: IPurchaseDetail[];
}

export interface ResponsePurchaseDetail {
  success: boolean;
  message: string;
  data: IPurchaseDetail;
}

export interface ResponseSales {
  success: boolean;
  message: string;
  data: ISale[];
}

export interface ResponseSale {
  success: boolean;
  message: string;
  data: ISale;
}

export interface ResponseSalesDetails {
  success: boolean;
  message: string;
  data: ISaleDetail[];
}

export interface ResponseSalesDetail {
  success: boolean;
  message: string;
  data: ISaleDetail;
}

export interface ResponseCloudinary {
  success: boolean;
  message: string;
  data: {
    publicId: string;
    url: string;
  };
}
