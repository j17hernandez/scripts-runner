import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Script {
    name: string;
    command: string;
    description?: string;
    category?: string;
}

export interface ScriptsConfig {
    scripts: Script[];
}

export class ScriptsManager {
    private scripts: Script[] = [];
    private scriptsFilePath: string | undefined;

    constructor() {
        this.reload();
    }

    getScriptsFilePath(): string | undefined {
        return this.scriptsFilePath;
    }

    reload(): void {
        this.scripts = [];
        this.scriptsFilePath = undefined;

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        for (const folder of workspaceFolders) {
            const filePath = path.join(folder.uri.fsPath, '.scriptsrc');
            if (fs.existsSync(filePath)) {
                this.scriptsFilePath = filePath;
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const config = this.parseScriptsFile(content);
                    this.scripts = config.scripts;
                } catch (error) {
                    console.error('Error reading .scriptsrc:', error);
                    vscode.window.showErrorMessage(`Error al leer .scriptsrc: ${error}`);
                }
                break;
            }
        }
    }

    private parseScriptsFile(content: string): ScriptsConfig {
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                return { scripts: parsed };
            }
            if (parsed.scripts && Array.isArray(parsed.scripts)) {
                return parsed;
            }
            return { scripts: [] };
        } catch {
            return { scripts: [] };
        }
    }

    getScripts(): Script[] {
        return this.scripts;
    }

    getScriptsByCategory(): Map<string, Script[]> {
        const categories = new Map<string, Script[]>();
        
        for (const script of this.scripts) {
            const category = script.category || 'General';
            if (!categories.has(category)) {
                categories.set(category, []);
            }
            categories.get(category)!.push(script);
        }
        
        return categories;
    }

    async addScript(script: Script): Promise<void> {
        if (this.scripts.some(s => s.name === script.name)) {
            throw new Error(`Ya existe un script con el nombre "${script.name}"`);
        }
        
        this.scripts.push(script);
        await this.saveScripts();
    }

    async updateScript(oldName: string, script: Script): Promise<void> {
        const index = this.scripts.findIndex(s => s.name === oldName);
        if (index === -1) {
            throw new Error(`No se encontró el script "${oldName}"`);
        }
        
        if (oldName !== script.name && this.scripts.some(s => s.name === script.name)) {
            throw new Error(`Ya existe un script con el nombre "${script.name}"`);
        }
        
        this.scripts[index] = script;
        await this.saveScripts();
    }

    async deleteScript(name: string): Promise<void> {
        const index = this.scripts.findIndex(s => s.name === name);
        if (index === -1) {
            throw new Error(`No se encontró el script "${name}"`);
        }
        
        this.scripts.splice(index, 1);
        await this.saveScripts();
    }

    private async saveScripts(): Promise<void> {
        if (!this.scriptsFilePath) {
            throw new Error('No hay archivo .scriptsrc');
        }

        const config: ScriptsConfig = { scripts: this.scripts };
        const content = JSON.stringify(config, null, 2);
        
        fs.writeFileSync(this.scriptsFilePath, content, 'utf-8');
    }

    async createScriptsFile(): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No hay workspace abierto');
        }

        const filePath = path.join(workspaceFolders[0].uri.fsPath, '.scriptsrc');
        
        if (fs.existsSync(filePath)) {
            throw new Error('El archivo .scriptsrc ya existe');
        }

        const defaultConfig: ScriptsConfig = {
            scripts: [
                {
                    name: "ejemplo",
                    command: "echo 'Hola Mundo'",
                    description: "Script de ejemplo"
                }
            ]
        };

        fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
        this.scriptsFilePath = filePath;
        this.reload();
    }
}
