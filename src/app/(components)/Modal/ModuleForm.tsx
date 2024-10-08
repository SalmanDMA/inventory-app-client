'use client';

import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { IModule } from '@/types/model';
import { CreateOrUpdateModuleFormValues } from '@/types/formik';
import {
  useCreateModuleMutation,
  useUpdateModuleMutation,
  useGetModulesQuery,
  useGetModuleTypesQuery,
} from '@/state/api';
import { ResponseError } from '@/types/response';
import { buildModuleTree } from '@/utils/common';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ModuleForm = ({
  type,
  moduleId,
  isAnimationModalOpen,
  closeModal,
}: {
  type: 'create' | 'update';
  moduleId?: string;
  isAnimationModalOpen: boolean;
  closeModal: () => void;
}) => {
  const [createModule, { isLoading: isCreating }] = useCreateModuleMutation();
  const [updateModule, { isLoading: isUpdating }] = useUpdateModuleMutation();
  const { data: modules } = useGetModulesQuery();
  const { data: modulesTypes } = useGetModuleTypesQuery();
  const [selectedModuleTypeMenuDirectory, setSelectedModuleTypeMenuDirectory] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const toggleModule = (moduleId: string) => {
    if (expandedModules.includes(moduleId)) {
      setExpandedModules(expandedModules.filter((id) => id !== moduleId));
    } else {
      setExpandedModules([...expandedModules, moduleId]);
    }
  };

  const handleSelectParent = (moduleId: string) => {
    formik.setFieldValue('parentId', moduleId);
    setSelectedParent(moduleId);
    setDropdownOpen(false);
  };

  const handleSelectModuleType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const moduleTypeId = e.target.value;
    const moduleTypeData = modulesTypes?.data?.find((moduleType) => moduleType.moduleTypeId === moduleTypeId);
    formik.setFieldValue('moduleTypeId', moduleTypeId);
    if (moduleTypeData.name.toLocaleLowerCase() === 'menu directory') {
      setSelectedModuleTypeMenuDirectory(moduleTypeId);
    } else {
      setSelectedModuleTypeMenuDirectory(null);
    }
  };

  const initialValues: CreateOrUpdateModuleFormValues = {
    name: '',
    parentId: '',
    moduleTypeId: '',
    icon: '',
    route: '',
    description: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    moduleTypeId: Yup.string().required('Module type is required'),
    parentId: Yup.string(),
    icon: Yup.string(),
    route: Yup.string(),
    description: Yup.string(),
  });

  const formik = useFormik<CreateOrUpdateModuleFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (!selectedModuleTypeMenuDirectory && !values.parentId) {
          toast.error('Parent ID is required when a module type not is set to "Menu Directory".');
          formik.setFieldError('parentId', 'Parent ID is required when a module type not is set to "Menu Directory".');
          setSubmitting(false);
          return;
        }

        let response;
        if (type === 'create') {
          response = await createModule({ ...values }).unwrap();
        } else {
          response = await updateModule({ ...values, moduleId }).unwrap();
        }

        if (response?.success) {
          toast.success(response.message || `Module ${type} successfully!`);
          closeModal();
        } else {
          throw new Error(response?.message || 'Something went wrong');
        }
      } catch (error) {
        const err = error as ResponseError;
        const errorMessage =
          err.data?.message || (error as Error).message?.replace(/^Error:\s*/, '') || 'Something went wrong';

        toast.error('Action failed: ' + errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Recursive function to render module tree structure for dropdown with accordion
  const renderDropdownTreeOptions = (modules: IModule[], level: number = 0) => {
    return modules.map((mod) => (
      <React.Fragment key={mod.moduleId}>
        <div className={`flex items-center hover:bg-gray-200 py-1 pr-1 pl-4 rounded`}>
          {mod.childModules && mod.childModules.length > 0 && (
            <button
              type='button'
              onClick={() => toggleModule(mod.moduleId)}
              className='text-gray-600 mr-2 focus:outline-none'
            >
              {expandedModules.includes(mod.moduleId) ? '-' : '+'}
            </button>
          )}
          <div
            className={`cursor-pointer w-full`}
            style={{ paddingLeft: `${level * 1}rem` }}
            onClick={() => handleSelectParent(mod.moduleId)}
          >
            {mod.name}
          </div>
        </div>
        {mod.childModules && mod.childModules.length > 0 && expandedModules.includes(mod.moduleId) && (
          <div>{renderDropdownTreeOptions(mod.childModules, level + 1)}</div>
        )}
      </React.Fragment>
    ));
  };

  useEffect(() => {
    if (type === 'update' && moduleId && modules) {
      const currentModule = modules?.data?.find((mod) => Number(mod.moduleId) === Number(moduleId));
      if (currentModule) {
        formik.setValues({
          name: currentModule.name,
          moduleTypeId: currentModule.moduleTypeId,
          parentId: currentModule.parentId || '',
          icon: currentModule.icon || '',
          route: currentModule.route || '',
          description: currentModule.description || '',
        });
        const moduleTypeData = modulesTypes?.data?.find(
          (moduleType) => moduleType.moduleTypeId === currentModule.moduleTypeId
        );
        if (moduleTypeData?.name.toLocaleLowerCase() === 'menu directory') {
          setSelectedModuleTypeMenuDirectory(currentModule.moduleTypeId);
        }
        setSelectedParent(currentModule.parentId);
      }
    } else {
      formik.resetForm();
    }
  }, [type, moduleId, modules]);

  // Build the module tree
  const moduleTree = buildModuleTree(modules?.data || []);

  return (
    <div
      className={`fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 ${
        isAnimationModalOpen ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300`}
      onClick={closeModal}
    >
      <div
        className={`bg-white p-6 rounded-md shadow-lg max-w-2xl w-full transform transition-all duration-300 ${
          isAnimationModalOpen ? 'scale-100' : 'scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className='text-2xl font-semibold mb-4'>{type === 'create' ? 'Create Module' : 'Update Module'}</h2>

        <form onSubmit={formik.handleSubmit} className='bg-white rounded-lg p-6'>
          <div className='grid grid-cols-1 gap-6'>
            {/* Name Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>Name</label>
              <input
                type='text'
                name='name'
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  formik.touched.name && formik.errors.name ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.name && formik.errors.name && (
                <p className='text-red-500 text-sm'>{formik.errors.name}</p>
              )}
            </div>

            <div className={`grid ${selectedModuleTypeMenuDirectory ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
              {/* Module Type Dropdown */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Module Type</label>
                <select
                  name='moduleTypeId'
                  value={formik.values.moduleTypeId}
                  onChange={(e) => handleSelectModuleType(e)}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formik.touched.moduleTypeId && formik.errors.moduleTypeId ? 'border-red-500' : ''
                  }`}
                >
                  <option value='' disabled>
                    Select Module Type
                  </option>
                  {modulesTypes?.data.map((type) => (
                    <option key={type.moduleTypeId} value={type.moduleTypeId}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {formik.touched.moduleTypeId && formik.errors.moduleTypeId && (
                  <p className='text-red-500 text-sm'>{formik.errors.moduleTypeId}</p>
                )}
              </div>

              {/* Parent Module Dropdown with Accordion */}
              {!selectedModuleTypeMenuDirectory && (
                <div>
                  <label className='block text-sm font-medium text-gray-700'>Parent Module</label>
                  <div className='relative'>
                    <button
                      type='button'
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`relative bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-left ${
                        formik.touched.parentId && formik.errors.parentId ? 'border-red-500' : ''
                      }`}
                    >
                      {selectedParent
                        ? modules?.data.find((mod) => mod.moduleId === selectedParent)?.name
                        : 'Select Parent Module'}
                      <span className='absolute right-2 top-1/2 transform -translate-y-1/2'>
                        {dropdownOpen ? <ChevronUp /> : <ChevronDown />}
                      </span>
                    </button>

                    {dropdownOpen && (
                      <div className='absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto z-50'>
                        {renderDropdownTreeOptions(moduleTree)}
                      </div>
                    )}
                  </div>
                  {formik.touched.parentId && formik.errors.parentId && (
                    <p className='text-red-500 text-sm'>{formik.errors.parentId}</p>
                  )}
                </div>
              )}
            </div>

            <div className='grid grid-cols-2 gap-6'>
              {/* Icon Input */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Icon</label>
                <input
                  type='text'
                  name='icon'
                  value={formik.values.icon}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formik.touched.icon && formik.errors.icon ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.icon && formik.errors.icon && (
                  <p className='text-red-500 text-sm'>{formik.errors.icon}</p>
                )}
              </div>

              {/* Route Input */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Route</label>
                <input
                  type='text'
                  name='route'
                  value={formik.values.route}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formik.touched.route && formik.errors.route ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.route && formik.errors.route && (
                  <p className='text-red-500 text-sm'>{formik.errors.route}</p>
                )}
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>Description</label>
              <textarea
                name='description'
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                  formik.touched.description && formik.errors.description ? 'border-red-500' : ''
                }

                `}
              />
              {formik.touched.description && formik.errors.description && (
                <p className='text-red-500 text-sm'>{formik.errors.description}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className='mt-6 flex justify-end gap-4'>
            <button
              type='button'
              className='bg-red-500 text-white px-4 py-2 rounded'
              disabled={formik.isSubmitting || isCreating || isUpdating}
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type='submit'
              className='bg-blue-500 text-white px-4 py-2 rounded'
              disabled={formik.isSubmitting || isCreating || isUpdating}
            >
              {type === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleForm;
