import React, { useState } from 'react';
import Header from '.';
import {
	ArchiveRestoreIcon,
	CheckCircleIcon,
	ChevronDownIcon,
	CircleIcon,
	FilterIcon,
	MoreVerticalIcon,
	PencilIcon,
	PlusCircleIcon,
	SearchIcon,
	Trash2Icon,
	TrashIcon,
	XCircleIcon,
} from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';

interface HeaderWithFilterMenuProps {
	title: string;
	type:
		| 'users'
		| 'roles'
		| 'modules'
		| 'warehouses'
		| 'products'
		| 'brands'
		| 'categories'
		| 'customers'
		| 'productHistories'
		| 'purchases'
		| 'purchaseDetails'
		| 'sales'
		| 'saleDetails'
		| 'stockMovements'
		| 'suppliers';
	typeTagHtml: 'link' | 'modal';
	setSearchQuery: (query: string) => void;
	filterRef: React.RefObject<HTMLDivElement>;
	filterStatus: string;
	isFilterOpen: boolean;
	setIsFilterOpen: (isOpen: boolean) => void;
	handleFilterStatus: (status: string) => void;
	selectedModels: string[];
	selectedModelsDeletedAt: string[];
	isDropdownOpen: boolean;
	setIsDropdownOpen: (isOpen: boolean) => void;
	openModal: (status: 'detail' | 'softDelete' | 'forceDelete' | 'restore' | 'create' | 'update') => void;
	dropdownRef: React.RefObject<HTMLDivElement>;
	isModalOpen: {
		detail: boolean;
		softDelete: boolean;
		forceDelete: boolean;
		restore: boolean;
	};
}

