import { KeyboardShortcut, OpenAction } from "@raycast/api";
import { ActionPanelItem, closeMainWindow, Icon, popToRoot } from "@raycast/api";
import { execSync } from "child_process";
import { config } from "./config";

type OpenInVsCodeActionProps = { path: string, onOpen: (target: string) => void };
type OpenProjectFolderActionProps = { directory: string, folder: string };
type ToggleFavoriteActionProps = { isFavorited: boolean, onToggle: () => unknown };

export function OpenInVsCodeAction(props: OpenInVsCodeActionProps): JSX.Element {
  return (
    <OpenAction
      title="Open in Visual Studio Code"
      target={props.path}
      icon={{ source: { light: "icon-light.png", dark: "icon-dark.png" } }}
      application="Visual Studio Code"
      onOpen={props.onOpen}
    />
  )
}


export function OpenProjectFolderAction(props: OpenProjectFolderActionProps): JSX.Element {
  const title = `Open Project Folder in Finder`
  const icon = Icon.Finder
  const onAction = () => {
    execSync(`cd '${props.directory}' && open '${props.folder}'`)
    popToRoot();
    closeMainWindow();
  }

  return (
    <ActionPanelItem title={title} icon={icon} onAction={onAction} />
  )
}

export function ToggleFavoriteAction(props: ToggleFavoriteActionProps): JSX.Element {
  const title = props.isFavorited
    ? 'Remove from Favorites'
    : 'Mark as Favorite';
  const icon = config.FAVORITE_ICON;
  const shortcut: KeyboardShortcut = { modifiers: ["cmd", "shift"], key: "f" };

  return <ActionPanelItem
    title={title}
    icon={icon}
    shortcut={shortcut}
    onAction={props.onToggle}
  />
}