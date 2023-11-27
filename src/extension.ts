/* eslint-disable @typescript-eslint/naming-convention */
// import { File } from "buffer";
import * as vscode from "vscode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";

let globalContext: null | vscode.ExtensionContext = null;
let searchResult: null | { list_of_files: File[] } = null;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  globalContext = context;
  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  let disposable = vscode.commands.registerCommand("tagsearch.Search", async () => {
    const result = await vscode.window.showInputBox({
      title: "TagSearch",
      placeHolder: "tags you want to search",
    });
    if (result === undefined) {
      return;
    }
    // perform search here
    const searchtags = result.split(/\s+/);
    const data = getData(context);
    for (const file of data.list_of_files) {
      file.funcs = file.funcs.filter((func) => func.tags.some((t) => searchtags.includes(t)));
    }
    data.list_of_files = data.list_of_files.filter((f) => f.funcs.length > 0);
    console.log(data);
    searchResult = data;
    vscode.commands.executeCommand("workbench.view.extension.tagsearch");
  });
  context.subscriptions.push(disposable);

  vscode.commands.executeCommand("setContext", "tagsearchExtensionActive", true);
  // TODO: hard coded data
  gendata(context);

  //code for assigning tags to a method
  let tagDisposable = vscode.commands.registerCommand("tagsearch.OpenPopup", async () => {
    const panel = vscode.window.createWebviewPanel(
      "tagsearchPopup",
      "Assign Method Tags",
      vscode.ViewColumn.One, // Editor column to show the new webview panel
      {
        enableScripts: true,
      }
    );

    panel.webview.html = getWebviewContent();
    panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "assignTags":
            // Handle the received data and assign tags
            const { methodName, tags } = message.data;
            assignTagsToMethod(methodName, tags);
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(tagDisposable);

  // vscode.commands.executeCommand("tagsearch.OpenPopup");

  function assignTagsToMethod(methodName: string, tags: string[]) {
    const savedData = context.globalState.get("json_data", '{"list_of_files": []}');
    const data = JSON.parse(savedData);

    // Find the file index and the method index
    const fileIndex = data.list_of_files.findIndex((file: File) => {
      return file.funcs.some((func: Function) => func.name === methodName);
    });

    if (fileIndex !== -1) {
      const methodIndex = data.list_of_files[fileIndex].funcs.findIndex(
        (func: Function) => func.name === methodName
      );

      if (methodIndex !== -1) {
        // Update the tags of the method
        data.list_of_files[fileIndex].funcs[methodIndex].tags = tags;

        const jsonData = { list_of_files: [] };
        context.globalState.update("json_data", JSON.stringify(jsonData));

        vscode.window.showInformationMessage(`Tags assigned to ${methodName}: ${tags.join(", ")}`);
      } else {
        vscode.window.showErrorMessage(`Method with name '${methodName}' not found.`);
      }
    } else {
      vscode.window.showErrorMessage(`File containing method '${methodName}' not found.`);
    }
    console.log("assignTagsToMethod triggered");
  }

  const dataProvider = new TagSearchViewData(rootPath);
  vscode.window.registerTreeDataProvider("tagsearch-results", dataProvider);

  function doesFileExist(json: any, file_name: string): boolean {
    return json.list_of_files.some((item: any) => item.path === file_name);
  }

  // This blcok shows checking if a file exists

  // console.log("doesfileexist")
  // console.log(doesFileExist({"list_of_files": [{'file_path': "test.py"}]}, "test.py"))
  // console.log("doesfileexist")

  // Function to add the name if it doesn't exist
  function addFileIfNotExists(main_json: any, file: File): void {
    if (!doesFileExist(main_json, file.path)) {
      main_json.list_of_files.push(file);
      console.log(`Added "${file.path}" to the list.`);
    } else {
      console.log(`"${file.path}" already exists in the list.`);
    }
  }

  const sample: File = {
    kind: "file",
    path: "path/to/file.py",
    funcs: [
      {
        kind: "func",
        name: "name",
        signature: "def asmatrix()",
        tags: ["conversion", "matrix"],
        returns: ["return_var"],
        description: "fake description",
        file_path: "path/to/file.py:L12-24",
      },
    ],
  };

  const sample2: File = {
    kind: "file",
    path: "path/to/file2.py",
    funcs: [
      {
        kind: "func",
        name: "name",
        signature: "def asmatrix()",
        tags: ["conversion", "matrix"],
        returns: ["return_var"],
        description: "fake description",
        file_path: "path/to/file.py:L12-24",
      },
    ],
  };
  // const example_json = {"list_of_files": [sample]}
  // addFileIfNotExists(example_json, sample2)
  // console.log(JSON.stringify(example_json))

  // console.log(" ")

  // function combineFileFuncs(data_json: any, newFile: File): any {
  //   if (!data_json.list_of_files || !Array.isArray(data_json.list_of_files)) {
  //       console.error("Invalid data_json format. It should have a list_of_files property.");
  //       return data_json;
  //   }

  //   const existingFileIndex = data_json.list_of_files.findIndex((file: File) => file.path === newFile.path);

  //   if (existingFileIndex !== -1) {
  //       const existingFile = data_json.list_of_files[existingFileIndex];
  //       const combinedFuncs = [...existingFile.funcs];

  //       newFile.funcs.forEach((newFunc: any) => {
  //           if (!combinedFuncs.some((existingFunc: { name: string }) => existingFunc.name === newFunc.name)) {
  //               console.log(newFunc.name)
  //               combinedFuncs.push({ name: newFunc.name });
  //           }
  //       });

  //       data_json.list_of_files[existingFileIndex] = {
  //           path: existingFile.path,
  //           funcs: combinedFuncs,
  //       };
  //   } else {
  //       data_json.list_of_files.push(newFile);
  //   }
  //   return data_json;
  // }

  function combineFileFuncs(data_json: any, newFile: File): any {
    if (!data_json.list_of_files || !Array.isArray(data_json.list_of_files)) {
      console.error("Invalid data_json format. It should have a list_of_files property.");
      return data_json;
    }

    const existingFileIndex = data_json.list_of_files.findIndex(
      (file: File) => file.path === newFile.path
    );

    if (existingFileIndex !== -1) {
      const existingFile = data_json.list_of_files[existingFileIndex];

      newFile.funcs.forEach((newFunc: Function) => {
        const existingFuncIndex = existingFile.funcs.findIndex(
          (existingFunc: Function) => existingFunc.name === newFunc.name
        );

        if (existingFuncIndex === -1) {
          existingFile.funcs.push(newFunc);
        } else {
          // Merge additional properties of 'func' if needed
          // In this example, assuming 'func' objects have no additional properties
          console.log(`Func with name '${newFunc.name}' already exists in the file.`);
        }
      });

      data_json.list_of_files[existingFileIndex] = {
        path: existingFile.path,
        funcs: existingFile.funcs,
      };
    } else {
      data_json.list_of_files.push(newFile);
    }

    return data_json;
  }

  function appendNewFunction(
    func_name: string,
    func_tags: string[],
    func_sig: string,
    func_returns: string[],
    func_description: string,
    func_file_path: string
  ) {
    let json_string_data = context.globalState.get("json_string_data", "{'list_of_files': []}");
    const function_to_append: Function = {
      kind: "func",
      name: func_name,
      tags: func_tags,
      signature: func_sig,
      returns: func_returns,
      description: func_description,
      file_path: func_file_path,
    };
  }

  // let json_data = JSON.parse(json_string_data)

  //     const function_to_append: Function = {
  //       kind: "func",
  //       name: func_name,
  //       tags: ["TAG1", "TAG2", "TAG3"],
  //       signature: "",
  //       returns: ["return1", "return2"],
  //       description: "DESCRIPTION",
  //       file_path: "FILE_PATH"
  //     };

  //     json_data.list_of_saved_functions.push(function_to_append);

  //     context.globalState.update("json_data", json_data);

  return context;
}

interface Function {
  kind: "func";
  name: string;
  signature: string;
  tags: string[];
  returns: string[];
  description: string;
  file_path: string;
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
      const ti = new TreeItem(element.path, TreeItemCollapsibleState.Expanded);
      ti.contextValue = "file";
      ti.iconPath = new vscode.ThemeIcon("file-code");
      return ti;
    } else {
      const ti = new TreeItem(element.signature, TreeItemCollapsibleState.None);
      ti.contextValue = "function";
      ti.iconPath = new vscode.ThemeIcon("symbol-function");
      ti.tooltip = element.description;
      return ti;
    }
  }

  getChildren(element?: Result): Thenable<Result[]> {
    if (element === undefined) {
      // entered the extension for the first time.
      // perform search on all files and return a list of files with functions
      // can search in promise to be async. need to save results?
      return Promise.resolve(searchResult === null ? [] : searchResult.list_of_files);
    } else if (element.kind === "file") {
      // search within file (again)?
      return Promise.resolve(element.funcs);
    } else {
      // got to functions. should be unreachable
      return Promise.resolve([]);
    }
  }
}

