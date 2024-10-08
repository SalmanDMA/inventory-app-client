import { InitialStateTypes } from '@/types/state';
import { IUser } from '@/types/model';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: InitialStateTypes = {
  isSidebarCollapsed: false,
  isDarkMode: false,
  token: null,
  userLogin: null,
  language: 'en',
};

export const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setIsDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    setUserLogin: (state, action: PayloadAction<IUser | null>) => {
      state.userLogin = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
  },
});

export const { setIsSidebarCollapsed, setIsDarkMode, setToken, setUserLogin, setLanguage } = globalSlice.actions;
export default globalSlice.reducer;
