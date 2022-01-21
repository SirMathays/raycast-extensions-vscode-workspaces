import {
  LocalStorageValue,
  getLocalStorageItem,
  setLocalStorageItem,
  Icon,
  Color,
} from "@raycast/api";

import { WorkspacesConfig, WorkspaceData } from "./types";

export const config: WorkspacesConfig = {
  FILE_EXT: '.code-workspace',
  SKIP_DIR: ['/vendor', '/node_modules'].join('|'),
  STORAGE_NAME: 'vsCodeWorkspaces',
  MAX_RECENTS: 3,
  FAVORITE_ICON: Icon.Star,
  FAVORITE_ICON_COLOR: Color.Yellow,
  TTL: 10,
}

export const dataTemplate: WorkspaceData = {
  savedAt: undefined,
  recents: [],
  favorites: [],
  items: []
}

export const parseStorage: (value: LocalStorageValue | undefined) => WorkspaceData = (value) => {
  return value ? { ...dataTemplate, ...JSON.parse(value.toString()) } : dataTemplate
}

export const getFromStorage: () => Promise<WorkspaceData> = () => {
  return new Promise((resolve) => getLocalStorageItem(config.STORAGE_NAME).then(value => {
    resolve(parseStorage(value))
  }))
}

export const saveToStorage: (value: WorkspaceData) => Promise<void> = (value) => {
  return setLocalStorageItem(config.STORAGE_NAME, JSON.stringify(value))
}