function deleteData(context: vscode.ExtensionContext) {
  context.globalState.update("json_data", "{'list_of_files': []}");
}

function updateData(context: vscode.ExtensionContext, newdata: { list_of_files: File[] }) {
  context.globalState.update("json_data", JSON.stringify(newdata));
}

function getData(context: vscode.ExtensionContext): { list_of_files: File[] } {
  let json_data = context.globalState.get("json_data", "{'list_of_files': []}");
  return JSON.parse(json_data);
}

function getWebviewContent() {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Assign Method Tags</title>
      </head>
      <body>
        <h1>Assign Tags to Method</h1>
        <form id="tagForm">
          <label for="methodName">Method Name:</label>
          <input type="text" id="methodName" name="methodName">
          <br><br>
          <label for="tags">Enter Tags (comma-separated):</label>
          <input type="text" id="tags" name="tags">
          <br><br>
          <button type="button" onclick="assignTags()">Assign Tags</button>
        </form>
  
        <script>
          const vscode = acquireVsCodeApi();
  
          document.getElementById('methodName').value = vscode.window.activeTextEditor?.document.getText(vscode.window.activeTextEditor.selection);
  
          function assignTags() {
            const methodName = document.getElementById('methodName').value;
            const tags = document.getElementById('tags').value.split(',').map(tag => tag.trim());
            
            vscode.postMessage({
              command: 'assignTags',
              data: { methodName, tags }
            });
          }
        </script>
      </body>
      </html>
    `;
}

// This method is called when your extension is deactivated
export function deactivate() {}

function gendata(context: vscode.ExtensionContext) {
  const linAlg: File = {
    kind: "file",
    path: "numpy/linalg/_linalg.py",
    funcs: [
      {
        kind: "func",
        name: "isComplexType",
        signature: "def isComplexType(t)",
        tags: ["type", "complex", "check"],
        returns: ["boolean"],
        description: "checks if the value is of a complex form",
        file_path: "numpy/linalg/_linalg.py:L122",
      },

      {
        kind: "func",
        name: "matrix_power",
        signature: "def matrix_power(a)",
        tags: ["exponent", "matrix", "square"],
        returns: ["matrix"],
        description: "Raise a square matrix to the (integer) power `n`.",
        file_path: "numpy/linalg/_linalg.py:L602",
      },

      {
        kind: "func",
        name: "eig",
        signature: "def eig(a)",
        tags: ["eigenvalue", "matrix"],
        returns: ["tuple", "array"],
        description: "Compute the eigenvalues and right eigenvectors of a square array.",
        file_path: "numpy/linalg/_linalg.py:L1232",
      },

      {
        kind: "func",
        name: "transpose",
        signature: "def transpose(a)",
        tags: ["conversion", "matrix"],
        returns: ["ndarray"],
        description: "Transpose each matrix in a stack of matrices.",
        file_path: "numpy/linalg/_linalg.py:L208",
      },
    ],
  };

  const poly: File = {
    kind: "file",
    path: "numpy/polynomial/polynomial.py",
    funcs: [
      {
        kind: "func",
        name: "polydiv",
        signature: "def polydiv(c1, c2)",
        tags: ["polynomial", "divide"],
        returns: ["polynomial"],
        description: "Divide one polynomial by another.",
        file_path: "numpy/polynomial/polynomial.py:L366",
      },
      {
        kind: "func",
        name: "polypow",
        signature: "def polypow(c, pow, maxpower)",
        tags: ["polynomial", "power", "exponent"],
        returns: ["polynomial"],
        description: "Raise a polynomial to a power..",
        file_path: "numpy/polynomial/polynomial.py:L424",
      },
      {
        kind: "func",
        name: "polyline",
        signature: "def polyline(off, sc1)",
        tags: ["polynomial", "array", "linear"],
        returns: ["array"],
        description: "Returns an array representing a linear polynomial.",
        file_path: "numpy/polynomial/polynomial.py:L113",
      },
      {
        kind: "func",
        name: "polyadd",
        signature: "def polyadd(c1, c2)",
        tags: ["polynomial", "add"],
        returns: ["polynomial"],
        description: "Add one polynomial by another.",
        file_path: "numpy/polynomial/polynomial.py:L215",
      },
      {
        kind: "func",
        name: "polymul",
        signature: "def polymul(c1, c2)",
        tags: ["polynomial", "multiply"],
        returns: ["polynomial"],
        description: "Multiply one polynomial by another.",
        file_path: "numpy/polynomial/polynomial.py:L328",
      },
    ],
  };

  const matrixlib: File = {
    kind: "file",
    path: "numpy/matrixlib/defmatrix.py",
    funcs: [
      {
        kind: "func",
        name: "asmatrix",
        signature: "def asmatrix(data, dtype)",
        tags: ["matrix", "convert", "generic"],
        returns: ["matrix"],
        description: "Interpret the input as a matrix.",
        file_path: "numpy/matrixlib/defmatrix.py:L38",
      },
      {
        kind: "func",
        name: "tolist",
        signature: "def tolist(self)",
        tags: ["matrix", "convert", "list"],
        returns: ["list"],
        description: "Return the matrix as a (possibly nested) list.",
        file_path: "numpy/matrixlib/defmatrix.py:L266",
      },
      {
        kind: "func",
        name: "sum",
        signature: "def sum(self, axis, dtype, out)",
        tags: ["matrix", "sum", "axis"],
        returns: ["ndarray"],
        description: "Returns the sum of the matrix elements, along the given axis.",
        file_path: "numpy/matrixlib/defmatrix.py:L291",
      },
      {
        kind: "func",
        name: "max",
        signature: "def max(self, axis, out)",
        tags: ["matrix", "max", "axis"],
        returns: ["ndarray"],
        description: "Return the maximum value along an axis.",
        file_path: "numpy/matrixlib/defmatrix.py:L613",
      },
    ],
  };

  const data = { list_of_files: [linAlg, poly, matrixlib] };
  updateData(context, data);
}
