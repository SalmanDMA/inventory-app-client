import { User } from './user';

export interface InitialStateTypes {
	isSidebarCollapsed: boolean;
	isDarkMode: boolean;
	language: string;
	token: string | null;
	userLogin: User | null;
}

export interface GlobalStateTypes {
	global: InitialStateTypes;
	api: unknown;
	_persist?: {
		rehydrated: boolean;
		version: number;
	};
}
