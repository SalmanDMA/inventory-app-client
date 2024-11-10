'use client';

import { useState, MouseEvent, useEffect } from 'react';
import {
	useForceDeleteUploadsMutation,
	useForceDeleteProductsMutation,
	useGetProductsQuery,
	useRestoreUploadsMutation,
	useRestoreProductsMutation,
	useSoftDeleteUploadsMutation,
	useSoftDeleteProductsMutation,
} from '@/state/api';
import { DataGrid, GridColDef, GridRowParams, GridRowSelectionModel } from '@mui/x-data-grid';
import { MoreVerticalIcon } from 'lucide-react';
import { IProduct, IProductHistory } from '@/types/model';
import { Box, Button, List, ListItem, ListItemIcon, Typography } from '@mui/material';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { ResponseError } from '@/types/response';
import Confirmation from '@/app/(components)/Modal/Confirmation';
import { useAppSelector } from '@/app/redux';
import { deleteAvatarFromCloudinary, fetchProductById, fetchProductHistoriesByProductId } from '@/utils/httpClient';
import HeaderWithFilterMenu from '@/app/(components)/Header/WithFilterMenu';
import MenuContext from '@/app/(components)/Menu/Context';
import MenuAction from '@/app/(components)/Menu/Action';
import useModal from '@/app/hooks/useModal';
import { useMenu } from '@/app/hooks/useMenu';
import { useSearchQuery } from '@/app/hooks/useSearchQuery';
import { useFilterStatusData } from '@/app/hooks/useFilterStatusData';
import { getModelIdsToHandle, getRowClassName } from '@/utils/common';
import { useFetchFile } from '@/app/hooks/useFetchFile';
import ProductHistoryForm from '@/app/(components)/Modal/ProductHistoryForm';

