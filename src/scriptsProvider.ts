import * as vscode from 'vscode';
import { Script, ScriptsManager } from './scriptsManager';

export class ScriptItem extends vscode.TreeItem {
    constructor(
        public readonly script: Script,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(script.name, collapsibleState);
        
        this.tooltip = script.description || script.command;
        this.description = script.command;
        this.contextValue = 'script';
        
        this.iconPath = new vscode.ThemeIcon('terminal');
        
        this.command = {
            command: 'scriptsRunner.runScript',
            title: 'Run Script',
            arguments: [this]
        };
    }
}

export class CategoryItem extends vscode.TreeItem {
    constructor(
        public readonly categoryName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(categoryName, collapsibleState);
        
        this.contextValue = 'category';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

export class ScriptsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = 
        new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    constructor(private scriptsManager: ScriptsManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
        if (!element) {
            return this.getRootElements();
        }
        
        if (element instanceof CategoryItem) {
            return this.getScriptsForCategory(element.categoryName);
        }
        
        return Promise.resolve([]);
    }

    private async getRootElements(): Promise<vscode.TreeItem[]> {
        const categories = this.scriptsManager.getScriptsByCategory();
        
        if (categories.size === 0) {
            return [];
        }
        
        if (categories.size === 1 && categories.has('General')) {
            const scripts = categories.get('General')!;
            return scripts.map(script => 
                new ScriptItem(script, vscode.TreeItemCollapsibleState.None)
            );
        }
        
        const items: vscode.TreeItem[] = [];
        for (const [categoryName] of categories) {
            items.push(new CategoryItem(
                categoryName,
                vscode.TreeItemCollapsibleState.Expanded
            ));
        }
        
        return items;
    }

    private async getScriptsForCategory(categoryName: string): Promise<vscode.TreeItem[]> {
        const categories = this.scriptsManager.getScriptsByCategory();
        const scripts = categories.get(categoryName) || [];
        
        return scripts.map(script => 
            new ScriptItem(script, vscode.TreeItemCollapsibleState.None)
        );
    }
}
