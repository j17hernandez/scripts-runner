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
        public readonly projectName?: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
    ) {
        super(categoryName, collapsibleState);
        
        this.contextValue = 'category';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

export class ProjectItem extends vscode.TreeItem {
    constructor(
        public readonly projectName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Expanded
    ) {
        super(projectName, collapsibleState);
        
        this.contextValue = 'project';
        this.iconPath = new vscode.ThemeIcon('folder-opened');
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
        
        if (element instanceof ProjectItem) {
            return this.getCategoriesForProject(element.projectName);
        }
        
        if (element instanceof CategoryItem) {
            return this.getScriptsForCategory(element.categoryName, element.projectName);
        }
        
        return Promise.resolve([]);
    }

    private async getRootElements(): Promise<vscode.TreeItem[]> {
        const scripts = this.scriptsManager.getScripts();
        
        if (scripts.length === 0) {
            return [];
        }
        
        // Obtener proyectos únicos
        const projects = new Set(scripts.map(s => s.projectName).filter(p => p));
        
        // Si solo hay un proyecto, mostrar directamente las categorías
        if (projects.size === 1) {
            const projectName = Array.from(projects)[0]!;
            const projectScripts = scripts.filter(s => s.projectName === projectName);
            
            // Agrupar por categoría
            const categories = new Map<string, Script[]>();
            for (const script of projectScripts) {
                const category = script.category || 'General';
                if (!categories.has(category)) {
                    categories.set(category, []);
                }
                categories.get(category)!.push(script);
            }
            
            // Si solo hay una categoría "General", mostrar scripts directamente
            if (categories.size === 1 && categories.has('General')) {
                return categories.get('General')!.map(script => 
                    new ScriptItem(script, vscode.TreeItemCollapsibleState.None)
                );
            }
            
            // Mostrar categorías
            const items: vscode.TreeItem[] = [];
            for (const [categoryName] of categories) {
                items.push(new CategoryItem(categoryName, projectName));
            }
            return items;
        }
        
        // Si hay múltiples proyectos, mostrar proyectos en el nivel raíz
        const items: vscode.TreeItem[] = [];
        for (const projectName of Array.from(projects)) {
            if (projectName) {
                items.push(new ProjectItem(projectName));
            }
        }
        
        return items;
    }

    private async getCategoriesForProject(projectName: string): Promise<vscode.TreeItem[]> {
        const scripts = this.scriptsManager.getScripts();
        const projectScripts = scripts.filter(s => s.projectName === projectName);
        
        // Agrupar por categoría
        const categories = new Map<string, Script[]>();
        for (const script of projectScripts) {
            const category = script.category || 'General';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(script);
        }
        
        // Si solo hay una categoría "General", mostrar scripts directamente
        if (categories.size === 1 && categories.has('General')) {
            return categories.get('General')!.map(script => 
                new ScriptItem(script, vscode.TreeItemCollapsibleState.None)
            );
        }
        
        // Mostrar categorías
        const items: vscode.TreeItem[] = [];
        for (const [categoryName] of categories) {
            items.push(new CategoryItem(categoryName, projectName));
        }
        
        return items;
    }
    
    private async getScriptsForCategory(categoryName: string, projectName?: string): Promise<vscode.TreeItem[]> {
        const scripts = this.scriptsManager.getScripts();
        let filteredScripts = scripts;
        
        if (projectName) {
            filteredScripts = scripts.filter(s => s.projectName === projectName);
        }
        
        const categoryScripts = filteredScripts.filter(s => {
            const category = s.category || 'General';
            return category === categoryName;
        });
        
        return categoryScripts.map(script => 
            new ScriptItem(script, vscode.TreeItemCollapsibleState.None)
        );
    }
}
