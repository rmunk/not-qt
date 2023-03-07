import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class QtProjectsProvider implements vscode.TreeDataProvider<QtProject> {

	private _onDidChangeTreeData: vscode.EventEmitter<QtProject | undefined | void> = new vscode.EventEmitter<QtProject | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<QtProject | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private workspaceRoot: string | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: QtProject): vscode.TreeItem {
		return element;
	}

	getChildren(element?: QtProject): Thenable<QtProject[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No Qt projects in empty workspace');
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(this.getQtProjects(path.dirname(element.projectPath)));
		} else {
			const files = fs.readdirSync(this.workspaceRoot);
			const projectFile = files.find(file => file.endsWith('.pro'));
			if (projectFile) {
				return Promise.resolve(this.getQtProjects(undefined));
			} else {
				vscode.window.showInformationMessage('Workspace is not a Qt project');
				return Promise.resolve([]);
			}
		}

	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	private async getQtProjects(projectPath: string | undefined): Promise<QtProject[]> {
		let projects: QtProject[] = [];

		if (projectPath === undefined) {
			if (this.workspaceRoot === undefined) { return []; }
			const project = this.getProjectFromPath(this.workspaceRoot);
			if (project) {
				projects.push(project);
			}
			return projects;
		}

		const files = fs.readdirSync(projectPath);
		files.forEach(file => {
			if (fs.statSync(path.join(projectPath, file)).isDirectory()) {
				const project = this.getProjectFromPath(path.join(projectPath, file));
				if (project) {
					projects.push(project);
				}
			}
		});
		return projects;
	}

	private getProjectFromPath(projectPath: string): QtProject | null {
		const files = fs.readdirSync(projectPath);
		const projectFile = files.find(file => file.endsWith('.pro'));
		if (projectFile) {

			const name = projectFile.substring(0, projectFile.lastIndexOf('.'));
			const data = fs.readFileSync(path.join(projectPath, projectFile), 'utf-8');
			if (data) {
				const regexTemplate = /TEMPLATE\s*=\s*(\w+)/;
				const match = data.match(regexTemplate);
				if (match) {
					const template = match[1];
					const isRunnable = template === 'app';
					return new QtProject(name, path.join(projectPath, projectFile), isRunnable, template);
				}
			}
		}
		return null;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class QtProject extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly projectPath: string,
		public readonly isRunnable: boolean,
		public readonly template: string,
		public readonly command?: vscode.Command
	) {
		super(label);

		this.tooltip = this.projectPath;
		this.description = this.isRunnable ? 'Runnable' : '';
		this.collapsibleState = template === 'subdirs' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;

		switch (template) {
			case 'app':
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'resources', 'light', 'run.svg'),
					dark: path.join(__filename, '..', '..', 'resources', 'dark', 'run.svg')
				};
				break;
			case 'lib':
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'resources', 'light', 'library.svg'),
					dark: path.join(__filename, '..', '..', 'resources', 'dark', 'library.svg')
				};
				break;
			case 'subdirs':
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
					dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
				};
				break;
			case 'aux':
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'resources', 'light', 'symbol-property.svg'),
					dark: path.join(__filename, '..', '..', 'resources', 'dark', 'symbol-property.svg')
				};
				break;
			default:
				this.iconPath = {
					light: path.join(__filename, '..', '..', 'media', 'file.svg'),
					dark: path.join(__filename, '..', '..', 'media', 'file.svg')
				};
				break;
		}
	}
	contextValue = 'project';
}
