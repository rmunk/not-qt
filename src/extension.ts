// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs';
import * as vscode from 'vscode';
import { QtProject, QtProjectsProvider } from './qtProjects';
// import xml2js from 'xml2js';

// async parseXml(xmlString: string) {
//     return await new Promise((resolve, reject) => xml2js.parseString(xmlString, (err, jsonData) => {
//       if (err) {
//         reject(err);
//       }
//       resolve(jsonData);
//     }));

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const qtProjectsProvider = new QtProjectsProvider(rootPath);
	vscode.window.registerTreeDataProvider('qtProjects', qtProjectsProvider);
	vscode.commands.registerCommand('qtProjects.refreshEntry', () =>
		qtProjectsProvider.refresh()
	);
	vscode.commands.registerCommand('qtProjects.build', (project: QtProject) => vscode.window.showInformationMessage(`Building ${project.label}.`));
	vscode.commands.registerCommand('qtProjects.deploy', (project: QtProject) => vscode.window.showInformationMessage(`Deploying ${project.label}.`));

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "not-qt" is now active!');

	vscode.workspace.findFiles('**/*.pro').then(async (files) => {
		const qtProjects = new Map();
		let qtFolders = new Array();
		let runnableProjects = new Array();
		files.map((file) => {
			let isRunnable = false;
			let path = file.path.substring(0, file.path.lastIndexOf('/'));
			const data = fs.readFileSync(file.path);
			if (data) {
				isRunnable = data.indexOf('TEMPLATE = app') > -1;
			}
			qtProjects.set(path, {
				'name': file.path.substring(file.path.lastIndexOf('/') + 1, file.path.lastIndexOf('.')),
				'path': path,
				'isRunnable': isRunnable
			});
			qtFolders.push(path);
			if (isRunnable) {
				runnableProjects.push(path);
			}
		});
		console.log(qtProjects);
		vscode.commands.executeCommand('setContext', 'ext.qtProjects', qtProjects);
		vscode.commands.executeCommand('setContext', 'ext.qtFolders', qtFolders);
		vscode.commands.executeCommand('setContext', 'ext.runnableProjects', runnableProjects);
	});

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('not-qt.buildProject', (uri: vscode.Uri) => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user

		console.log(uri);
		if (uri) {
			let projectName = uri.path.substring(uri.path.lastIndexOf('/') + 1);
			vscode.window.showInformationMessage('Building ' + projectName);
		}
		else {
			vscode.window.showInformationMessage("No project selected");
		}
	});
	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('not-qt.buildSelectedProject', (uri: vscode.Uri) => {
		vscode.commands.executeCommand('setContext', 'ext.currentProject', uri);
		vscode.commands.executeCommand('not-qt.buildProject', uri);
	});
	context.subscriptions.push(disposable2);

}

// This method is called when your extension is deactivated
export function deactivate() { }

