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
import { ArchiveRestoreIcon, PencilIcon, PlusCircleIcon, Trash2Icon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type ModelWithId =
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

interface MenuContextProps<T extends ModelWithId> {
  type:
    | 'users'
    | 'roles'
    | 'modules'
    | 'warehouses'
    | 'products'
    | 'brands'
    | 'categories'
    | 'purchases'
    | 'purchaseDetails'
    | 'sales'
    | 'saleDetails'
    | 'stockMovements'
    | 'suppliers';
  typeTagHtml: 'link' | 'modal';
  contextMenu: {
    mouseX: number;
    mouseY: number;
  };
  setContextMenu: (contextMenu: { mouseX: number; mouseY: number } | null) => void;
  divContextMenuRef: React.RefObject<HTMLDivElement>;
  filterStatus: string;
  currentItem: T;
  openModal: (status: 'detail' | 'softDelete' | 'forceDelete' | 'restore' | 'create' | 'update') => void;
}

const getModelId = (currentItem: ModelWithId) => {
  switch (true) {
    case 'userId' in currentItem:
      return (currentItem as IUser).userId;
    case 'roleId' in currentItem:
      return (currentItem as IRole).roleId;
    case 'moduleId' in currentItem:
      return (currentItem as IModule).moduleId;
    case 'warehouseId' in currentItem:
      return (currentItem as IWarehouse).warehouseId;
    case 'productId' in currentItem:
      return (currentItem as IProduct).productId;
    case 'brandId' in currentItem:
      return (currentItem as IBrand).brandId;
    case 'categoryId' in currentItem:
      return (currentItem as ICategory).categoryId;
    case 'purchaseId' in currentItem:
      return (currentItem as unknown as IPurchase).purchaseId;
    case 'purchaseDetailId' in currentItem:
      return (currentItem as unknown as IPurchaseDetail).purchaseDetailId;
    case 'saleId' in currentItem:
      return (currentItem as unknown as ISale).saleId;
    case 'saleDetailId' in currentItem:
      return (currentItem as unknown as ISalesDetail).salesDetailId;
    case 'stockMovementId' in currentItem:
      return (currentItem as unknown as IStockMovement).stockMovementId;
    case 'supplierId' in currentItem:
      return (currentItem as ISupplier).supplierId;
    default:
      return null;
  }
};

const MenuContext = <T extends ModelWithId>({
  type,
  typeTagHtml,
  contextMenu,
  divContextMenuRef,
  filterStatus,
  currentItem,
  openModal,
  setContextMenu,
}: MenuContextProps<T>) => {
  const modelId = getModelId(currentItem);

  return (
    <div
      className='fixed bg-white shadow-lg rounded-md py-2 z-50 transition-all duration-300 ease-out transform'
      style={{ top: contextMenu.mouseY, left: contextMenu.mouseX }}
      ref={divContextMenuRef}
    >
      {(filterStatus === 'All' || filterStatus === 'Active') && (
        <>
          <div className='flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100'>
            {typeTagHtml === 'link' ? (
              <Link className='flex items-center w-full' href={`/dashboard/${type}/create`}>
                <PlusCircleIcon className='w-5 h-5 mr-2' /> Create
              </Link>
            ) : (
              <button
                className='flex items-center w-full'
                onClick={() => {
                  setContextMenu(null);
                  openModal('create');
                }}
              >
                <PlusCircleIcon className='w-5 h-5 mr-2' /> Create
              </button>
            )}
          </div>
          {currentItem.deletedAt === null && (
            <>
              <div className='flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100'>
                {typeTagHtml === 'link' ? (
                  <Link className='flex items-center w-full' href={`/dashboard/${type}/${modelId}/edit`}>
                    <PencilIcon className='w-5 h-5 mr-2' /> Edit
                  </Link>
                ) : (
                  <button
                    className='flex items-center w-full'
                    onClick={() => {
                      setContextMenu(null);
                      openModal('update');
                    }}
                  >
                    <PencilIcon className='w-5 h-5 mr-2' /> Edit
                  </button>
                )}
              </div>
              <button
                className='flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100'
                onClick={() => {
                  openModal('softDelete');
                  setContextMenu(null);
                }}
              >
                <TrashIcon className='w-5 h-5 mr-2' /> Soft Delete
              </button>
            </>
          )}
        </>
      )}
      <button
        className='flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100'
        onClick={() => {
          openModal('forceDelete');
          setContextMenu(null);
        }}
      >
        <Trash2Icon className='w-5 h-5 mr-2' /> Force Delete
      </button>
      {(filterStatus === 'All' || filterStatus === 'Non Active') && currentItem.deletedAt && (
        <button
          className='flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100'
          onClick={() => {
            openModal('restore');
            setContextMenu(null);
          }}
        >
          <ArchiveRestoreIcon className='w-5 h-5 mr-2' /> Restore
        </button>
      )}
    </div>
  );
};

export default MenuContext;
