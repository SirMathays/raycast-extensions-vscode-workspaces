import { ActionPanel, CopyToClipboardAction, List, ShowInFinderAction, popToRoot } from "@raycast/api";
import { useEffect, useState } from "react"
import { take, sortBy } from "lodash";
import { Workspace, WorkspaceData } from './types';
import { config, dataTemplate, getFromStorage, saveToStorage } from "./config";
import { OpenProjectFolderAction, ToggleFavoriteAction, OpenInVsCodeAction } from "./actions";
import { searchWorkspaces } from "./workspaces";

export default function Command() {
  const [data, setData] = useState<WorkspaceData>({ ...dataTemplate });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date;
    setIsLoading(true);

    getFromStorage().then(storage => {

      if (!storage.savedAt || (now.getTime() - storage.savedAt) < config.TTL) {
        const favorites = storage.favorites;
        const recents = take(storage.recents, config.MAX_RECENTS);

        searchWorkspaces().then(items => {
          storage = { ...storage, items, recents, favorites, savedAt: now.getTime() }
          setData(storage);
          setIsLoading(false);
          saveToStorage(storage);
        })
      } else {
        setData(storage);
        setIsLoading(false);
      }
    });
  }, []);

  const toggleFavorite = (id: string) => {
    const newData: WorkspaceData = { ...data };
    const idIndex = newData.favorites.indexOf(id);

    idIndex > -1
      ? newData.favorites.splice(idIndex, 1)
      : newData.favorites.push(id);

    setData(newData);
    saveToStorage(newData);
  }

  const markAsRecent = (id: string) => {
    const newData: WorkspaceData = { ...data }
    const idIndex = newData.recents.indexOf(id);

    if (idIndex > -1) {
      newData.recents.splice(idIndex, 1)
    }

    newData.recents = take([id, ...newData.recents], config.MAX_RECENTS)

    setData(newData);
    saveToStorage(newData);
    popToRoot();
  }

  const buildItems = (items: Workspace[], favorites: string[]) => {
    return items.map((item: Workspace) => {
      const { folders, directory } = item;
      const isFavorited = favorites.includes(item.id);
      const favoriteIcon = {
        source: config.FAVORITE_ICON,
        tintColor: config.FAVORITE_ICON_COLOR
      };

      return <List.Item
        key={item.id}
        icon="item-icon.png"
        title={item.title}
        subtitle={folders[0] == '.' ? directory : folders[0]}
        accessoryIcon={isFavorited ? favoriteIcon : undefined}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <OpenInVsCodeAction
                path={item.path}
                onOpen={() => { markAsRecent(item.id) }}
              />
              {folders.length > 0 && <OpenProjectFolderAction
                directory={directory}
                folder={folders[0]}
              />}
              <ToggleFavoriteAction
                isFavorited={isFavorited}
                onToggle={() => toggleFavorite(item.id)}
              />
            </ActionPanel.Section>
            <ActionPanel.Section>
              <ShowInFinderAction
                title="Reveal Workspace file in Finder"
                path={item.path}
              />
              <CopyToClipboardAction
                title="Copy Workspace file path"
                content={item.path}
              />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    })
  }

  const mappedRecents: Workspace[] = sortBy(
    data.items.filter(item => data.recents.includes(item.id)),
    (item: Workspace) => data.recents.indexOf(item.id)
  )

  const mappedRest: Workspace[] = sortBy(
    data.items.filter(item => !data.recents.includes(item.id)),
    (item: Workspace) => !data.favorites.includes(item.id)
  )

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search for workspace..."
    >
      <List.Section title="Recently Used">
        {buildItems(mappedRecents, data.favorites)}
      </List.Section>
      <List.Section title="Workspaces">
        {buildItems(mappedRest, data.favorites)}
      </List.Section>
    </List>
  );
}

