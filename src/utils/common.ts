import { IModule, IRole, IUser } from '@/types/model';
import { GridRowParams } from '@mui/x-data-grid';

type ModelTypes = IUser | IRole | IModule;

export const getRowClassName = (params: GridRowParams, filterStatus: string) => {
  if (filterStatus === 'All' && params.row.deletedAt) {
    return 'bg-gray-200 opacity-50';
  }
  return '';
};

export const getModelIdsToHandle = <T extends ModelTypes>(modelIds: string[] | null, currentModel: T): string[] => {
  if (modelIds && modelIds.length > 0) {
    return modelIds;
  }

  switch (true) {
    case 'userId' in currentModel:
      return [currentModel.userId];
    case 'roleId' in currentModel:
      return [currentModel.roleId];
    case 'modelId' in currentModel:
      return [currentModel.moduleId];
    default:
      return [];
  }
};

export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const buildModuleTree = (modules: IModule[]): IModule[] => {
  const moduleMap: { [key: string]: IModule } = {};
  const tree: IModule[] = [];

  modules.forEach((module) => {
    moduleMap[module.moduleId] = { ...module, childModules: [] };
  });

  modules.forEach((module) => {
    if (module.parentId === null) {
      tree.push(moduleMap[module.moduleId]);
    } else {
      const parentModule = moduleMap[module.parentId];
      if (parentModule) {
        parentModule.childModules!.push(moduleMap[module.moduleId]);
      }
    }
  });

  return tree;
};

export const removeFileExtension = (filename: string): string => {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
};
