import { IModule, IRole, IUpload, IUser } from './model';

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

export interface ResponseCloudinary {
  success: boolean;
  message: string;
  data: {
    publicId: string;
    url: string;
  };
}
