import { useState } from 'react';

type ModalType = 'detail' | 'softDelete' | 'forceDelete' | 'restore' | 'create' | 'update';

interface ModalState {
	detail: boolean;
	softDelete: boolean;
	forceDelete: boolean;
	restore: boolean;
	create: boolean;
	update: boolean;
}

const useModal = () => {
	const [isModalOpen, setIsModalOpen] = useState<ModalState>({
		detail: false,
		softDelete: false,
		forceDelete: false,
		restore: false,
		create: false,
		update: false,
	});

	const [isAnimationModalOpen, setIsAnimationModalOpen] = useState<ModalState>({
		detail: false,
		softDelete: false,
		forceDelete: false,
		restore: false,
		create: false,
		update: false,
	});

	const openModal = (type: ModalType) => {
		setIsModalOpen((prevState) => ({
			...prevState,
			[type]: true,
		}));
		setTimeout(() => {
			setIsAnimationModalOpen((prevState) => ({
				...prevState,
				[type]: true,
			}));
		}, 10);
	};

	const closeModal = (type: ModalType) => {
		setIsAnimationModalOpen((prevState) => ({
			...prevState,
			[type]: false,
		}));
		setTimeout(() => {
			setIsModalOpen((prevState) => ({
				...prevState,
				[type]: false,
			}));
		}, 300);
	};

	return {
		isModalOpen,
		isAnimationModalOpen,
		openModal,
		closeModal,
	};
};

export default useModal;