const HeaderWithFilterMenu: React.FC<HeaderWithFilterMenuProps> = ({
	title,
	type,
	typeTagHtml,
	setSearchQuery,
	filterRef,
	filterStatus,
	isFilterOpen,
	setIsFilterOpen,
	handleFilterStatus,
	selectedModels,
	isDropdownOpen,
	setIsDropdownOpen,
	openModal,
	dropdownRef,
	selectedModelsDeletedAt,
}) => {
	const [localSearchQuery, setLocalSearchQuery] = useState<string>('');

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setLocalSearchQuery(newValue);
		setSearchQuery(newValue);
	};

	return (
		<div className='flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0'>
			<Header name={title} />
			<div className='grid grid-cols-1 sm:flex sm:grid-cols-none items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-max'>
				{/* Search Input */}
				<div className='relative flex items-center w-full sm:max-w-[210px]'>
					<SearchIcon className='absolute left-3 w-5 h-5 text-gray-500' />
					<input
						type='text'
						placeholder={`Search ${title.toLocaleLowerCase()}...`}
						className='border border-gray-300 bg-white px-10 py-2 rounded-md focus:outline-none focus:ring w-full'
						value={localSearchQuery}
						onChange={handleSearchChange}
					/>
				</div>

				{/* Filter Dropdown */}
				<div className='relative w-full sm:max-w-max' ref={filterRef}>
					<button
						className='border border-gray-300 px-4 py-2 rounded-md flex justify-between sm:justify-normal items-center focus:outline-none focus:ring w-full'
						onClick={() => setIsFilterOpen(!isFilterOpen)}
					>
						<div className='flex items-center'>
							<FilterIcon className='w-5 h-5 mr-2' /> {filterStatus}
						</div>{' '}
						<ChevronDownIcon className='ml-2 w-4 h-4' />
					</button>

					<div
						className={clsx(
							'absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 transition-all duration-300 ease-out transform',
							{
								'scale-100 opacity-100': isFilterOpen,
								'scale-95 opacity-0 pointer-events-none': !isFilterOpen,
							}
						)}
					>
						<ul className='py-1'>
							<li
								className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'
								onClick={() => handleFilterStatus('All')}
							>
								<CircleIcon className='w-5 h-5 mr-2 text-gray-400' /> All
							</li>
							<li
								className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'
								onClick={() => handleFilterStatus('Active')}
							>
								<CheckCircleIcon className='w-5 h-5 mr-2 text-green-500' /> Active
							</li>
							<li
								className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'
								onClick={() => handleFilterStatus('Non Active')}
							>
								<XCircleIcon className='w-5 h-5 mr-2 text-red-500' /> Non Active
							</li>
						</ul>
					</div>
				</div>

				{/* Action Dropdown */}
				<div className='relative w-full sm:max-w-[120px]' ref={dropdownRef}>
					<button
						className={`flex items-center justify-between sm:justify-normal bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full ${
							selectedModels.length === 0 ? 'cursor-not-allowed opacity-50' : ''
						}`}
						onClick={() => setIsDropdownOpen(!isDropdownOpen)}
						disabled={selectedModels.length === 0}
					>
						<div className='flex items-center'>
							<MoreVerticalIcon className='w-5 h-5 mr-2' /> Actions
						</div>
						<ChevronDownIcon className='ml-2 w-4 h-4' />
					</button>

					<div
						className={clsx(
							'absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md z-10 transition-all duration-300 ease-out transform',
							{
								'scale-100 opacity-100': isDropdownOpen,
								'scale-95 opacity-0 pointer-events-none': !isDropdownOpen,
							}
						)}
					>
						<ul className='py-1'>
							{(filterStatus === 'All' || filterStatus === 'Active') && (
								<>
									<li className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'>
										{typeTagHtml === 'link' ? (
											<Link
												className='flex items-center w-full'
												href={`/dashboard/${type}/create`}
											>
												<PlusCircleIcon className='w-5 h-5 mr-2' /> Create
											</Link>
										) : (
											<button
												className='flex items-center w-full'
												onClick={() => {
													setIsDropdownOpen(!isDropdownOpen);
													openModal('create');
												}}
											>
												<PlusCircleIcon className='w-5 h-5 mr-2' /> Create
											</button>
										)}
									</li>
									{selectedModelsDeletedAt.length === 0 && (
										<>
											<li className='hover:bg-gray-100 px-4 py-2 cursor-pointer flex items-center'>
												{typeTagHtml === 'link' ? (
													<Link
														className='flex items-center w-full'
														href={`/dashboard/${type}/${selectedModels[0]}/edit`}
													>
														<PencilIcon className='w-5 h-5 mr-2' /> Edit
													</Link>
												) : (
													<button
														className='flex items-center w-full'
														onClick={() => {
															setIsDropdownOpen(!isDropdownOpen);
															openModal('update');
														}}
													>
														<PencilIcon className='w-5 h-5 mr-2' /> Edit
													</button>
												)}
											</li>
											<li className='hover:bg-gray-100'>
												<button
													className='px-4 py-2 cursor-pointer flex items-center w-full'
													onClick={() => {
														setIsDropdownOpen(!isDropdownOpen);
														openModal('softDelete');
													}}
												>
													<TrashIcon className='w-5 h-5 mr-2' /> Soft Delete
												</button>
											</li>
										</>
									)}
								</>
							)}
							<li className='hover:bg-gray-100'>
								<button
									className='px-4 py-2 cursor-pointer flex items-center w-full'
									onClick={() => {
										setIsDropdownOpen(!isDropdownOpen);
										openModal('forceDelete');
									}}
								>
									<Trash2Icon className='w-5 h-5 mr-2' /> Force Delete
								</button>
							</li>
							{(filterStatus === 'All' || filterStatus === 'Non Active') &&
								selectedModelsDeletedAt.length !== 0 && (
									<li className='hover:bg-gray-100'>
										<button
											className='px-4 py-2 cursor-pointer flex items-center w-full'
											onClick={() => {
												setIsDropdownOpen(!isDropdownOpen);
												openModal('restore');
											}}
										>
											<ArchiveRestoreIcon className='w-5 h-5 mr-2' /> Restore
										</button>
									</li>
								)}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default HeaderWithFilterMenu;
