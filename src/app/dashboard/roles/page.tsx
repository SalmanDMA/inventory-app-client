'use client';

import HeaderWithFilterMenu from '@/app/(components)/Header/WithFilterMenu';
import MenuAction from '@/app/(components)/Menu/Action';
import MenuContext from '@/app/(components)/Menu/Context';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import { useFilterStatusData } from '@/app/hooks/useFilterStatusData';
import { useMenu } from '@/app/hooks/useMenu';
import useModal from '@/app/hooks/useModal';
import { useSearchQuery } from '@/app/hooks/useSearchQuery';
import {
  useForceDeleteRolesMutation,
  useGetRolesQuery,
  useRestoreRolesMutation,
  useSoftDeleteRolesMutation,
} from '@/state/api';
import { IRole } from '@/types/model';
import { ResponseError } from '@/types/response';
import { getModelIdsToHandle, getRowClassName } from '@/utils/common';
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { MoreVerticalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RoleModule from './RoleModule';
import RoleForm from '@/app/(components)/Modal/RoleForm';

const Roles = () => {
  const { data: roles, isError, isLoading } = useGetRolesQuery();
  const [softDeletes, { isLoading: isSoftDeleting }] = useSoftDeleteRolesMutation();
  const [forceDeletes, { isLoading: isForceDeleting }] = useForceDeleteRolesMutation();
  const [restoreRoles, { isLoading: isRestoring }] = useRestoreRolesMutation();

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

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedRoleDeletedAt, setSelectedRoleDeletedAt] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<IRole | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'alias',
      headerName: '#',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        return (
          <span
            className='inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px]'
            style={{ backgroundColor: params.row.color }}
          >
            {params.row.alias}
          </span>
        );
      },
      valueGetter: (params) => {
        return params;
      },
    },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
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
              setCurrentRole(params.row);
            }}
          >
            <MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Handle search and filter
  const filteredRoles = roles?.data?.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !role.deletedAt) ||
      (filterStatus === 'Non Active' && role.deletedAt);

    return matchesSearch && matchesStatus;
  });

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentRole(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedRoleIds(selectedIds);

    const selectedRows = filteredRoles?.filter((role) => selectedIds.includes(role.roleId)) || [];

    const deletedAtValues = selectedRows.filter((role) => role.deletedAt).map((role) => role.deletedAt as string);

    setSelectedRoleDeletedAt(deletedAtValues);
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

    const record = filteredRoles?.find((row) => row.roleId === rowId);

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentRole(record);
  };

  const handleRoleAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    try {
      if (ids.length === 0) {
        throw new Error('No roles selected');
      }

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          successMessage = response.message || 'Roles soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete roles';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'Roles force deleted successfully';
          failureMessage = response.message || 'Failed to force delete roles';
          break;

        case 'restore':
          response = await restoreRoles({ ids }).unwrap();
          successMessage = response.message || 'Roles restored successfully';
          failureMessage = response.message || 'Failed to restore roles';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentRole(null);
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

  if (isError || !roles) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Roles'
        typeTagHtml='modal'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedRoleIds}
        selectedModelsDeletedAt={selectedRoleDeletedAt}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        openModal={openModal}
        isModalOpen={isModalOpen}
      />

      <Box
        sx={{
          width: '100%',
          height: {
            xs: 'calc(100vh - 295px)',
            sm: 'calc(100vh - 175px)',
          },
          gridTemplateColumns: {
            xs: '1fr',
            md: '300px 1fr',
          },
          gridTemplateRows: {
            xs: '1fr 1fr',
            md: '1fr',
          },
          display: 'grid',
          gap: '20px',
          marginTop: '20px',
        }}
      >
        <DataGrid
          rows={filteredRoles || []}
          columns={columns}
          getRowId={(row) => row.roleId}
          getRowClassName={(params) => getRowClassName(params, filterStatus)}
          onRowSelectionModelChange={handleRowSelectionModelChange}
          slotProps={{
            row: {
              onContextMenu: (e) => handleRowContextMenu(e),
              style: { cursor: 'context-menu' },
            },
          }}
          onRowDoubleClick={handleRowDoubleClick}
          className='bg-white shadow rounded-lg border border-gray-200 !text-gray-700 !w-full !h-full overflow-auto'
          hideFooter
        />

        {/* Action Data Table */}
        {anchorPosition && (
          <MenuAction
            type='roles'
            typeTagHtml='modal'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentRole as IRole}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete Role'
            description='Are you sure you want to soft delete this role?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={isSoftDeleting}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleRoleAction('softDelete', getModelIdsToHandle(selectedRoleIds, currentRole as IRole))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete Role'
            description='Are you sure you want to force delete this role?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={isForceDeleting}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleRoleAction('forceDelete', getModelIdsToHandle(selectedRoleIds, currentRole as IRole))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore Role'
            description='Are you sure you want to restore this role?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={isRestoring}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleRoleAction('restore', getModelIdsToHandle(selectedRoleIds, currentRole as IRole))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Context Menu */}
        {contextMenu && currentRole && (
          <MenuContext
            type='roles'
            typeTagHtml='modal'
            contextMenu={contextMenu}
            currentItem={currentRole}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
        <RoleModule selectedRoleDeletedAt={selectedRoleDeletedAt} selectedRoleIds={selectedRoleIds} />
      </Box>

      {/* Modal create */}
      {isModalOpen.create && (
        <RoleForm
          type='create'
          closeModal={() => closeModal('create')}
          isAnimationModalOpen={isAnimationModalOpen.create}
        />
      )}

      {isModalOpen.update && (
        <RoleForm
          type='update'
          closeModal={() => closeModal('update')}
          isAnimationModalOpen={isAnimationModalOpen.update}
          roles={filteredRoles}
          roleId={currentRole?.roleId || selectedRoleIds[0]}
        />
      )}
    </div>
  );
};

export default Roles;
