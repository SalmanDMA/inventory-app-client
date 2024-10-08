'use client';

import { useAppSelector } from '@/app/redux';
import { useCreateOrUpdateRoleModuleMutation, useGetModulesQuery } from '@/state/api';
import { IModule, IRoleModule } from '@/types/model';
import { ResponseError } from '@/types/response';
import { buildModuleTree } from '@/utils/common';
import { fetchRoleModuleByRoleId } from '@/utils/httpClient';
import { ChevronDown, ChevronRight, File } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const RoleModule = ({
  selectedRoleIds,
  selectedRoleDeletedAt,
}: {
  selectedRoleIds: string[];
  selectedRoleDeletedAt: string[];
}) => {
  const { data: allModules, isError: isModulesError, isLoading: isModulesLoading } = useGetModulesQuery();
  const [updateModuleCheckedState] = useCreateOrUpdateRoleModuleMutation();
  const token = useAppSelector((state) => state.global.token);

  const [modules, setModules] = useState<IModule[]>([]);
  const [checkedModules, setCheckedModules] = useState<{ [key: string]: boolean }>({});
  const [openModules, setOpenModules] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const loadModules = async () => {
      if (!isModulesLoading && allModules?.data) {
        const allQueryModules = allModules.data || [];

        const roleModuleData = await fetchRoleModuleByRoleId(selectedRoleIds[0], token as string);

        const tree = buildModuleTree(allQueryModules);
        setModules(tree);

        const checkedMap = roleModuleData.data.reduce((acc: { [key: string]: boolean }, roleModule: IRoleModule) => {
          acc[roleModule.moduleId] = roleModule.checked;
          return acc;
        }, {});

        setCheckedModules(checkedMap);
      }
    };

    loadModules();
  }, [allModules, selectedRoleIds, token, isModulesLoading]);

  const handleCheckboxChange = async (moduleId: string) => {
    const newCheckedState = !checkedModules[moduleId];

    setCheckedModules((prev) => ({
      ...prev,
      [moduleId]: newCheckedState,
    }));

    try {
      const response = await updateModuleCheckedState({
        roleId: selectedRoleIds[0],
        moduleId,
        checked: newCheckedState,
      }).unwrap();

      if (!response.success) {
        throw new Error(response.message || 'Failed to update module checked state');
      } else {
        toast.success(response.message || 'Module checked state updated successfully');
      }
    } catch (error) {
      setCheckedModules((prev) => ({
        ...prev,
        [moduleId]: !newCheckedState,
      }));

      const err = error as ResponseError;
      const errorMessage =
        err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

      toast.error('Action failed: ' + errorMessage);
    }
  };

  const toggleOpenModule = (moduleId: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const renderModuleTree = (moduleTree: IModule[]) => {
    return (
      <ul className='space-y-2'>
        {moduleTree.map((module) => {
          const isOpen = openModules[module.moduleId];
          const hasChildren = module.childModules && module.childModules.length > 0;
          return (
            <li key={module.moduleId} className='relative'>
              <div className='flex items-center'>
                {hasChildren ? (
                  <button
                    className='mr-2'
                    onClick={() => toggleOpenModule(module.moduleId)}
                    aria-label='Toggle Submodules'
                  >
                    {isOpen ? <ChevronDown /> : <ChevronRight />}
                  </button>
                ) : (
                  <span className='mr-2'>
                    <File size={16} />
                  </span>
                )}
                <input
                  type='checkbox'
                  checked={checkedModules[module.moduleId] || false}
                  onChange={() => handleCheckboxChange(module.moduleId)}
                  className='mr-2'
                />
                <label className='cursor-pointer'>{module.name}</label>
              </div>

              {hasChildren && isOpen && (
                <ul className='ml-6 transition-all duration-300 ease-in-out'>
                  {renderModuleTree(module.childModules as IModule[])}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  if (isModulesLoading) {
    return <div className='py-4'>Loading...</div>;
  }

  if (isModulesError) {
    return <div className='text-center text-red-500 py-4'>Failed to fetch data</div>;
  }

  return (
    <div
      className={`bg-white shadow rounded-lg border border-gray-200 !text-gray-700 !w-full !h-full px-5 py-7 ${
        selectedRoleIds.length > 0 && selectedRoleDeletedAt.length === 0 ? 'overflow-auto' : 'overflow-hidden'
      }`}
    >
      <h3
        className={`text-xl font-bold border-b-2 border-gray-500 pb-2 ${
          selectedRoleIds.length > 0 && selectedRoleDeletedAt.length === 0 ? 'mb-4' : ''
        }`}
      >
        Modules
      </h3>

      {selectedRoleIds.length > 0 && selectedRoleDeletedAt.length === 0 ? (
        <>{renderModuleTree(modules)}</>
      ) : selectedRoleDeletedAt.length > 0 ? (
        <div className='flex flex-col justify-center items-center gap-5 h-full'>
          <Image
            src='https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/a27ezptoatwav12g5tpm.svg'
            alt='Role deleted'
            width={200}
            height={200}
            className='mx-auto h-32 sm:h-48 lg:h-64 w-auto'
          />
          <p className='text-center text-base lg:text-2xl text-gray-500'>
            Selected role has been deleted, please select a new role
          </p>
        </div>
      ) : (
        <div className='flex flex-col justify-center items-center gap-5 h-full'>
          <Image
            src='https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/f43w5grrwh3zgqahy3o4.svg'
            alt='No role selected'
            width={200}
            height={200}
            className='mx-auto h-32 sm:h-48 lg:h-64 w-auto'
          />
          <p className='text-center text-base lg:text-2xl text-gray-500'>No role selected</p>
        </div>
      )}
    </div>
  );
};

export default RoleModule;
