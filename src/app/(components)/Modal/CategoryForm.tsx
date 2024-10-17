'use client';

import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { ICategory } from '@/types/model';
import { CreateOrUpdateCategoryFormValues } from '@/types/formik';
import { useCreateCategoryMutation, useUpdateCategoryMutation, useGetCategoriesQuery } from '@/state/api';
import { ResponseError } from '@/types/response';
import { buildTree } from '@/utils/common';
import { ChevronDown, ChevronUp } from 'lucide-react';

const CategoryForm = ({
  type,
  categoryId,
  isAnimationModalOpen,
  closeModal,
}: {
  type: 'create' | 'update';
  categoryId?: string;
  isAnimationModalOpen: boolean;
  closeModal: () => void;
}) => {
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const { data: categories } = useGetCategoriesQuery();

  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter((id) => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const handleSelectParent = (categoryId: string) => {
    formik.setFieldValue('parentId', categoryId);
    setSelectedParent(categoryId);
    setDropdownOpen(false);
  };

  const initialValues: CreateOrUpdateCategoryFormValues = {
    name: '',
    parentId: '',
    description: '',
    alias: '',
    color: '',
    categoryType: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    categoryType: Yup.string().required('Category type is required'),
    parentId: Yup.string(),
    description: Yup.string(),
    alias: Yup.string(),
    color: Yup.string(),
  });

  const formik = useFormik<CreateOrUpdateCategoryFormValues>({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        let response;
        if (type === 'create') {
          response = await createCategory({
            name: values.name,
            parentId: values.parentId || null,
            description: values.description || undefined,
            alias: values.alias || undefined,
            color: values.color || undefined,
          }).unwrap();
        } else {
          response = await updateCategory({
            name: values.name,
            categoryId: categoryId as string,
            parentId: values.parentId || null,
            description: values.description || undefined,
            alias: values.alias || undefined,
            color: values.color || undefined,
          }).unwrap();
        }

        if (response?.success) {
          toast.success(response.message || `Category ${type} successfully!`);
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
  const renderDropdownTreeOptions = (categories: ICategory[], level: number = 0) => {
    return categories.map((mod) => (
      <React.Fragment key={mod.categoryId}>
        <div className={`flex items-center hover:bg-gray-200 py-1 pr-1 pl-4 rounded`}>
          {mod.childCategories && mod.childCategories.length > 0 && (
            <button
              type='button'
              onClick={() => toggleCategory(mod.categoryId)}
              className='text-gray-600 mr-2 focus:outline-none'
            >
              {expandedCategories.includes(mod.categoryId) ? '-' : '+'}
            </button>
          )}
          <div
            className={`cursor-pointer w-full`}
            style={{ paddingLeft: `${level * 1}rem` }}
            onClick={() => handleSelectParent(mod.categoryId)}
          >
            {mod.name}
          </div>
        </div>
        {mod.childCategories && mod.childCategories.length > 0 && expandedCategories.includes(mod.categoryId) && (
          <div>{renderDropdownTreeOptions(mod.childCategories, level + 1)}</div>
        )}
      </React.Fragment>
    ));
  };

  useEffect(() => {
    if (type === 'update' && categoryId && categories) {
      const currentCategory = categories?.data?.find((mod) => Number(mod.categoryId) === Number(categoryId));
      if (currentCategory) {
        formik.setValues({
          name: currentCategory.name,
          parentId: currentCategory.parentId || '',
          alias: currentCategory.alias || '',
          description: currentCategory.description || '',
          color: currentCategory.color || '',
        });
        setSelectedParent(currentCategory.parentId);
        if (currentCategory.parentId) {
          formik.setFieldValue('categoryType', 'child');
        } else {
          formik.setFieldValue('categoryType', 'root');
        }
      }
    } else {
      formik.resetForm();
      setSelectedParent(null);
    }
  }, [type, categoryId, categories]);

  // Build the module tree
  const moduleTree = buildTree(
    categories?.data || [],
    (category) => category.categoryId,
    (category) => category.parentId
  );

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
        <h2 className='text-2xl font-semibold mb-4'>{type === 'create' ? 'Create Category' : 'Update Category'}</h2>

        <form onSubmit={formik.handleSubmit} className='bg-white rounded-lg p-6'>
          <div className='grid grid-cols-1 gap-6'>
            {/* Name Input */}
            <div>
              <label className='block text-sm font-medium text-gray-700'>
                Name<span className='text-red-500'>*</span>
              </label>
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

            <div className={`grid ${formik.values.categoryType === 'child' ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
              <div>
                <label className='block text-sm font-medium text-gray-700'>
                  Category Type<span className='text-red-500'>*</span>
                </label>
                <select
                  name='categoryType'
                  value={formik.values.categoryType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formik.touched.categoryType && formik.errors.categoryType ? 'border-red-500' : ''
                  }`}
                >
                  <option value='' disabled>
                    Select Category Type
                  </option>
                  <option value='root'>Root</option>
                  <option value='child'>Child</option>
                </select>
                {formik.touched.categoryType && formik.errors.categoryType && (
                  <p className='text-red-500 text-sm'>Please select category type</p>
                )}
              </div>

              {/* Parent Category Dropdown with Accordion */}
              {formik.values.categoryType === 'child' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700'>Parent Category</label>
                  <div className='relative'>
                    <button
                      type='button'
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`relative bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-left ${
                        formik.touched.parentId && formik.errors.parentId ? 'border-red-500' : ''
                      }`}
                    >
                      {selectedParent
                        ? categories?.data.find((mod) => mod.categoryId === selectedParent)?.name
                        : 'Select Parent Category'}
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

            <div className='grid  grid-cols-1 sm:grid-cols-2 gap-6'>
              {/* Alias Input */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Alias</label>
                <input
                  type='text'
                  name='alias'
                  value={formik.values.alias}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                    formik.touched.alias && formik.errors.alias ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.alias && formik.errors.alias && (
                  <p className='text-red-500 text-sm'>{formik.errors.alias}</p>
                )}
              </div>

              {/* Color Input */}
              <div>
                <label className='block text-sm font-medium text-gray-700'>Color</label>
                <input
                  type='color'
                  name='color'
                  value={formik.values.color}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`bg-transparent mt-1 p-2 w-full border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-full max-h-[40px] ${
                    formik.touched.color && formik.errors.color ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.color && formik.errors.color && (
                  <p className='text-red-500 text-sm'>{formik.errors.color}</p>
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

export default CategoryForm;
