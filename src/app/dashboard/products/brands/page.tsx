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
  useForceDeleteBrandsMutation,
  useForceDeleteUploadsMutation,
  useGetBrandsQuery,
  useRestoreBrandsMutation,
  useRestoreUploadsMutation,
  useSoftDeleteBrandsMutation,
  useSoftDeleteUploadsMutation,
} from '@/state/api';
import { IBrand } from '@/types/model';
import { ResponseError } from '@/types/response';
import { getModelIdsToHandle, getRandomColor, getRowClassName } from '@/utils/common';
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { MoreVerticalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import BrandForm from '@/app/(components)/Modal/BrandForm';
import Image from 'next/image';
import { useFetchFile } from '@/app/hooks/useFetchFile';
import { useAppSelector } from '@/app/redux';
import { deleteAvatarFromCloudinary, fetchBrandById } from '@/utils/httpClient';

const Brands = () => {
  const { data: brands, isError, isLoading } = useGetBrandsQuery();
  const [softDeletes] = useSoftDeleteBrandsMutation();
  const [forceDeletes] = useForceDeleteBrandsMutation();
  const [restoreBrands] = useRestoreBrandsMutation();
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

  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedBrandDeletedAt, setSelectedBrandDeletedAt] = useState<string[]>([]);
  const [currentBrand, setCurrentBrand] = useState<IBrand | null>(null);
  const [loadingAction, setLoadingAction] = useState<boolean>(false);

  const { fileUrl } = useFetchFile(
    currentBrand?.imageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${currentBrand?.imageId}` : null,
    token as string
  );

  const columns: GridColDef[] = [
    {
      field: 'alias',
      headerName: '#',
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => {
        const mod = params.row;
        console.log(mod, 'mod');
        return (
          <span
            className='inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px]'
            title={mod.name}
            style={{ backgroundColor: mod.color ? `#${mod.color}` : getRandomColor() }}
          >
            {mod.alias ? mod.alias : mod.name.slice(0, 3).toUpperCase()}
          </span>
        );
      },
      valueGetter: (params) => {
        return params;
      },
    },
    {
      field: 'image',
      headerName: 'Image',
      resizable: false,
      filterable: false,
      sortable: false,
      width: 150,
      renderCell: (params) => {
        const imageUrl = params.row.image?.path;
        return (
          <div className='flex justify-center items-center w-full h-full'>
            <Image
              src={
                imageUrl ||
                'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/kqxu49becrexogjdwsix.png'
              }
              alt={params.row.name}
              title={params.row.image?.path ? params.row.name : 'No Image'}
              width={300}
              height={300}
              className='rounded-md object-cover w-[30px] h-[30px]'
            />
          </div>
        );
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
              setCurrentBrand(params.row);
            }}
          >
            <MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Handle search and filter
  const filteredBrands = brands?.data?.filter((brand) => {
    const matchesSearch =
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (brand.alias && brand.alias.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Active' && !brand.deletedAt) ||
      (filterStatus === 'Non Active' && brand.deletedAt);

    return matchesSearch && matchesStatus;
  });

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentBrand(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedBrandIds(selectedIds);

    const selectedRows = filteredBrands?.filter((brand) => selectedIds.includes(brand.brandId)) || [];

    const deletedAtValues = selectedRows.filter((brand) => brand.deletedAt).map((brand) => brand.deletedAt as string);

    setSelectedBrandDeletedAt(deletedAtValues);
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

    const record = filteredBrands?.find((row) => row.brandId === rowId);

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentBrand(record);
  };

  const handleBrandAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    setLoadingAction(true);
    try {
      if (ids.length === 0) {
        throw new Error('No brands selected');
      }

      const brandDataArray = await Promise.all(ids.map(async (id) => fetchBrandById(id, token as string)));

      const imageIds = brandDataArray
        .map((brandData) => brandData?.data.imageId)
        .filter((imageId): imageId is string => !!imageId) as string[];

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          if (imageIds.length > 0) {
            await softDeleteUpload({ ids: imageIds }).unwrap();
          }
          response = await softDeletes({ ids }).unwrap();
          successMessage = response.message || 'Brands soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete brands';
          break;

        case 'forceDelete':
          if (imageIds.length > 0) {
            await Promise.all(
              brandDataArray.map(async (brandData) => {
                if (brandData?.data.image?.path) {
                  await deleteAvatarFromCloudinary(brandData.data.image.path, token as string);
                }
              })
            );
            await deleteUpload({ ids: imageIds }).unwrap();
          }
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'Brands force deleted successfully';
          failureMessage = response.message || 'Failed to force delete brands';
          break;

        case 'restore':
          if (imageIds.length > 0) {
            await restoreUpload({ ids: imageIds }).unwrap();
          }
          response = await restoreBrands({ ids }).unwrap();
          successMessage = response.message || 'Brands restored successfully';
          failureMessage = response.message || 'Failed to restore brands';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentBrand(null);
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

  if (isError || !brands) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Brands'
        type='brands'
        typeTagHtml='modal'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedBrandIds}
        selectedModelsDeletedAt={selectedBrandDeletedAt}
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
          rows={filteredBrands || []}
          columns={columns}
          getRowId={(row) => row.brandId}
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
            type='brands'
            typeTagHtml='modal'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentBrand as IBrand}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete Brand'
            description='Are you sure you want to soft delete this brand?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={loadingAction}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleBrandAction('softDelete', getModelIdsToHandle(selectedBrandIds, currentBrand as IBrand))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete Brand'
            description='Are you sure you want to force delete this brand?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={loadingAction}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleBrandAction('forceDelete', getModelIdsToHandle(selectedBrandIds, currentBrand as IBrand))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore Brand'
            description='Are you sure you want to restore this brand?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={loadingAction}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleBrandAction('restore', getModelIdsToHandle(selectedBrandIds, currentBrand as IBrand))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Modal for showing user details */}
        {isModalOpen.detail && currentBrand && (
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
                  alt={`${currentBrand.name}'s image`}
                  width={100}
                  height={100}
                  className='size-40 object-cover'
                />
                <div className='flex flex-col justify-center items-center gap-1'>
                  <h2 className='text-2xl font-bold text-gray-800'>{currentBrand.name}</h2>
                  <p
                    className='inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px]'
                    style={{ backgroundColor: getRandomColor() }}
                  >
                    {currentBrand.alias}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <hr className='my-4 border-t-2 border-gray-200' />

              {/* User Information */}
              <div className='space-y-4'>
                <div>
                  <strong className='block text-gray-600'>Description:</strong>
                  <p className='text-gray-800'>{currentBrand.description}</p>
                </div>
                <div>
                  <strong className='block text-gray-600'>Added Since:</strong>
                  <p className='text-gray-800'>{new Date(currentBrand.createdAt).toLocaleDateString()}</p>
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
        {contextMenu && currentBrand && (
          <MenuContext
            type='brands'
            typeTagHtml='modal'
            contextMenu={contextMenu}
            currentItem={currentBrand}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
      </Box>

      {/* Modal create */}
      {isModalOpen.create && (
        <BrandForm
          type='create'
          closeModal={() => closeModal('create')}
          isAnimationModalOpen={isAnimationModalOpen.create}
        />
      )}

      {isModalOpen.update && (
        <BrandForm
          type='update'
          closeModal={() => closeModal('update')}
          isAnimationModalOpen={isAnimationModalOpen.update}
          brands={filteredBrands}
          brandId={currentBrand?.brandId || selectedBrandIds[0]}
        />
      )}
    </div>
  );
};

export default Brands;
