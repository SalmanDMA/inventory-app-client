import { useState, useRef, useCallback } from 'react';

interface AnchorPosition {
  top: number;
  left: number;
}

interface UseMenuReturn {
  contextMenu: { mouseX: number; mouseY: number } | null;
  isMenuActionButton: boolean;
  openMenuActionTable: boolean;
  menuDataIdActionTable: string | null;
  anchorPosition: AnchorPosition | null;
  menuActionButtonRef: React.RefObject<HTMLDivElement>;
  menuActionTableRef: React.RefObject<HTMLDivElement>;
  divContextMenuRef: React.RefObject<HTMLDivElement>;
  handleActionTableClick: (event: React.MouseEvent<HTMLDivElement>, id: string) => void;
  handleCloseActionTable: () => void;
  setContextMenu: React.Dispatch<React.SetStateAction<{ mouseX: number; mouseY: number } | null>>;
  setIsMenuActionButton: React.Dispatch<React.SetStateAction<boolean>>;
  setAnchorPosition: React.Dispatch<React.SetStateAction<AnchorPosition | null>>;
}

export const useMenu = (): UseMenuReturn => {
  const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [isMenuActionButton, setIsMenuActionButton] = useState<boolean>(false);
  const [openMenuActionTable, setOpenMenuActionTable] = useState<boolean>(false);
  const [menuDataIdActionTable, setMenuDataIdActionTable] = useState<string | null>(null);
  const [anchorPosition, setAnchorPosition] = useState<AnchorPosition | null>(null);

  const menuActionButtonRef = useRef<HTMLDivElement>(null);
  const menuActionTableRef = useRef<HTMLDivElement>(null);
  const divContextMenuRef = useRef<HTMLDivElement>(null);

  const handleActionTableClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, id: string) => {
      const rect = event.currentTarget.getBoundingClientRect();

      if (id === menuDataIdActionTable && openMenuActionTable) {
        handleCloseActionTable();
      } else {
        setAnchorPosition({ top: rect.bottom, left: rect.left });

        setTimeout(() => {
          setMenuDataIdActionTable(id);
          setOpenMenuActionTable(true);
        }, 10);
      }
    },
    [menuDataIdActionTable, openMenuActionTable]
  );

  const handleCloseActionTable = useCallback(() => {
    setMenuDataIdActionTable(null);
    setOpenMenuActionTable(false);
    setAnchorPosition(null);
  }, []);

  return {
    contextMenu,
    isMenuActionButton,
    openMenuActionTable,
    menuDataIdActionTable,
    anchorPosition,
    menuActionButtonRef,
    menuActionTableRef,
    divContextMenuRef,
    handleActionTableClick,
    handleCloseActionTable,
    setContextMenu,
    setIsMenuActionButton,
    setAnchorPosition,
  };
};
