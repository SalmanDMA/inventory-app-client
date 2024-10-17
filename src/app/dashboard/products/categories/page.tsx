'use client';

import HeaderWithFilterMenu from '@/app/(components)/Header/WithFilterMenu';
import MenuAction from '@/app/(components)/Menu/Action';
import MenuContext from '@/app/(components)/Menu/Context';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import CategoryForm from '@/app/(components)/Modal/CategoryForm';
import { useFilterStatusData } from '@/app/hooks/useFilterStatusData';
import { useMenu } from '@/app/hooks/useMenu';
import useModal from '@/app/hooks/useModal';
import { useSearchQuery } from '@/app/hooks/useSearchQuery';
import {
  useForceDeleteCategoriesMutation,
  useGetCategoriesQuery,
  useRestoreCategoriesMutation,
  useSoftDeleteCategoriesMutation,
} from '@/state/api';
import { ICategory } from '@/types/model';
import { ResponseError } from '@/types/response';
import { buildTree, getModelIdsToHandle, getRandomColor, getRowClassName } from '@/utils/common';
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import * as lucideIcons from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const Categories = () => {
  const { data: categories, isError, isLoading } = useGetCategoriesQuery();
  const [categoriesTree, setCategoriesTree] = useState<ICategory[]>([]);
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({});

  const [softDeletes, { isLoading: isSoftDeleting }] = useSoftDeleteCategoriesMutation();
  const [forceDeletes, { isLoading: isForceDeleting }] = useForceDeleteCategoriesMutation();
  const [restoreCategories, { isLoading: isRestoring }] = useRestoreCategoriesMutation();

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

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedCategoryDeletedAt, setSelectedCategoryDeletedAt] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<ICategory | null>(null);

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
      field: 'name',
      headerName: 'Category Name',
      width: 300,
      flex: 1,
      renderCell: (params) => {
        const mod = params.row;
        const isOpen = openCategories[mod.categoryId];
        const hasChildren = mod.childCategories && mod.childCategories.length > 0;

        return (
          <div className='flex items-center'>
            {hasChildren && (
              <button
                onClick={() => toggleOpenModule(mod.categoryId)}
                aria-label='Toggle Subcategories'
                className='mr-2'
              >
                {isOpen ? <ChevronDown /> : <ChevronRight />}
              </button>
            )}
            <span>{mod.name}</span>
          </div>
        );
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      flex: 1,
      renderCell: (params) => <span>{params.row.description}</span>,
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
              setCurrentCategory(params.row);
            }}
          >
            <lucideIcons.MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Flatten the tree while keeping the category structure
  const flattenTree = (categoryTree: ICategory[], parentId: string | null = null): ICategory[] => {
    let flatTree: ICategory[] = [];
    categoryTree.forEach((mod) => {
      flatTree.push({ ...mod, parentId });

      if (openCategories[mod.categoryId] && mod.childCategories && mod.childCategories.length > 0) {
        flatTree = [...flatTree, ...flattenTree(mod.childCategories, mod.categoryId)];
      }
    });
    return flatTree;
  };

  // Toggle open/close state for a category
  const toggleOpenModule = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Build rows from flattened tree structure
  const rows = flattenTree(categoriesTree);

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentCategory(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedCategoryIds(selectedIds);

    const selectedRows = categories?.data?.filter((category) => selectedIds.includes(category.categoryId)) || [];

    const deletedAtValues = selectedRows
      .filter((category) => category.deletedAt)
      .map((category) => category.deletedAt as string);

    setSelectedCategoryDeletedAt(deletedAtValues);
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

    const record = categories?.data?.find((row) => Number(row.categoryId) === Number(rowId));

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentCategory(record);
  };

  const handleCategoryAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    try {
      if (ids.length === 0) {
        throw new Error('No categories selected');
      }

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          successMessage = response.message || 'Modules soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete categories';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'Modules force deleted successfully';
          failureMessage = response.message || 'Failed to force delete categories';
          break;

        case 'restore':
          response = await restoreCategories({ ids }).unwrap();
          successMessage = response.message || 'Modules restored successfully';
          failureMessage = response.message || 'Failed to restore categories';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentCategory(null);
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

  // Load categories and construct the tree structure
  useEffect(() => {
    const loadCategories = async () => {
      if (!isLoading && categories?.data) {
        const allQueryCategories = categories.data || [];

        // Apply filters based on search query and filter status
        const filteredCategories = allQueryCategories.filter((role) => {
          const matchesSearch =
            role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesStatus =
            filterStatus === 'All' ||
            (filterStatus === 'Active' && !role.deletedAt) ||
            (filterStatus === 'Non Active' && role.deletedAt);

          return matchesSearch && matchesStatus;
        });

        // Build the tree with the filtered categories
        const tree = buildTree(
          filteredCategories,
          (category) => category.categoryId,
          (category) => category.parentId
        );
        setCategoriesTree(tree);
      }
    };

    loadCategories();
  }, [categories, isLoading, searchQuery, filterStatus]);

  if (isLoading) {
    return <div className='py-4'>Loading...</div>;
  }

  if (isError || !categories) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Categories'
        type='categories'
        typeTagHtml='modal'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedCategoryIds}
        selectedModelsDeletedAt={selectedCategoryDeletedAt}
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
          rows={rows}
          columns={columns}
          getRowId={(row) => row.categoryId}
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
            type='categories'
            typeTagHtml='modal'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentCategory as ICategory}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete Category'
            description='Are you sure you want to soft delete this category?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={isSoftDeleting}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleCategoryAction('softDelete', getModelIdsToHandle(selectedCategoryIds, currentCategory as ICategory))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete Category'
            description='Are you sure you want to force delete this category?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={isForceDeleting}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleCategoryAction(
                'forceDelete',
                getModelIdsToHandle(selectedCategoryIds, currentCategory as ICategory)
              )
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore Category'
            description='Are you sure you want to restore this category?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={isRestoring}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleCategoryAction('restore', getModelIdsToHandle(selectedCategoryIds, currentCategory as ICategory))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Context Menu */}
        {contextMenu && currentCategory && (
          <MenuContext
            type='categories'
            typeTagHtml='modal'
            contextMenu={contextMenu}
            currentItem={currentCategory}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
      </Box>

      {/* Modal create */}
      {isModalOpen.create && (
        <CategoryForm
          type='create'
          closeModal={() => closeModal('create')}
          isAnimationModalOpen={isAnimationModalOpen.create}
        />
      )}

      {isModalOpen.update && (
        <CategoryForm
          type='update'
          closeModal={() => closeModal('update')}
          isAnimationModalOpen={isAnimationModalOpen.update}
          categoryId={currentCategory?.categoryId || selectedCategoryIds[0]}
        />
      )}
    </div>
  );
};

export default Categories;
