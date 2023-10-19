import { abort } from "process";
import * as vscode from "vscode";

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

class TagSearchView {
  constructor() {
    // this.treeView = vscode.window.createTreeView("yourViewId", {
    //   treeDataProvider: new TagSearchViewData(),
    // });
  }
}

class Result implements vscode.TreeItem {}

class TagSearchViewData implements vscode.TreeDataProvider<Result> {
  constructor(rootPath?: string) {}

  getTreeItem(element: Result): Result {
    abort();
    // Return a tree item representing the element
  }

  getChildren(element: Result): Result[] {
    // Return an array of child elements
    return [];
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
