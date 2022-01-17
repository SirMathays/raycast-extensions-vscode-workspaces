import {
    ListItemProps,
    Icon,
    ColorLike
} from '@raycast/api';

export type WorkspacesConfig = {
    FILE_EXT: string,
    SKIP_DIR: string,
    STORAGE_NAME: string,
    MAX_RECENTS: number,
    FAVORITE_ICON: Icon,
    FAVORITE_ICON_COLOR: ColorLike,
    TTL: number
};

export type WorkspaceData = { items: Workspace[], favorites: string[], recents: string[], savedAt?: number };
export type Workspace = ListItemProps & { id: string, folders: string[], path: string, directory: string };