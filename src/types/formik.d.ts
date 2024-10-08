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