const Products = () => {
	const { data: products, isError, isLoading } = useGetProductsQuery();
	const [softDeletes] = useSoftDeleteProductsMutation();
	const [forceDeletes] = useForceDeleteProductsMutation();
	const [restoreProducts] = useRestoreProductsMutation();
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

	const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
	const [selectedProductDeletedAt, setSelectedProductDeletedAt] = useState<string[]>([]);
	const [currentProduct, setCurrentProduct] = useState<IProduct | null>(null);
	const [loadingAction, setLoadingAction] = useState<boolean>(false);

	const [allProductHistoriesByProductId, setAllProductHistoriesByProductId] = useState<IProductHistory[] | []>([]);
	const [currentProductHistory, setCurrentProductHistory] = useState<IProductHistory | null>(null);

	const { fileUrl } = useFetchFile(
		currentProduct?.imageId ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${currentProduct?.imageId}` : null,
		token as string
	);

	const columns: GridColDef[] = [
		{ field: 'name', headerName: 'Product Name', width: 200, flex: 1 },
		{ field: 'sku', headerName: 'SKU', width: 150, flex: 1 },
		{
			field: 'price',
			headerName: 'Price',
			width: 120,
			flex: 1,
			renderCell: (params) => (
				<span title={`$${params.row.price.toFixed(2)}`}>${params.row.price.toFixed(2)}</span>
			),
			valueGetter: (params) => {
				return params;
			},
		},
		{
			field: 'stock',
			headerName: 'Stock',
			width: 100,
			flex: 1,
			renderCell: (params) => (
				<span
					className={`inline-flex justify-center items-center px-2 py-1 rounded-md text-white max-w-max h-max max-h-[20px] ${
						params.row.stock > params.row.reorderLevel ? 'bg-green-500' : 'bg-red-500'
					}`}
					title={params.row.stock > params.row.reorderLevel ? 'In Stock' : 'Out of Stock'}
				>
					{params.row.stock}
				</span>
			),
		},
		{
			field: 'actions',
			headerName: 'Actions',
			width: 100,
			resizable: false,
			filterable: false,
			sortable: false,
			renderCell: (params) => {
				return (
					<div
						className='relative w-full h-full flex justify-center items-center'
						style={{ cursor: 'pointer' }}
						onClick={(event) => {
							handleCloseActionTable();
							handleActionTableClick(event, params.id.toString());
							setCurrentProduct(params.row);
						}}
					>
						<MoreVerticalIcon />
					</div>
				);
			},
		},
	];

	// Handle search and filter
	const filteredProducts = products?.data?.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			product.costPrice.toString().includes(searchQuery.toLowerCase()) ||
			(product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(product.discount && product.discount.toString().includes(searchQuery.toLowerCase())) ||
			(product.height && product.height.toString().includes(searchQuery.toLowerCase())) ||
			(product.weight && product.weight.toString().includes(searchQuery.toLowerCase())) ||
			(product.width && product.width.toString().includes(searchQuery.toLowerCase())) ||
			(product.rating && product.rating.toString().includes(searchQuery.toLowerCase())) ||
			product.reorderLevel.toString().includes(searchQuery.toLowerCase()) ||
			product.sku.toString().includes(searchQuery.toLowerCase()) ||
			product.stock.toString().includes(searchQuery.toLowerCase());

		const matchesStatus =
			filterStatus === 'All' ||
			(filterStatus === 'Active' && !product.deletedAt) ||
			(filterStatus === 'Non Active' && product.deletedAt);

		return matchesSearch && matchesStatus;
	});

	// Handle double click to open modal
	const handleRowDoubleClick = async (params: GridRowParams) => {
		setCurrentProduct(params.row);

		const productHistories = await fetchProductHistoriesByProductId(params.row.productId, token as string);
		setAllProductHistoriesByProductId(
			productHistories?.data?.filter((productHistory: IProductHistory) => productHistory.productId === params.row.productId) || []
		);
		openModal('detail');
	};

	// Handle row selection
	const handleRowSelectionModelChange = (rowSelectionModel: GridRowSelectionModel) => {
		const selectedIds = Array.from(rowSelectionModel) as string[];
		setSelectedProductIds(selectedIds);

		const selectedRows = filteredProducts?.filter((product) => selectedIds.includes(product.productId)) || [];

		const deletedAtValues = selectedRows
			.filter((product) => product.deletedAt)
			.map((product) => product.deletedAt as string);

		setSelectedProductDeletedAt(deletedAtValues);
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

		const record = filteredProducts?.find((row) => row.productId === rowId);

		if (!record) {
			return;
		}

		setContextMenu({ mouseX: event.clientX, mouseY: event.clientY });
		setCurrentProduct(record);
	};

	const handleProductAction = async (action: 'softDelete' | 'forceDelete' | 'restore', ids: string[]) => {
		setLoadingAction(true);
		try {
			if (ids.length === 0) {
				throw new Error('No products selected');
			}

			const productDataArray = await Promise.all(ids.map(async (id) => fetchProductById(id, token as string)));

			const imageIds = productDataArray
				.map((productData) => {
					return productData?.data.imageId;
				})
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
					successMessage = response.message || 'Products soft deleted successfully';
					failureMessage = response.message || 'Failed to soft delete products';
					break;

				case 'forceDelete':
					response = await forceDeletes({ ids }).unwrap();
					if (imageIds.length > 0) {
						await Promise.all(
							productDataArray.map(async (productData) => {
								if (productData?.data.image?.path) {
									await deleteAvatarFromCloudinary(productData.data.image.path, token as string);
								}
							})
						);
						if (imageIds.length > 0) {
							await deleteUpload({
								ids: imageIds,
							}).unwrap();
						}
					}
					successMessage = response.message || 'Products force deleted successfully';
					failureMessage = response.message || 'Failed to force delete products';
					break;

				case 'restore':
					response = await restoreProducts({ ids }).unwrap();
					if (imageIds.length > 0) {
						await restoreUpload({ ids: imageIds }).unwrap();
					}
					successMessage = response.message || 'Products restored successfully';
					failureMessage = response.message || 'Failed to restore products';
					break;

				default:
					throw new Error('Invalid action');
			}

			if (response.success) {
				toast.success(successMessage);
				setCurrentProduct(null);
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

	if (isError || !products) {
		return <div className='text-center text-red-500 py-4'>Failed to fetch products</div>;
	}

	return (
		<div className='flex flex-col gap-2'>
			{/* HEADER BAR */}
			<HeaderWithFilterMenu
				title='Products'
				type='products'
				typeTagHtml='link'
				setSearchQuery={handleSearchQuery}
				dropdownRef={menuActionButtonRef}
				filterRef={filterRef}
				filterStatus={filterStatus}
				isDropdownOpen={isMenuActionButton}
				setIsDropdownOpen={setIsMenuActionButton}
				handleFilterStatus={handleFilterStatus}
				selectedModels={selectedProductIds}
				selectedModelsDeletedAt={selectedProductDeletedAt}
				isFilterOpen={isFilterOpen}
				setIsFilterOpen={setIsFilterOpen}
				openModal={openModal}
				isModalOpen={isModalOpen}
			/>

			{/* TABLE */}
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
					rows={filteredProducts || []}
					columns={columns}
					getRowId={(row) => row.productId}
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
			</Box>

			{/* Action Data Table */}
			{anchorPosition && (
				<MenuAction
					type='products'
					typeTagHtml='link'
					dropdownActionTableRef={menuActionTableRef}
					anchorPosition={anchorPosition}
					currentItem={currentProduct as IProduct}
					filterStatus={filterStatus}
					openModal={openModal}
					handleCloseActionTable={handleCloseActionTable}
					openDropdownActionTable={openMenuActionTable}
				/>
			)}

			{/* Modal for soft/force delete & restore */}
			{isModalOpen.softDelete && (
				<Confirmation
					title='Soft Delete Product'
					description='Are you sure you want to soft delete this product?'
					isVisible={isAnimationModalOpen.softDelete}
					isLoading={loadingAction}
					closeModal={() => closeModal('softDelete')}
					handleDeactivate={() =>
						handleProductAction(
							'softDelete',
							getModelIdsToHandle(selectedProductIds, currentProduct as IProduct)
						)
					}
					handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
				/>
			)}

			{isModalOpen.forceDelete && !currentProductHistory && (
				<Confirmation
					title='Force Delete Product'
					description='Are you sure you want to force delete this product?'
					isVisible={isAnimationModalOpen.forceDelete}
					isLoading={loadingAction}
					closeModal={() => closeModal('forceDelete')}
					handleDeactivate={() =>
						handleProductAction(
							'forceDelete',
							getModelIdsToHandle(selectedProductIds, currentProduct as IProduct)
						)
					}
					handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
				/>
			)}

			{isModalOpen.restore && (
				<Confirmation
					title='Restore Product'
					description='Are you sure you want to restore this product?'
					isVisible={isAnimationModalOpen.restore}
					isLoading={loadingAction}
					closeModal={() => closeModal('restore')}
					handleDeactivate={() =>
						handleProductAction(
							'restore',
							getModelIdsToHandle(
								selectedProductIds, currentProduct as IProduct
							)
						)
					}
					handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
				/>
			)}

			{/* Modal for showing product details */}
			{isModalOpen.detail && currentProduct && (
				<div
					className={`fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 ${
						isAnimationModalOpen.detail ? 'opacity-100' : 'opacity-0'
					} transition-opacity duration-300`}
					onClick={() => closeModal('detail')}
				>
					<div
						className={`bg-white p-6 rounded-lg shadow-lg max-w-lg w-full transform transition-all duration-300 ${
							isAnimationModalOpen.detail ? 'scale-100' : 'scale-95'
						}`}
						onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
					>
						{/* Header with Image */}
						<div className='flex items-center mb-6'>
							<Image
								src={fileUrl as string}
								alt={`${currentProduct.name}'s image`}
								width={100}
								height={100}
								className='w-20 h-20 rounded-full mr-4 border border-gray-300 object-cover'
							/>
							<div>
								<h2 className='text-2xl font-bold text-gray-800'>{currentProduct.name}</h2>
								<p className='text-sm text-gray-500'>{currentProduct.sku}</p>
							</div>
						</div>

						{/* Divider */}
						<hr className='my-4 border-t-2 border-gray-200' />

						<div className='flex flex-col gap-4 max-h-[250px] overflow-auto'>
							{/* Product Information */}
							<div className='space-y-4'>
								<div className='flex justify-between'>
									<div>
										<strong className='block text-gray-600'>Added Date:</strong>
										<p className='text-gray-800'>
											{new Date(
												currentProduct.createdAt as unknown as string
											).toLocaleDateString()}
										</p>
									</div>
									<div className='text-end'>
										<strong className='block text-gray-600'>Price:</strong>
										<p className='text-gray-800'>${currentProduct.price.toFixed(2)}</p>
									</div>
								</div>

								<div className='flex justify-between'>
									<div>
										<strong className='block text-gray-600'>Stock:</strong>
										<p className='text-gray-800'>{currentProduct.stock} units</p>
									</div>
									<div className='text-end'>
										<strong className='block text-gray-600'>Reorder Level:</strong>
										<p className='text-gray-800'>{currentProduct.reorderLevel} units</p>
									</div>
								</div>

								<div className='flex justify-between'>
									<div>
										<strong className='block text-gray-600'>Category:</strong>
										<p className='text-gray-800'>{currentProduct.category?.name || 'N/A'}</p>
									</div>
									<div className='text-end'>
										<strong className='block text-gray-600'>Brand:</strong>
										<p className='text-gray-800'>{currentProduct.brand?.name || 'N/A'}</p>
									</div>
								</div>

								<div className='flex justify-between'>
									<div>
										<strong className='block text-gray-600'>Supplier:</strong>
										<p className='text-gray-800'>{currentProduct.supplier?.name || 'N/A'}</p>
									</div>

									<div className='text-end'>
										<strong className='block text-gray-600'>Weight:</strong>
										<p className='text-gray-800'>
											{currentProduct.weight ? `${currentProduct.weight} kg` : 'N/A'}
										</p>
									</div>
								</div>

								<div className='flex justify-between'>
									<div className='text-start'>
										<strong className='block text-gray-600'>Height:</strong>
										<p className='text-gray-800'>
											{currentProduct.height ? `${currentProduct.height} cm` : 'N/A'}
										</p>
									</div>
									<div className='text-end'>
										<strong className='block text-gray-600'>Width:</strong>
										<p className='text-gray-800'>
											{currentProduct.width ? `${currentProduct.width} cm` : 'N/A'}
										</p>
									</div>
								</div>

								<div>
									<strong className='block text-gray-600'>Description:</strong>
									<p className='text-gray-800'>{currentProduct.description}</p>
								</div>

								{currentProduct.discount && (
									<div className='flex items-center'>
										<strong className='block text-gray-600'>Discount:</strong>
										<p className='text-green-500 ml-2'>{currentProduct.discount}% OFF</p>
									</div>
								)}
							</div>

							{/* Divider */}
							<hr className='my-4 border-t-2 border-gray-200' />

							{/* Data Information */}
							<Box sx={{ maxWidth: 600 }}>
								<Typography variant='h4' component='h2' gutterBottom align='center'>
									History
								</Typography>
								<List>
									{allProductHistoriesByProductId.map((history, index) => {
										const isLastItem = index === allProductHistoriesByProductId.length - 1;
										return (
											<ListItem
												key={history.productHistoryId}
												sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: '8px' }}
											>
												<ListItemIcon>
													<Image
														src={
															history?.product?.image?.path ||
															'https://res.cloudinary.com/dz5jq5jds/image/upload/v1661375653/inventory-app/kqxu49becrexogjdwsix'
														}
														alt={history?.user?.name || 'avatar'}
														className='object-cover size-10 rounded-full'
														height={100}
														width={100}
													/>
												</ListItemIcon>
												<Box sx={{ flexGrow: 1 }}>
													<Typography variant='h6'>
														<strong>
															Date: {new Date(history.createdAt).toLocaleDateString()}
														</strong>
													</Typography>
													<Box>
														<Typography variant='body2'>
															<strong>New Price:</strong> ${history.newPrice.toFixed(2)}
														</Typography>
														<Typography variant='body2'>
															<strong>Old Price:</strong> ${history.oldPrice.toFixed(2)}
														</Typography>
														<Typography variant='body2'>
															<strong>User:</strong> {history?.user?.name} (
															{history?.user?.username})
														</Typography>
													</Box>
													<Box
														sx={{
															display: 'flex',
															justifyContent: 'flex-end',
															alignItems: 'center',
															mt: 1,
														}}
													>
														<Button
															variant='outlined'
															color='primary'
															onClick={() => {
																setCurrentProduct(null);
																closeModal('detail');
																setCurrentProductHistory(history);
																openModal('update');
															}}
														>
															Edit
														</Button>
														{!isLastItem && (
															<Button
																variant='outlined'
																color='secondary'
																onClick={() => {
																	setCurrentProduct(null);
																	closeModal('detail');
																	setCurrentProductHistory(history);
																	openModal('forceDelete');
																}}
															>
																Delete
															</Button>
														)}
													</Box>
												</Box>
											</ListItem>
										);
									})}
								</List>
							</Box>
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
			{contextMenu && currentProduct && (
				<MenuContext
					type='products'
					typeTagHtml='link'
					contextMenu={contextMenu}
					currentItem={currentProduct}
					openModal={openModal}
					divContextMenuRef={divContextMenuRef}
					filterStatus={filterStatus}
					setContextMenu={setContextMenu}
				/>
			)}

			{/* Product History Update */}
			{isModalOpen.update && currentProductHistory && (
				<ProductHistoryForm
					type='update'
					closeModal={() => {
						closeModal('update');
						setCurrentProductHistory(null);
					}}
					isAnimationModalOpen={isAnimationModalOpen.update}
					productHistories={allProductHistoriesByProductId}
					productHistoryId={currentProductHistory?.productHistoryId}
				/>
			)}

			{isModalOpen.forceDelete && currentProductHistory && (
				<Confirmation
					title='Force Delete Product History'
					description='Are you sure you want to force delete this product history?'
					isVisible={isAnimationModalOpen.forceDelete}
					isLoading={loadingAction}
					closeModal={() => {
						closeModal('forceDelete');
						setCurrentProductHistory(null);
					}}
					handleDeactivate={() =>
						handleProductAction(
							'forceDelete',
							getModelIdsToHandle(
								allProductHistoriesByProductId.map((productHistory) => productHistory.productHistoryId),
								currentProductHistory as IProductHistory)
						)
					}
					handleModalClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
				/>
			)}
		</div>
	);
};

export default Products;
