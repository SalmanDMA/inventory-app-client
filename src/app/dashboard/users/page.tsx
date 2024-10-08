'use client';

import { useState, MouseEvent, useEffect } from 'react';
import {
  useForceDeleteUploadsMutation,
  useForceDeleteUsersMutation,
  useGetUsersQuery,
  useRestoreUploadsMutation,
  useRestoreUsersMutation,
  useSoftDeleteUploadsMutation,
  useSoftDeleteUsersMutation,
} from '@/state/api';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { MoreVerticalIcon } from 'lucide-react';
import { IRole, IUser } from '@/types/model';
import { Box } from '@mui/material';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { ResponseError } from '@/types/response';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import { useAppSelector } from '@/app/redux';
import { deleteAvatarFromCloudinary, fetchUserById } from '@/utils/httpClient';
import HeaderWithFilterMenu from '@/app/(components)/Header/WithFilterMenu';
import MenuContext from '@/app/(components)/Menu/Context';
import MenuAction from '@/app/(components)/Menu/Action';
import useModal from '@/app/hooks/useModal';
import { useMenu } from '@/app/hooks/useMenu';
import { useSearchQuery } from '@/app/hooks/useSearchQuery';
import { useFilterStatusData } from '@/app/hooks/useFilterStatusData';
import { getModelIdsToHandle, getRowClassName } from '@/utils/common';
import { useFetchFile } from '@/app/hooks/useFetchFile';

