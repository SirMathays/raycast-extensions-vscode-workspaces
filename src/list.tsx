import { ActionPanel, CopyToClipboardAction, List, OpenAction, ShowInFinderAction, popToRoot, Icon, closeMainWindow } from "@raycast/api";
import { useEffect, useState } from "react"
import { exec, ExecException, execSync } from "child_process";
import { readFileSync } from "fs";
import { take as _take, last as _last, sortBy as _sortBy, dropRight as _dropRight } from "lodash";
import getUuid from 'uuid-by-string'

import { Workspace, WorkspaceData } from './types';
import { config, dataTemplate, getFromStorage, saveToStorage } from "./config";
import { isValidJSON } from "./helpers";

export default function Command() {
  const [data, setData] = useState<WorkspaceData>({...dataTemplate});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const now = new Date;
    setIsLoading(true);

    getFromStorage().then(storage => {

      if (!storage.savedAt || (now.getTime() - storage.savedAt) < config.TTL) {
        const favorites = storage.favorites;
        const recents = _take(storage.recents, config.MAX_RECENTS);

        console.log("Fetching...");

        searchWorkspaces().then(items => {
          storage = { ...storage, items, recents, favorites, savedAt: now.getTime() }
          setData(storage);
          setIsLoading(false);
          saveToStorage(storage);
          console.log("Fetched and saved");
        })
      } else {
        setData(storage);
        setIsLoading(false);
      }
    });
  }, []);

  const toggleFavorite = (id: string) => {
    const newData: WorkspaceData = {...data};
    const idIndex = newData.favorites.indexOf(id);

    idIndex > -1
      ? newData.favorites.splice(idIndex, 1)
      : newData.favorites.push(id);

    setData(newData);
    saveToStorage(newData);
  }

  const setRecent = (id: string) => {
    const newData: WorkspaceData = {...data}
    const idIndex = newData.recents.indexOf(id);

    if (idIndex > -1) {
      newData.recents.splice(idIndex, 1)
    }

    newData.recents = _take([id, ...newData.recents], config.MAX_RECENTS)

    setData(newData);
    saveToStorage(newData);
  }

  const buildItems = (items: Workspace[], favorites: string[]) => {
    return items.map((item: Workspace) => {
      const { folders, directory, id } = item

      return <List.Item
        key={id}
        icon="item-icon.png"
        title={item.title}
        subtitle={folders[0] == '.' ? directory : folders[0]}
        accessoryIcon={favorites.includes(id) ? { source: config.FAVORITE_ICON, tintColor: config.FAVORITE_ICON_COLOR } : undefined}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <OpenAction
                title="Open in Visual Studio Code"
                target={item.path}
                icon={{ source: { light: "icon-light.png", dark: "icon-dark.png" }}}
                application="Visual Studio Code"
                onOpen={() => { setRecent(id); popToRoot() }}
              />
              {folders.length > 0 && <ActionPanel.Item
                title={`Open Project Folder in Finder`}
                icon={Icon.Finder}
                onAction={() => {
                  execSync(`cd '${directory}' && open '${folders[0]}'`)
                  popToRoot();
                  closeMainWindow();
                }}
              />}
              <ActionPanel.Item
                title={favorites.includes(id) ? 'Remove from Favorites' : 'Mark as Favorite'}
                icon={config.FAVORITE_ICON}
                shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
                onAction={() => toggleFavorite(id)}
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

  const mappedRecents: Workspace[] = _sortBy(
    data.items.filter(item => data.recents.includes(item.id)),
    (item: Workspace) => data.recents.indexOf(item.id)
  )

  const mappedRest: Workspace[] = _sortBy(
    data.items.filter(item => !data.recents.includes(item.id)),
    (item: Workspace) => !data.favorites.includes(item.id)
  )

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search for workspace...">
      <List.Section title="Recently Used">
        {buildItems(mappedRecents, data.favorites)}
      </List.Section>
      <List.Section title="Workspaces">
        {buildItems(mappedRest, data.favorites)}
      </List.Section>
    </List>
  );
}

type WorkspaceCodeFileFolder = {path: string, name?: string}
type WorkspaceCodeFile = {folders: WorkspaceCodeFileFolder[], settings?: [], extensions?: {recommendations?: string[]}};

const searchWorkspaces = () => new Promise((
    resolve: (rows: Workspace[]) => unknown,
    reject: (payload: {error: ExecException | null, stderr: string}) => unknown
  ) => {
    exec(`mdfind 'kMDItemFSName=*${config.FILE_EXT}' -onlyin ~ | grep -vE '${config.SKIP_DIR}'`, (error, stdout, stderr) => {
      if (stderr) return reject({error, stderr})

      const rows: Workspace[] = stdout.split("\n").filter(str => str.length)
        .map((path: string) => {
          const file = readFileSync(path, {encoding: 'utf-8'});
          const fileData: WorkspaceCodeFile = file && isValidJSON(file) ? JSON.parse(file) : {folders: []};
          const splittedPath: string[] = path.split('/');
          const filename = _last(splittedPath)

          return {
            id: getUuid(path),
            title: filename ? filename.replace(`${config.FILE_EXT}`, '') : '',
            path,
            directory: _dropRight(splittedPath).join('/'),
            folders: fileData.folders.map((f) => f.path)
          }
        })

      return resolve(_sortBy(rows, 'title'))
    })
})
