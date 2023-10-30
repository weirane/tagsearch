import * as vscode from "vscode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  let disposable = vscode.commands.registerCommand("tagsearch.Search", () => {
    // TODO: perform search here
    vscode.window.showInformationMessage("Hello World from tagsearch!");
  });
  context.subscriptions.push(disposable);

  const dataProvider = new TagSearchViewData(rootPath);
  vscode.window.registerTreeDataProvider("tagsearch-results", dataProvider);
}

interface Function {
  kind: "func";
  signature: string;
  tags: string[];
  // need location info (for click to jump)
}
interface File {
  kind: "file";
  path: string;
  funcs: Function[];
}
type Result = Function | File;

class TagSearchViewData implements vscode.TreeDataProvider<Result> {
  constructor(rootPath?: string) {}

  getTreeItem(element: Result): TreeItem {
    if (element.kind === "file") {
      const ti = new TreeItem("file " + element.path, TreeItemCollapsibleState.Expanded);
      // TODO: prettier output. icons?
      ti.contextValue = "file";
      return ti;
    } else {
      const ti = new TreeItem("function " + element.signature);
      // TODO: prettier output. display the matched tag
      return ti;
    }
  }

  getChildren(element?: Result): Thenable<Result[]> {
    if (element === undefined) {
      // entered the extension for the first time.
      // perform search on all files and return a list of files with functions
      // can search in promise to be async. need to save results?
      const sample: File = {
        kind: "file",
        path: "path/to/file.py",
        funcs: [
          {
            kind: "func",
            signature: "def asmatrix()",
            tags: ["conversion", "matrix"],
          },
        ],
      };
      return Promise.resolve([sample]);
    } else if (element.kind === "file") {
      // search within file (again)?
      return Promise.resolve(element.funcs);
    } else {
      // got to functions. should be unreachable
      return Promise.resolve([]);
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
