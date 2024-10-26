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
  useForceDeleteCustomersMutation,
  useForceDeleteUploadsMutation,
  useGetCustomersQuery,
  useRestoreCustomersMutation,
  useRestoreUploadsMutation,
  useSoftDeleteCustomersMutation,
  useSoftDeleteUploadsMutation,
} from '@/state/api';
import { ICustomer } from '@/types/model';
import { ResponseError } from '@/types/response';
import { getModelIdsToHandle, getRowClassName } from '@/utils/common';
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { MoreVerticalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Image from 'next/image';
import { useFetchFile } from '@/app/hooks/useFetchFile';
import { useAppSelector } from '@/app/redux';
import { deleteAvatarFromCloudinary, fetchCustomerById } from '@/utils/httpClient';

const Customers = () => {
  const { data: customers, isError, isLoading } = useGetCustomersQuery();
  const [softDeletes] = useSoftDeleteCustomersMutation();
  const [forceDeletes] = useForceDeleteCustomersMutation();
  const [restoreCustomers] = useRestoreCustomersMutation();
  const [deleteUpload] = useForceDeleteUploadsMutation();
  const [softDeleteUpload] = useSoftDeleteUploadsMutation();
  const [restoreUpload] = useRestoreUploadsMutation();

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

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedCustomerDeletedAt, setSelectedCustomerDeletedAt] = useState<string[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<ICustomer | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  const { fileUrl } = useFetchFile(
    currentCustomer?.imageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${currentCustomer?.imageId}` : null,
    token as string
  );

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', width: 200, flex: 1 },
    { field: 'email', headerName: 'Email', width: 200, flex: 1 },
    { field: 'phone', headerName: 'Phone', width: 150, flex: 1 },
    { field: 'address', headerName: 'Address', width: 300, flex: 1 },
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
              setCurrentCustomer(params.row);
            }}
          >
            <MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Handle search and filter
  const filteredCustomers = customers?.data?.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !customer.deletedAt) ||
      (filterStatus === 'Non Active' && customer.deletedAt);

    return matchesSearch && matchesStatus;
  });

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentCustomer(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedCustomerIds(selectedIds);

    const selectedRows = filteredCustomers?.filter((customer) => selectedIds.includes(customer.customerId)) || [];

    const deletedAtValues = selectedRows
      .filter((customer) => customer.deletedAt)
      .map((customer) => customer.deletedAt as string);

    setSelectedCustomerDeletedAt(deletedAtValues);
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

    const record = filteredCustomers?.find((row) => row.customerId === rowId);

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentCustomer(record);
  };

  const handleCustomerAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    setLoadingAction(true);
    try {
      if (ids.length === 0) {
        throw new Error('No customers selected');
      }

      const customerDataArray = await Promise.all(ids.map(async (id) => fetchCustomerById(id, token as string)));

      const imageIds = customerDataArray
        .map((customerData) => customerData?.data.imageId)
        .filter((imageId): imageId is string => !!imageId) as string[];

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          if (imageIds.length > 0) {
            await softDeleteUpload({ ids: imageIds }).unwrap();
          }
          successMessage = response.message || 'Customers soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete customers';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          if (imageIds.length > 0) {
            await Promise.all(
              customerDataArray.map(async (customerData) => {
                if (customerData?.data.image?.path) {
                  await deleteAvatarFromCloudinary(customerData.data.image.path, token as string);
                }
              })
            );
            await deleteUpload({ ids: imageIds }).unwrap();
          }
          successMessage = response.message || 'Customers force deleted successfully';
          failureMessage = response.message || 'Failed to force delete customers';
          break;

        case 'restore':
          response = await restoreCustomers({ ids }).unwrap();
          if (imageIds.length > 0) {
            await restoreUpload({ ids: imageIds }).unwrap();
          }
          successMessage = response.message || 'Customers restored successfully';
          failureMessage = response.message || 'Failed to restore customers';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentCustomer(null);
        closeModal(action);
      } else {
        throw new Error(failureMessage);
      }
    } catch (error) {
      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
    } finally {
      setLoadingAction(false);
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

  if (isError || !customers) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Customers'
        type='customers'
        typeTagHtml='link'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedCustomerIds}
        selectedModelsDeletedAt={selectedCustomerDeletedAt}
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
          gap: '20px',
          marginTop: '20px',
        }}
      >
        <DataGrid
          rows={filteredCustomers || []}
          columns={columns}
          getRowId={(row) => row.customerId}
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
            type='customers'
            typeTagHtml='link'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentCustomer as ICustomer}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete Customer'
            description='Are you sure you want to soft delete this customer?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={loadingAction}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleCustomerAction('softDelete', getModelIdsToHandle(selectedCustomerIds, currentCustomer as ICustomer))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete Customer'
            description='Are you sure you want to force delete this customer?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={loadingAction}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleCustomerAction(
                'forceDelete',
                getModelIdsToHandle(selectedCustomerIds, currentCustomer as ICustomer)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore Customer'
            description='Are you sure you want to restore this customer?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={loadingAction}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleCustomerAction('restore', getModelIdsToHandle(selectedCustomerIds, currentCustomer as ICustomer))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Modal for showing customer details */}
        {isModalOpen.detail && currentCustomer && (
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
                  alt={`${currentCustomer.name}'s image`}
                  width={100}
                  height={100}
                  className='w-16 h-16 rounded-full mr-4 border border-gray-300 object-cover'
                />
                <div>
                  <h2 className='text-2xl font-bold text-gray-800'>{currentCustomer.name}</h2>
                </div>
              </div>

              {/* Divider */}
              <hr className='my-4 border-t-2 border-gray-200' />

              {/* Customer Information */}
              <div className='space-y-4'>
                <div className='flex justify-between'>
                  <div>
                    <strong className='block text-gray-600'>Company Name:</strong>
                    <p className='text-gray-800'>{currentCustomer.companyName}</p>
                  </div>
                  <div className='text-end'>
                    <strong className='block text-gray-600'>Email:</strong>
                    <p className='text-gray-800'>{currentCustomer.email}</p>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <div>
                    <strong className='block text-gray-600'>Phone:</strong>
                    <p className='text-gray-800'>{currentCustomer.phone}</p>
                  </div>
                  <div className='text-end'>
                    <strong className='block text-gray-600'>Address:</strong>
                    <p className='text-gray-800'>{currentCustomer.address || 'N/A'}</p>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <div>
                    <strong className='block text-gray-600'>Tax Number:</strong>
                    <p className='text-gray-800'>{currentCustomer.taxNumber || 'N/A'}</p>
                  </div>
                  <div className='text-end'>
                    <strong className='block text-gray-600'>Credit Limit:</strong>
                    <p className='text-gray-800'>{currentCustomer.creditLimit || 'N/A'}</p>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <div>
                    <strong className='block text-gray-600'>Contract Start Date:</strong>
                    <p className='text-gray-800'>
                      {new Date(currentCustomer.contractStartDate as unknown as string).toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                  <div className='text-end'>
                    <strong className='block text-gray-600'>Contract End Date:</strong>
                    <p className='text-gray-800'>
                      {new Date(currentCustomer.contractEndDate as unknown as string).toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className='flex justify-between'>
                  <div>
                    <strong className='block text-gray-600'>Payment Term:</strong>
                    <p className='text-gray-800'>{currentCustomer.paymentTerms || 'N/A'}</p>
                  </div>
                  <div className='text-end'>
                    <strong className='block text-gray-600'>Discount:</strong>
                    <p className='text-gray-800'>{currentCustomer.discount || 'N/A'} days</p>
                  </div>
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
        {contextMenu && currentCustomer && (
          <MenuContext
            type='customers'
            typeTagHtml='link'
            contextMenu={contextMenu}
            currentItem={currentCustomer}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
      </Box>
    </div>
  );
};

export default Customers;
