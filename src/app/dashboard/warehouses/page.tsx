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
  useForceDeleteWarehousesMutation,
  useGetWarehousesQuery,
  useRestoreWarehousesMutation,
  useSoftDeleteWarehousesMutation,
} from '@/state/api';
import { IUser, IWarehouse } from '@/types/model';
import { ResponseError } from '@/types/response';
import { getModelIdsToHandle, getRowClassName } from '@/utils/common';
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { MoreVerticalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import WarehouseForm from '@/app/(components)/Modal/WarehouseFrom';

const Warehouses = () => {
  const { data: warehouses, isError, isLoading } = useGetWarehousesQuery();
  const [softDeletes, { isLoading: isSoftDeleting }] = useSoftDeleteWarehousesMutation();
  const [forceDeletes, { isLoading: isForceDeleting }] = useForceDeleteWarehousesMutation();
  const [restoreWarehouses, { isLoading: isRestoring }] = useRestoreWarehousesMutation();

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

  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<string[]>([]);
  const [selectedWarehouseDeletedAt, setSelectedWarehouseDeletedAt] = useState<string[]>([]);
  const [currentWarehouse, setCurrentWarehouse] = useState<IWarehouse | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        return (
          <span
            className='inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px] text-xs font-bold'
            style={{ backgroundColor: params.row.status === 'AVAILABLE' ? 'green' : 'red' }}
            title={params.row.status}
          >
            {params.row.status}
          </span>
        );
      },
      valueGetter: (params) => {
        return params;
      },
    },
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'location', headerName: 'Location', width: 200, flex: 1 },
    {
      field: 'pic',
      headerName: 'PIC',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        return (
          <span
            className='inline-flex justify-start items-center rounded-md text-grey-900 max-w-max h-max max-h-[20px]'
            title={params.row.pic.name}
          >
            {params.row.pic.name}
          </span>
        );
      },
      valueGetter: (params: IUser) => {
        return params.name;
      },
    },
    { field: 'capacity', headerName: 'Capacity', width: 200, flex: 1, align: 'center', headerAlign: 'center' },
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
              setCurrentWarehouse(params.row);
            }}
          >
            <MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Handle search and filter
  const filteredWarehouses = warehouses?.data?.filter((warehouse) => {
    const matchesSearch =
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !warehouse.deletedAt) ||
      (filterStatus === 'Non Active' && warehouse.deletedAt);

    return matchesSearch && matchesStatus;
  });

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentWarehouse(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedWarehouseIds(selectedIds);

    const selectedRows = filteredWarehouses?.filter((warehouse) => selectedIds.includes(warehouse.warehouseId)) || [];

    const deletedAtValues = selectedRows
      .filter((warehouse) => warehouse.deletedAt)
      .map((warehouse) => warehouse.deletedAt as string);

    setSelectedWarehouseDeletedAt(deletedAtValues);
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

    const record = filteredWarehouses?.find((row) => row.warehouseId === rowId);

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentWarehouse(record);
  };

  const handleWarehouseAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    try {
      if (ids.length === 0) {
        throw new Error('No warehouses selected');
      }

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          successMessage = response.message || 'Warehouses soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete warehouses';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'Warehouses force deleted successfully';
          failureMessage = response.message || 'Failed to force delete warehouses';
          break;

        case 'restore':
          response = await restoreWarehouses({ ids }).unwrap();
          successMessage = response.message || 'Warehouses restored successfully';
          failureMessage = response.message || 'Failed to restore warehouses';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentWarehouse(null);
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

  if (isError || !warehouses) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Warehouses'
        typeTagHtml='modal'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedWarehouseIds}
        selectedModelsDeletedAt={selectedWarehouseDeletedAt}
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
          marginTop: '20px',
        }}
      >
        <DataGrid
          rows={filteredWarehouses || []}
          columns={columns}
          getRowId={(row) => row.warehouseId}
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

        {/* Action Data Table */}
        {anchorPosition && (
          <MenuAction
            type='warehouses'
            typeTagHtml='modal'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentWarehouse as IWarehouse}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete Warehouse'
            description='Are you sure you want to soft delete this warehouse?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={isSoftDeleting}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleWarehouseAction(
                'softDelete',
                getModelIdsToHandle(selectedWarehouseIds, currentWarehouse as IWarehouse)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete Warehouse'
            description='Are you sure you want to force delete this warehouse?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={isForceDeleting}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleWarehouseAction(
                'forceDelete',
                getModelIdsToHandle(selectedWarehouseIds, currentWarehouse as IWarehouse)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore Warehouse'
            description='Are you sure you want to restore this warehouse?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={isRestoring}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleWarehouseAction(
                'restore',
                getModelIdsToHandle(selectedWarehouseIds, currentWarehouse as IWarehouse)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Context Menu */}
        {contextMenu && currentWarehouse && (
          <MenuContext
            type='warehouses'
            typeTagHtml='modal'
            contextMenu={contextMenu}
            currentItem={currentWarehouse}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
      </Box>

      {/* Modal create */}
      {isModalOpen.create && (
        <WarehouseForm
          type='create'
          closeModal={() => closeModal('create')}
          isAnimationModalOpen={isAnimationModalOpen.create}
        />
      )}

      {isModalOpen.update && (
        <WarehouseForm
          type='update'
          closeModal={() => closeModal('update')}
          isAnimationModalOpen={isAnimationModalOpen.update}
          warehouses={filteredWarehouses}
          warehouseId={currentWarehouse?.warehouseId || selectedWarehouseIds[0]}
        />
      )}
    </div>
  );
};

export default Warehouses;