const Users = () => {
  const { data: users, isError, isLoading } = useGetUsersQuery();
  const [softDeletes, { isLoading: isSoftDeleting }] = useSoftDeleteUsersMutation();
  const [forceDeletes, { isLoading: isForceDeleting }] = useForceDeleteUsersMutation();
  const [restoreUsers, { isLoading: isRestoring }] = useRestoreUsersMutation();
  const [deleteUpload, { isLoading: isLoadingDeleteUpload }] = useForceDeleteUploadsMutation();
  const [softDeleteUpload, { isLoading: isSoftDeletingUpload }] = useSoftDeleteUploadsMutation();
  const [restoreUpload, { isLoading: isRestoringUpload }] = useRestoreUploadsMutation();

  const token = useAppSelector((state) => state.global.token);

  const { isModalOpen, isAnimationModalOpen, openModal, closeModal } = useModal();
  const {
    anchorPosition,
    contextMenu,
    divContextMenuRef,
    handleActionTableClick,
    handleCloseActionTable,
    isMenuActionButton,
    menuActionButtonRef,
    menuActionTableRef,
    openMenuActionTable,
    setContextMenu,
    setIsMenuActionButton,
  } = useMenu();
  const { searchQuery, handleSearchQuery } = useSearchQuery();
  const { filterStatus, isFilterOpen, filterRef, handleFilterStatus, setIsFilterOpen } = useFilterStatusData();

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserDeletedAt, setSelectedUserDeletedAt] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  const { fileUrl } = useFetchFile(
    currentUser?.avatarId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${currentUser?.avatarId}` : null,
    token as string
  );

  const columns: GridColDef[] = [
    { field: 'username', headerName: 'Username', width: 150, flex: 1 },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'email', headerName: 'Email', width: 200, flex: 1 },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      flex: 1,
      valueGetter: (params: IRole) => {
        return params.name;
      },
      renderCell: (params) => {
        return (
          <span
            className={`inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px]`}
            style={{ backgroundColor: params.row.role.color }}
            title={params.row.role.name}
          >
            {params.row.role.name}
          </span>
        );
      },
    },
    {
      field: 'deletedAt',
      headerName: 'Status',
      width: 150,
      flex: 1,
      valueGetter: (params: IUser) => {
        return params ? 'Non Active' : 'Active';
      },
      renderCell: (params) => {
        return (
          <span
            className={`inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px] ${
              params.row.deletedAt ? 'bg-red-500' : 'bg-green-500'
            }`}
            title={params.row.deletedAt ? 'Non Active' : 'Active'}
          >
            {params.row.deletedAt ? 'Non Active' : 'Active'}
          </span>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      resizable: false,
      filterable: false,
      sortable: false,
      pinnable: true,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        return (
          <div
            className='relative w-full h-full flex justify-center items-center'
            style={{ cursor: 'pointer' }}
            onClick={(event) => {
              handleCloseActionTable();
              handleActionTableClick(event, params.id.toString());
              setCurrentUser(params.row);
            }}
          >
            <MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Handle search and filter
  const filteredUsers = users?.data?.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !user.deletedAt) ||
      (filterStatus === 'Non Active' && user.deletedAt);

    return matchesSearch && matchesStatus;
  });

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentUser(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedUserIds(selectedIds);

    const selectedRows = filteredUsers?.filter((user) => selectedIds.includes(user.userId)) || [];

    const deletedAtValues = selectedRows.filter((user) => user.deletedAt).map((user) => user.deletedAt as string);

    setSelectedUserDeletedAt(deletedAtValues);
  };

  // Handle right-click context menu
  const handleRowContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (!event.currentTarget) {
      return;
    }

    const rowId = (event.currentTarget as HTMLDivElement).getAttribute('data-id');

    if (!rowId) {
      return;
    }

    const record = filteredUsers?.find((row) => row.userId === rowId);

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentUser(record);
  };

  const handleUserAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    try {
      if (ids.length === 0) {
        throw new Error('No users selected');
      }

      const userDataArray = await Promise.all(ids.map(async (id) => fetchUserById(id, token as string)));

      const avatarIds = userDataArray
        .map((userData) => {
          console.log(userData, 'userData');
          return userData?.data.avatarId;
        })
        .filter((avatarId): avatarId is string => !!avatarId) as string[];

      let response;
      let successMessage = '';
      let failureMessage = '';

      if (action === 'forceDelete') {
        await Promise.all(
          userDataArray.map(async (userData) => {
            if (userData?.data.avatar?.path) {
              await deleteAvatarFromCloudinary(userData.data.avatar.path, token as string);
            }
          })
        );
        if (avatarIds.length > 0) {
          await deleteUpload({
            ids: avatarIds,
          }).unwrap();
        }
      }

      console.log(userDataArray, 'userDataArray');
      console.log(ids, 'ids');
      console.log(avatarIds, 'avatarIds');

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          if (avatarIds.length > 0) {
            await softDeleteUpload({ ids: avatarIds }).unwrap();
          }
          successMessage = response.message || 'Users soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete users';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'Users force deleted successfully';
          failureMessage = response.message || 'Failed to force delete users';
          break;

        case 'restore':
          response = await restoreUsers({ ids }).unwrap();
          if (avatarIds.length > 0) {
            await restoreUpload({ ids: avatarIds }).unwrap();
          }
          successMessage = response.message || 'Users restored successfully';
          failureMessage = response.message || 'Failed to restore users';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentUser(null);
        closeModal(action);
      } else {
        throw new Error(failureMessage);
      }
    } catch (error) {
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
    }
  };

  // Handle click outside context menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuActionButtonRef.current && !menuActionButtonRef.current.contains(event.target as Node)) {
        setIsMenuActionButton(false);
      }

      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }

      if (
        contextMenu !== null &&
        divContextMenuRef.current &&
        !divContextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }

      if (
        openMenuActionTable &&
        menuActionTableRef.current &&
        !menuActionTableRef.current.contains(event.target as Node)
      ) {
        handleCloseActionTable();
      }
    };

    window.addEventListener('click', handleClickOutside as unknown as EventListener);

    return () => {
      window.removeEventListener('click', handleClickOutside as unknown as EventListener);
    };
  }, [contextMenu, openMenuActionTable]);

  if (isLoading) {
    return <div className='py-4'>Loading...</div>;
  }

  if (isError || !users) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch users</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Users'
        typeTagHtml='link'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedUserIds}
        selectedModelsDeletedAt={selectedUserDeletedAt}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        openModal={openModal}
        isModalOpen={isModalOpen}
      />

      {/* TABLE */}
      <Box
        sx={{
          width: '100%',
          height: {
            xs: 'calc(100vh - 295px)',
            sm: 'calc(100vh - 175px)',
          },
          marginTop: '20px',
        }}
      >
        <DataGrid
          rows={filteredUsers || []}
          columns={columns}
          getRowId={(row) => row.userId}
          getRowClassName={(params) => getRowClassName(params, filterStatus)}
          checkboxSelection
          onRowSelectionModelChange={handleRowSelectionModelChange}
          slotProps={{
            row: {
              onContextMenu: (e) => handleRowContextMenu(e),
              style: { cursor: 'context-menu' },
            },
          }}
          onRowDoubleClick={handleRowDoubleClick}
          className='bg-white shadow rounded-lg border border-gray-200 !text-gray-700 !w-full !h-full overflow-auto'
          pageSizeOptions={[5, 10, 20, 50, 100]}
        />
      </Box>

      {/* Action Data Table */}
      {anchorPosition && (
        <MenuAction
          type='users'
          typeTagHtml='link'
          dropdownActionTableRef={menuActionTableRef}
          anchorPosition={anchorPosition}
          currentItem={currentUser as IUser}
          filterStatus={filterStatus}
          openModal={openModal}
          handleCloseActionTable={handleCloseActionTable}
          openDropdownActionTable={openMenuActionTable}
        />
      )}

      {/* Modal for soft/force delete & restore */}
      {isModalOpen.softDelete && (
        <Confirmation
          title='Soft Delete User'
          description='Are you sure you want to soft delete this user?'
          isVisible={isAnimationModalOpen.softDelete}
          isLoading={isSoftDeleting || isSoftDeletingUpload}
          closeModal={() => closeModal('softDelete')}
          handleDeactivate={() =>
            handleUserAction('softDelete', getModelIdsToHandle(selectedUserIds, currentUser as IUser))
          }
          handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        />
      )}

      {isModalOpen.forceDelete && (
        <Confirmation
          title='Force Delete User'
          description='Are you sure you want to force delete this user?'
          isVisible={isAnimationModalOpen.forceDelete}
          isLoading={isForceDeleting || isLoadingDeleteUpload}
          closeModal={() => closeModal('forceDelete')}
          handleDeactivate={() =>
            handleUserAction('forceDelete', getModelIdsToHandle(selectedUserIds, currentUser as IUser))
          }
          handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        />
      )}

      {isModalOpen.restore && (
        <Confirmation
          title='Restore User'
          description='Are you sure you want to restore this user?'
          isVisible={isAnimationModalOpen.restore}
          isLoading={isRestoring || isRestoringUpload}
          closeModal={() => closeModal('restore')}
          handleDeactivate={() =>
            handleUserAction('restore', getModelIdsToHandle(selectedUserIds, currentUser as IUser))
          }
          handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        />
      )}

      {/* Modal for showing user details */}
      {isModalOpen.detail && currentUser && (
        <div
          className={`fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 ${
            isAnimationModalOpen.detail ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}
          onClick={() => closeModal('detail')}
        >
          <div
            className={`bg-white p-6 rounded-md shadow-lg max-w-lg w-full transform transition-all duration-300
            ${isAnimationModalOpen.detail ? 'scale-100' : 'scale-95'}`}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            {/* Header with Avatar */}
            <div className='flex items-center mb-6'>
              <Image
                src={
                  fileUrl ||
                  'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/m0vrgvjze72wxgqqsrad.png'
                }
                alt={`${currentUser.username}'s avatar`}
                width={100}
                height={100}
                className='w-16 h-16 rounded-full mr-4 border border-gray-300 object-cover'
              />
              <div>
                <h2 className='text-2xl font-bold text-gray-800'>{currentUser.name}</h2>
                <p className='text-sm text-gray-500'>{currentUser.username}</p>
              </div>
            </div>

            {/* Divider */}
            <hr className='my-4 border-t-2 border-gray-200' />

            {/* User Information */}
            <div className='space-y-4'>
              <div>
                <strong className='block text-gray-600'>Email:</strong>
                <p className='text-gray-800'>{currentUser.email}</p>
              </div>
              <div>
                <strong className='block text-gray-600'>Phone:</strong>
                <p className='text-gray-800'>{currentUser.phone || ' - '}</p>
              </div>
              <div>
                <strong className='block text-gray-600'>Address:</strong>
                <p className='text-gray-800'>{currentUser.address || ' - '}</p>
              </div>
              <div>
                <strong className='block text-gray-600'>Role:</strong>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-white text-sm`}
                  style={{ backgroundColor: currentUser.role.color }}
                >
                  {currentUser.role.name}
                </span>
              </div>
              <div>
                <strong className='block text-gray-600'>Member Since:</strong>
                <p className='text-gray-800'>{new Date(currentUser.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Divider */}
            <hr className='my-4 border-t-2 border-gray-200' />

            {/* Action Buttons */}
            <div className='flex justify-end'>
              <button
                onClick={() => closeModal('detail')}
                className='bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && currentUser && (
        <MenuContext
          type='users'
          typeTagHtml='link'
          contextMenu={contextMenu}
          currentItem={currentUser}
          openModal={openModal}
          divContextMenuRef={divContextMenuRef}
          filterStatus={filterStatus}
          setContextMenu={setContextMenu}
        />
      )}
    </div>
  );
};

export default Users;
