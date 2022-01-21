import { popToRoot, Toast, ToastStyle, clearSearchBar } from "@raycast/api";
import { getFromStorage, saveToStorage } from "./config";

export default async function Command() {
  const toast = new Toast({
    style: ToastStyle.Success,
    title: "Force Refresh Workspaces",
    message: "Force refresh will happen on next workspace list load!"
  })

  await getFromStorage().then((data) => {
    const newData = { ...data, savedAt: undefined };

    saveToStorage(newData);
    popToRoot();
    clearSearchBar();
  });

  toast.show();

  return null;
}