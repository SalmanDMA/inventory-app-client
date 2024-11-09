'use client';

import Image from 'next/image';
import HeaderWithFilterMenu from '@/app/(components)/Header/WithFilterMenu';
import MenuAction from '@/app/(components)/Menu/Action';
import MenuContext from '@/app/(components)/Menu/Context';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import { useFilterStatusData } from '@/app/hooks/useFilterStatusData';
import { useMenu } from '@/app/hooks/useMenu';
import useModal from '@/app/hooks/useModal';
import { useSearchQuery } from '@/app/hooks/useSearchQuery';
import {
  useForceDeleteProductHistoriesMutation,
  useGetProductHistoriesQuery,
  useGetUniqueProductHistoriesQuery,
  useRestoreProductHistoriesMutation, 
  useSoftDeleteProductHistoriesMutation,
} from '@/state/api';
import { IProduct, IProductHistory } from '@/types/model';
import { ResponseError } from '@/types/response';
import { formatToMMDDYYYY, getModelIdsToHandle, getRandomColor, getRowClassName } from '@/utils/common';
import { Box, Button, Divider, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ProductHistoryForm from '@/app/(components)/Modal/ProductHistoryForm';
import { useFetchFile } from '@/app/hooks/useFetchFile';
import { useAppSelector } from '@/app/redux';
import { MoreVerticalIcon } from 'lucide-react';

const ProductHistories = () => {
  const { data: uniqueProductHistories, isError, isLoading } = useGetUniqueProductHistoriesQuery();
  const { data: productHistories, isError: isErrorProductHistories, isLoading: isLoadingProductHistories } = useGetProductHistoriesQuery();
  const [softDeletes] = useSoftDeleteProductHistoriesMutation();
  const [forceDeletes] = useForceDeleteProductHistoriesMutation();
  const [restoreProductHistories] = useRestoreProductHistoriesMutation();

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

  const [selectedProductHistoryIds, setSelectedProductHistoryIds] = useState<string[]>([]);
  const [selectedProductHistoryDeletedAt, setSelectedProductHistoryDeletedAt] = useState<string[]>([]);
  const [currentProductHistory, setCurrentProductHistory] = useState<IProductHistory | null>(null);
  const [allProductHistories, setAllProductHistories] = useState<IProductHistory[] | []>([]);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [currentProductHistoryModalAction, setCurrentProductHistoryModalAction] = useState<IProductHistory | null>(null);

  const { fileUrl } = useFetchFile(
    currentProductHistory?.product?.imageId
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${currentProductHistory?.product?.imageId}`
      : null,
    token as string
  );

  const columns: GridColDef[] = [
    {
      field: 'product',
      headerName: 'Product Name',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        const mod = params.row.product;
        return <span title={mod.name}>{mod.name}</span>;
      },
      valueGetter: (params: IProduct) => {
        return params.name;
      },
    },
    {
      field: 'oldPrice',
      headerName: 'Old Price',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        return <span>${params.row.oldPrice}</span>;
      },
      valueGetter: (params) => {
        return params;
      },
    },
    {
      field: 'newPrice',
      headerName: 'New Price',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        return <span>${params.row.newPrice}</span>;
      },
      valueGetter: (params) => {
        return params;
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 200,
      flex: 1,
      renderCell: (params) => {
        return <span>{formatToMMDDYYYY(params.row.createdAt)}</span>;
      },
      valueGetter: (params) => {
        return params;
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
              setCurrentProductHistory(params.row);
            }}
          >
            <MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Handle search and filter
  const filteredProductHistories = uniqueProductHistories?.data?.filter((productHistory) => {
    const matchesSearch =
      productHistory.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      productHistory.newPrice.toString().includes(searchQuery.toLowerCase()) ||
      productHistory.oldPrice.toString().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !productHistory.deletedAt) ||
      (filterStatus === 'Non Active' && productHistory.deletedAt);

    return matchesSearch && matchesStatus;
  });

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentProductHistory(params.row);
    setAllProductHistories(productHistories?.data.filter((productHistory: IProductHistory) => productHistory.productId === params.row.productId) || []);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedProductHistoryIds(selectedIds);

    const selectedRows =
      filteredProductHistories?.filter((productHistory) => selectedIds.includes(productHistory.productHistoryId)) || [];

    const deletedAtValues = selectedRows
      .filter((productHistory) => productHistory.deletedAt)
      .map((productHistory) => productHistory.deletedAt as string);

    setSelectedProductHistoryDeletedAt(deletedAtValues);
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

    const record = filteredProductHistories?.find((row) => row.productHistoryId === rowId);

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentProductHistory(record);
  };

  const handleProductHistoryAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    setLoadingAction(true);
    try {
      if (ids.length === 0) {
        throw new Error('No productHistories selected');
      }

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          successMessage = response.message || 'ProductHistories soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete productHistories';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'ProductHistories force deleted successfully';
          failureMessage = response.message || 'Failed to force delete productHistories';
          break;

        case 'restore':
          response = await restoreProductHistories({ ids }).unwrap();
          successMessage = response.message || 'ProductHistories restored successfully';
          failureMessage = response.message || 'Failed to restore productHistories';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentProductHistory(null);
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

  // const handleActionModalProductHistory = ({action, data}: {action: 'forceDelete' | 'update', data: IProductHistory}) => {
  //   if (action === 'forceDelete') {
  //     setCurrentProductHistoryModalAction(data);
  //     openModal('forceDelete');
  //   } else {
  //     setCurrentProductHistoryModalAction(data);
  //     setCurrentProductHistory(data);
  //     openModal('update');
  //   }
  // }

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

  if (isLoading || isLoadingProductHistories) {
    return <div className='py-4'>Loading...</div>;
  }

  if (isError || isErrorProductHistories || !productHistories) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Product Histories'
        type='productHistories'
        typeTagHtml='modal'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedProductHistoryIds}
        selectedModelsDeletedAt={selectedProductHistoryDeletedAt}
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
          rows={filteredProductHistories || []}
          columns={columns}
          getRowId={(row) => row.productHistoryId}
          getRowClassName={(params) => getRowClassName(params, filterStatus)}
          onRowSelectionModelChange={handleRowSelectionModelChange}
          checkboxSelection
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
            type='productHistories'
            typeTagHtml='modal'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentProductHistory as IProductHistory}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete ProductHistory'
            description='Are you sure you want to soft delete this product history?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={loadingAction}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleProductHistoryAction(
                'softDelete',
                getModelIdsToHandle(selectedProductHistoryIds, currentProductHistory as IProductHistory)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete ProductHistory'
            description='Are you sure you want to force delete this product history?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={loadingAction}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleProductHistoryAction(
                'forceDelete',
                getModelIdsToHandle(selectedProductHistoryIds, currentProductHistory as IProductHistory)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore ProductHistory'
            description='Are you sure you want to restore this product history?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={loadingAction}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleProductHistoryAction(
                'restore',
                getModelIdsToHandle(selectedProductHistoryIds, currentProductHistory as IProductHistory)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Modal for showing user details */}
        {isModalOpen.detail && currentProductHistory && (
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
              <div className='flex flex-col justify-center items-center mb-6 gap-2'>
                <Image
                  src={
                    fileUrl ||
                    'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/m0vrgvjze72wxgqqsrad.png'
                  }
                  alt={`${currentProductHistory.product?.name}'s image`}
                  width={300}
                  height={300}
                  className='size-40 object-cover'
                />
                <div className='flex flex-col justify-center items-center gap-1'>
                  <h2 className='text-2xl font-bold text-gray-800'>{currentProductHistory.product?.name}</h2>
                  <p
                    className='inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px]'
                    style={{
                      backgroundColor: currentProductHistory.product?.category?.color
                        ? `#${currentProductHistory.product?.category?.color}`
                        : getRandomColor(),
                    }}
                  >
                    {currentProductHistory.product?.category?.name}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <hr className='my-4 border-t-2 border-gray-200' />

              {/* Data Information */}
              <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, maxHeight: 250, overflow: 'auto' }}>
                <Typography variant="h4" component="h2" gutterBottom align='center'>
                  History
                </Typography>
                <List>
                  {allProductHistories.map((history, index) => {
                    const isLastItem = index === allProductHistories.length - 1;
                    return (
                      <ListItem key={history.productHistoryId} sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
                        <ListItemIcon>
                          <Image
                            src={history?.product?.image?.path || 'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/kqxu49becrexogjdwsix'}
                            alt={history?.user?.name || 'avatar'}
                            className='object-cover size-10 rounded-full'
                            height={100}
                            width={100}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              <strong>Date: {new Date(history.createdAt).toLocaleDateString()}</strong>
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography>
                                <strong>New Price:</strong> ${history.newPrice.toFixed(2)}
                              </Typography>
                              <Typography>
                                <strong>Old Price:</strong> ${history.oldPrice.toFixed(2)}
                              </Typography>
                              <Typography>
                                <strong>User:</strong> {history?.user?.name} ({history?.user?.username})
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: "flex-end", alignItems: 'center', mt: 1 }}>
                                <Button variant="outlined" color="primary" onClick={() => {
                                  setCurrentProductHistory(history);
                                  openModal('update');
                                }}>
                                  Edit
                                </Button>
                                {!isLastItem && (
                                  <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => {
                                      setCurrentProductHistory(history);
                                      openModal('forceDelete');
                                    }}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </Box>
                              <Divider sx={{ my: 1 }} />
                              <Typography variant="body2" color="text.secondary">
                                {history?.product?.name} - SKU: {history?.product?.sku}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>

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
        {contextMenu && currentProductHistory && (
          <MenuContext
            type='productHistories'
            typeTagHtml='modal'
            contextMenu={contextMenu}
            currentItem={currentProductHistory}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
      </Box>

      {/* Modal create */}
      {isModalOpen.create && (
        <ProductHistoryForm
          type='create'
          closeModal={() => closeModal('create')}
          isAnimationModalOpen={isAnimationModalOpen.create}
        />
      )}

      {isModalOpen.update && (
        <ProductHistoryForm
          type='update'
          closeModal={() => closeModal('update')}
          isAnimationModalOpen={isAnimationModalOpen.update}
          productHistories={filteredProductHistories}
          productHistoryId={currentProductHistory?.productHistoryId || selectedProductHistoryIds[0]}
        />
      )}
    </div>
  );
};

export default ProductHistories;
