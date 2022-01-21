import { exec, ExecException } from "child_process";
import { readFileSync } from "fs";
import { dropRight, last, sortBy } from "lodash";
import getUuid from 'uuid-by-string'
import { config } from "./config";
import { isValidJSON } from "./helpers";
import { Workspace } from "./types";

type WorkspaceCodeFileFolder = { path: string, name?: string };
type WorkspaceCodeFile = { folders: WorkspaceCodeFileFolder[], settings?: [], extensions?: { recommendations?: string[] } };
type SearchResolve = (rows: Workspace[]) => unknown
type SearchReject = (payload: { error: ExecException | null, stderr: string }) => unknown

const script = `mdfind 'kMDItemFSName=*${config.FILE_EXT}' -onlyin ~ | grep -vE '${config.SKIP_DIR}'`;

export const searchWorkspaces = () => new Promise((resolve: SearchResolve, reject: SearchReject) => {
  exec(script, (error, stdout, stderr) => {
    if (stderr) return reject({ error, stderr })

    return resolve(sortBy(
      stdout.split("\n").filter(str => str.length).map(handleFile),
      'title'
    ))
  })
})

const handleFile = (path: string) => {
  const file = readFileSync(path, { encoding: 'utf-8' });
  const fileData: WorkspaceCodeFile = file && isValidJSON(file) ? JSON.parse(file) : { folders: [] };
  const splittedPath: string[] = path.split('/');
  const filename = last(splittedPath);

  return {
    id: getUuid(path),
    title: filename ? filename.replace(`${config.FILE_EXT}`, '') : '',
    path,
    directory: dropRight(splittedPath).join('/'),
    folders: fileData.folders.map((f) => f.path)
  }
}