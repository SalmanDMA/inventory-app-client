import { IModule, IRole, IUser } from '@/types/model';
import { ArchiveRestoreIcon, PencilIcon, PlusCircleIcon, Trash2Icon, TrashIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type ModelWithId = IUser | IRole | IModule;

interface IMenuActionProps<T extends ModelWithId> {
  type: 'users' | 'roles' | 'modules';
  typeTagHtml: 'link' | 'modal';
  currentItem: T;
  openModal: (status: 'detail' | 'softDelete' | 'forceDelete' | 'restore' | 'create' | 'update') => void;
  filterStatus: string;
  anchorPosition: { top: number; left: number };
  dropdownActionTableRef: React.RefObject<HTMLDivElement>;
  openDropdownActionTable: boolean;
  handleCloseActionTable: () => void;
}

const getModelId = (currentItem: ModelWithId) => {
  switch (true) {
    case 'userId' in currentItem:
      return (currentItem as IUser).userId;
    case 'roleId' in currentItem:
      return (currentItem as IRole).roleId;
    case 'modelId' in currentItem:
      console.log(currentItem, 'currentItem');
      return (currentItem as IModule).moduleId;
    default:
      return null;
  }
};

const MenuAction = <T extends ModelWithId>({
  type,
  typeTagHtml,
  dropdownActionTableRef,
  openDropdownActionTable,
  anchorPosition,
  filterStatus,
  currentItem,
  openModal,
  handleCloseActionTable,
}: IMenuActionProps<T>) => {
  const modelId = getModelId(currentItem);
  console.log(modelId, 'modelId');

  return (
    <div
      ref={dropdownActionTableRef}
      className={`absolute py-1 bg-white shadow-md rounded-md transition-all duration-300 ${
        openDropdownActionTable ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ top: anchorPosition.top, left: anchorPosition.left }}
    >
      <ul>
        {(filterStatus === 'All' || filterStatus === 'Active') && (
          <>
            <li className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'>
              {typeTagHtml === 'link' ? (
                <Link className='flex items-center w-full' href={`/dashboard/${type}/create`}>
                  <PlusCircleIcon className='w-5 h-5 mr-2' /> Create
                </Link>
              ) : (
                <button
                  className='flex items-center w-full'
                  onClick={() => {
                    handleCloseActionTable();
                    openModal('create');
                  }}
                >
                  <PlusCircleIcon className='w-5 h-5 mr-2' /> Create
                </button>
              )}
            </li>
            {currentItem?.deletedAt === null && (
              <>
                <li className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'>
                  {typeTagHtml === 'link' ? (
                    <Link className='flex items-center w-full' href={`/dashboard/${type}/${modelId}/edit`}>
                      <PencilIcon className='w-5 h-5 mr-2' /> Edit
                    </Link>
                  ) : (
                    <button
                      className='flex items-center w-full'
                      onClick={() => {
                        handleCloseActionTable();
                        openModal('update');
                      }}
                    >
                      <PencilIcon className='w-5 h-5 mr-2' /> Edit
                    </button>
                  )}
                </li>
                <li className='hover:bg-gray-100'>
                  <button
                    className='px-4 py-2 cursor-pointer flex items-center w-full'
                    onClick={() => {
                      openModal('softDelete');
                      handleCloseActionTable();
                    }}
                  >
                    <TrashIcon className='w-5 h-5 mr-2' /> Soft Delete
                  </button>
                </li>
              </>
            )}
          </>
        )}
        <li className='hover:bg-gray-100'>
          <button
            className='px-4 py-2 cursor-pointer flex items-center w-full'
            onClick={() => {
              openModal('forceDelete');
              handleCloseActionTable();
            }}
          >
            <Trash2Icon className='w-5 h-5 mr-2' /> Force Delete
          </button>
        </li>
        {(filterStatus === 'All' || filterStatus === 'Non Active') && currentItem?.deletedAt !== null && (
          <li className='hover:bg-gray-100'>
            <button
              className='px-4 py-2 cursor-pointer flex items-center w-full'
              onClick={() => {
                openModal('restore');
                handleCloseActionTable();
              }}
            >
              <ArchiveRestoreIcon className='w-5 h-5 mr-2' /> Restore
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default MenuAction;
