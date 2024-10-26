'use client';

import HeaderWithFilterMenu from '@/app/(components)/Header/WithFilterMenu';
import MenuAction from '@/app/(components)/Menu/Action';
import MenuContext from '@/app/(components)/Menu/Context';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import ModuleForm from '@/app/(components)/Modal/ModuleForm';
import { useFilterStatusData } from '@/app/hooks/useFilterStatusData';
import { useMenu } from '@/app/hooks/useMenu';
import useModal from '@/app/hooks/useModal';
import { useSearchQuery } from '@/app/hooks/useSearchQuery';
import {
  useForceDeleteModulesMutation,
  useGetModulesQuery,
  useRestoreModulesMutation,
  useSoftDeleteModulesMutation,
} from '@/state/api';
import { IModule } from '@/types/model';
import { ResponseError } from '@/types/response';
import { buildTree, getModelIdsToHandle, getRowClassName } from '@/utils/common';
import { Box } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import * as lucideIcons from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const Modules = () => {
  const { data: modules, isError, isLoading } = useGetModulesQuery();
  const [modulesTree, setModulesTree] = useState<IModule[]>([]);
  const [openModules, setOpenModules] = useState<{ [key: string]: boolean }>({});

  const [softDeletes, { isLoading: isSoftDeleting }] = useSoftDeleteModulesMutation();
  const [forceDeletes, { isLoading: isForceDeleting }] = useForceDeleteModulesMutation();
  const [restoreModules, { isLoading: isRestoring }] = useRestoreModulesMutation();

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

  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [selectedModuleDeletedAt, setSelectedModuleDeletedAt] = useState<string[]>([]);
  const [currentModule, setCurrentModule] = useState<IModule | null>(null);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Module Name',
      width: 300,
      flex: 1,
      renderCell: (params) => {
        const mod = params.row;
        const isOpen = openModules[mod.moduleId];
        const hasChildren = mod.childModules && mod.childModules.length > 0;

        return (
          <div className='flex items-center'>
            {hasChildren && (
              <button onClick={() => toggleOpenModule(mod.moduleId)} aria-label='Toggle Submodules' className='mr-2'>
                {isOpen ? <ChevronDown /> : <ChevronRight />}
              </button>
            )}
            <span>{mod.name}</span>
          </div>
        );
      },
    },
    {
      field: 'icon',
      headerName: 'Icon',
      resizable: false,
      filterable: false,
      sortable: false,
      width: 100,
      renderCell: (params) => {
        const mod = params.row;

        if (!mod.icon) {
          return null;
        }

        const IconComponent = lucideIcons[mod.icon as keyof typeof lucideIcons] as React.ElementType;

        if (!IconComponent) {
          return null;
        }

        return (
          <div className='w-full h-full flex flex-col gap-2 items-start justify-center'>
            <IconComponent className='w-6 h-6' />
          </div>
        );
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 250,
      flex: 1,
      renderCell: (params) => <span>{params.row.description ? `${params.row.description}` : '-'}</span>,
      valueGetter: (params) => params,
    },
    {
      field: 'route',
      headerName: 'Route',
      width: 200,
      resizable: false,
      filterable: false,
      sortable: false,
      renderCell: (params) => <span>{params.row.route ? `${params.row.route}` : '-'}</span>,
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
              setCurrentModule(params.row);
            }}
          >
            <lucideIcons.MoreVerticalIcon />
          </div>
        );
      },
    },
  ];

  // Flatten the tree while keeping the module structure
  const flattenTree = (moduleTree: IModule[], parentId: string | null = null): IModule[] => {
    let flatTree: IModule[] = [];
    moduleTree.forEach((mod) => {
      flatTree.push({ ...mod, parentId });

      if (openModules[mod.moduleId] && mod.childModules && mod.childModules.length > 0) {
        flatTree = [...flatTree, ...flattenTree(mod.childModules, mod.moduleId)];
      }
    });
    return flatTree;
  };

  // Toggle open/close state for a module
  const toggleOpenModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  // Build rows from flattened tree structure
  const rows = flattenTree(modulesTree);

  // Handle double click to open modal
  const handleRowDoubleClick = (params: GridRowParams) => {
    setCurrentModule(params.row);
    openModal('detail');
  };

  // Handle row selection
  const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
    const selectedIds = Array.from(rowSelectionModel) as string[];
    setSelectedModuleIds(selectedIds);

    const selectedRows = modules?.data?.filter((module) => selectedIds.includes(module.moduleId)) || [];

    const deletedAtValues = selectedRows
      .filter((module) => module.deletedAt)
      .map((module) => module.deletedAt as string);

    setSelectedModuleDeletedAt(deletedAtValues);
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

    const record = modules?.data?.find((row) => Number(row.moduleId) === Number(rowId));

    if (!record) {
      return;
    }

    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
    setCurrentModule(record);
  };

  const handleModuleAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
    try {
      if (ids.length === 0) {
        throw new Error('No modules selected');
      }

      let response;
      let successMessage = '';
      let failureMessage = '';

      switch (action) {
        case 'softDelete':
          response = await softDeletes({ ids }).unwrap();
          successMessage = response.message || 'Modules soft deleted successfully';
          failureMessage = response.message || 'Failed to soft delete modules';
          break;

        case 'forceDelete':
          response = await forceDeletes({ ids }).unwrap();
          successMessage = response.message || 'Modules force deleted successfully';
          failureMessage = response.message || 'Failed to force delete modules';
          break;

        case 'restore':
          response = await restoreModules({ ids }).unwrap();
          successMessage = response.message || 'Modules restored successfully';
          failureMessage = response.message || 'Failed to restore modules';
          break;

        default:
          throw new Error('Invalid action');
      }

      if (response.success) {
        toast.success(successMessage);
        setCurrentModule(null);
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

  // Load modules and construct the tree structure
  useEffect(() => {
    const loadModules = async () => {
      if (!isLoading && modules?.data) {
        const allQueryModules = modules.data || [];

        // Apply filters based on search query and filter status
        const filteredModules = allQueryModules.filter((role) => {
          const matchesSearch =
            role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesStatus =
            filterStatus === 'All' ||
            (filterStatus === 'Active' && !role.deletedAt) ||
            (filterStatus === 'Non Active' && role.deletedAt);

          return matchesSearch && matchesStatus;
        });

        // Build the tree with the filtered modules
        const tree = buildTree(
          filteredModules,
          (module) => module.moduleId,
          (module) => module.parentId
        );
        setModulesTree(tree);
      }
    };

    loadModules();
  }, [modules, isLoading, searchQuery, filterStatus]);

  if (isLoading) {
    return <div className='py-4'>Loading...</div>;
  }

  if (isError || !modules) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* HEADER BAR */}
      <HeaderWithFilterMenu
        title='Modules'
        type='modules'
        typeTagHtml='modal'
        setSearchQuery={handleSearchQuery}
        dropdownRef={menuActionButtonRef}
        filterRef={filterRef}
        filterStatus={filterStatus}
        isDropdownOpen={isMenuActionButton}
        setIsDropdownOpen={setIsMenuActionButton}
        handleFilterStatus={handleFilterStatus}
        selectedModels={selectedModuleIds}
        selectedModelsDeletedAt={selectedModuleDeletedAt}
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
          getRowId={(row) => row.moduleId}
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
            type='modules'
            typeTagHtml='modal'
            dropdownActionTableRef={menuActionTableRef}
            anchorPosition={anchorPosition}
            currentItem={currentModule as IModule}
            filterStatus={filterStatus}
            openModal={openModal}
            handleCloseActionTable={handleCloseActionTable}
            openDropdownActionTable={openMenuActionTable}
          />
        )}

        {/* Modal for soft/force delete & restore */}
        {isModalOpen.softDelete && (
          <Confirmation
            title='Soft Delete Module'
            description='Are you sure you want to soft delete this module?'
            isVisible={isAnimationModalOpen.softDelete}
            isLoading={isSoftDeleting}
            closeModal={() => closeModal('softDelete')}
            handleDeactivate={() =>
              handleModuleAction('softDelete', getModelIdsToHandle(selectedModuleIds, currentModule as IModule))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.forceDelete && (
          <Confirmation
            title='Force Delete Module'
            description='Are you sure you want to force delete this module?'
            isVisible={isAnimationModalOpen.forceDelete}
            isLoading={isForceDeleting}
            closeModal={() => closeModal('forceDelete')}
            handleDeactivate={() =>
              handleModuleAction('forceDelete', getModelIdsToHandle(selectedModuleIds, currentModule as IModule))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {isModalOpen.restore && (
          <Confirmation
            title='Restore Module'
            description='Are you sure you want to restore this module?'
            isVisible={isAnimationModalOpen.restore}
            isLoading={isRestoring}
            closeModal={() => closeModal('restore')}
            handleDeactivate={() =>
              handleModuleAction('restore', getModelIdsToHandle(selectedModuleIds, currentModule as IModule))
            }
            handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          />
        )}

        {/* Context Menu */}
        {contextMenu && currentModule && (
          <MenuContext
            type='modules'
            typeTagHtml='modal'
            contextMenu={contextMenu}
            currentItem={currentModule}
            openModal={openModal}
            divContextMenuRef={divContextMenuRef}
            filterStatus={filterStatus}
            setContextMenu={setContextMenu}
          />
        )}
      </Box>

      {/* Modal create */}
      {isModalOpen.create && (
        <ModuleForm
          type='create'
          closeModal={() => closeModal('create')}
          isAnimationModalOpen={isAnimationModalOpen.create}
        />
      )}

      {isModalOpen.update && (
        <ModuleForm
          type='update'
          closeModal={() => closeModal('update')}
          isAnimationModalOpen={isAnimationModalOpen.update}
          moduleId={currentModule?.moduleId || selectedModuleIds[0]}
        />
      )}
    </div>
  );
};

export default Modules;
