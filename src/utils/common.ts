import {
  IModule,
  IProduct,
  IRole,
  IUser,
  IWarehouse,
  IBrand,
  ICategory,
  IPurchase,
  IPurchaseDetail,
  ISale,
  ISalesDetail,
  IStockMovement,
  ISupplier,
} from '@/types/model';
import { GridRowParams } from '@mui/x-data-grid';

type ModelTypes =
  | IUser
  | IRole
  | IModule
  | IWarehouse
  | IProduct
  | IBrand
  | ICategory
  | IPurchase
  | IPurchaseDetail
  | ISale
  | ISalesDetail
  | IStockMovement
  | ISupplier;

type TreeNode<T> = T & { children: T[] };

export const getRowClassName = (params: GridRowParams, filterStatus: string) => {
  if (filterStatus === 'All' && params.row.deletedAt) {
    return 'bg-gray-200 opacity-50';
  }
  return '';
};

export const getModelIdsToHandle = <T extends ModelTypes>(modelIds: string[] | null, currentModel: T): string[] => {
  if (modelIds && modelIds.length > 0) {
    return modelIds;
  }

  switch (true) {
    case 'userId' in currentModel:
      return [currentModel.userId];
    case 'roleId' in currentModel:
      return [currentModel.roleId];
    case 'modelId' in currentModel:
      return [currentModel.modelId as string];
    case 'warehouseId' in currentModel:
      return [currentModel.warehouseId];
    case 'productId' in currentModel:
      return [currentModel.productId];
    case 'brandId' in currentModel:
      return [currentModel.brandId];
    case 'categoryId' in currentModel:
      return [currentModel.categoryId];
    case 'purchaseId' in currentModel:
      return [currentModel.purchaseId as string];
    case 'purchaseDetailId' in currentModel:
      return [currentModel.purchaseDetailId as string];
    case 'saleId' in currentModel:
      return [currentModel.saleId as string];
    case 'saleDetailId' in currentModel:
      return [currentModel.saleDetailId as string];
    case 'stockMovementId' in currentModel:
      return [currentModel.stockMovementId as string];
    case 'supplierId' in currentModel:
      return [currentModel.supplierId as string];
    default:
      return [];
  }
};

export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const buildTree = <T>(
  items: T[],
  getId: (item: T) => string,
  getParentId: (item: T) => string | null
): TreeNode<T>[] => {
  const itemMap: { [key: string]: TreeNode<T> } = {};
  const tree: TreeNode<T>[] = [];

  items.forEach((item) => {
    itemMap[getId(item)] = { ...item, children: [] };
  });

  items.forEach((item) => {
    const parentId = getParentId(item);
    if (parentId === null) {
      tree.push(itemMap[getId(item)]);
    } else {
      const parentItem = itemMap[parentId];
      if (parentItem) {
        parentItem.children.push(itemMap[getId(item)]);
      }
    }
  });

  return tree;
};

export const removeFileExtension = (filename: string): string => {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
};

export const formatToMMDDYYYY = (date: string | Date | undefined | '') => {
  if (!date) return '';

  let dateString;
  if (typeof date === 'string') {
    dateString = date.split('T')[0];
  } else if (date instanceof Date) {
    dateString = date.toISOString().split('T')[0];
  } else {
    return '';
  }

  const [year, month, day] = dateString.split('-');
  return `${year}-${month}-${day}`;
};

export const formatToISOString = (date: string | Date | undefined | '') => {
  if (!date) return undefined;

  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }

  if (date instanceof Date) {
    return date.toISOString();
  }

  return undefined;
};
