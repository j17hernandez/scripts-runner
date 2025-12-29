import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface Script {
    name: string;
    command: string;
    description?: string;
    category?: string;
    projectPath?: string;
    projectName?: string;
}

export interface ScriptsConfig {
    scripts: Script[];
}

export class ScriptsManager {
    private scripts: Script[] = [];
    private scriptsFilePath: string | undefined;
    private scriptsFiles: Map<string, string> = new Map();

    constructor() {
        this.reload();
    }

    getScriptsFilePath(): string | undefined {
        return this.scriptsFilePath;
    }

    reload(): void {
        this.scripts = [];
        this.scriptsFilePath = undefined;
        this.scriptsFiles.clear();

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return;
        }

        // Buscar archivos .scriptsrc en la raíz de cada workspace folder
        const rootScriptsFiles: Array<{path: string, folderName: string, folderPath: string}> = [];
        for (const folder of workspaceFolders) {
            const filePath = path.join(folder.uri.fsPath, '.scriptsrc');
            if (fs.existsSync(filePath)) {
                rootScriptsFiles.push({
                    path: filePath,
                    folderName: path.basename(folder.uri.fsPath),
                    folderPath: folder.uri.fsPath
                });
            }
        }

        // Si solo hay un archivo .scriptsrc en la raíz, usar el comportamiento simple
        if (rootScriptsFiles.length === 1) {
            const file = rootScriptsFiles[0];
            this.scriptsFilePath = file.path;
            try {
                const content = fs.readFileSync(file.path, 'utf-8');
                const config = this.parseScriptsFile(content);
                this.scripts = config.scripts.map(script => ({
                    ...script,
                    projectPath: file.folderPath,
                    projectName: file.folderName
                }));
                this.scriptsFiles.set(file.folderName, file.path);
            } catch (error) {
                console.error('Error reading .scriptsrc:', error);
                vscode.window.showErrorMessage(`Error al leer .scriptsrc: ${error}`);
            }
            return;
        }

        // Si no hay archivos en la raíz, buscar en subdirectorios
        if (rootScriptsFiles.length === 0) {
            for (const folder of workspaceFolders) {
                this.findScriptsInSubdirectories(folder.uri.fsPath);
            }
        } else {
            // Si hay múltiples archivos en la raíz, cargarlos todos con categorías
            for (const file of rootScriptsFiles) {
                try {
                    const content = fs.readFileSync(file.path, 'utf-8');
                    const config = this.parseScriptsFile(content);
                    const scriptsWithProject = config.scripts.map(script => ({
                        ...script,
                        projectPath: file.folderPath,
                        projectName: file.folderName
                    }));
                    this.scripts.push(...scriptsWithProject);
                    this.scriptsFiles.set(file.folderName, file.path);
                } catch (error) {
                    console.error(`Error reading .scriptsrc in ${file.folderName}:`, error);
                }
            }
        }

        // Establecer el primer archivo encontrado como el principal
        if (this.scriptsFiles.size > 0) {
            this.scriptsFilePath = Array.from(this.scriptsFiles.values())[0];
        }
    }

    private findScriptsInSubdirectories(rootPath: string): void {
        try {
            const entries = fs.readdirSync(rootPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subPath = path.join(rootPath, entry.name);
                    const scriptsFilePath = path.join(subPath, '.scriptsrc');
                    
                    if (fs.existsSync(scriptsFilePath)) {
                        try {
                            const content = fs.readFileSync(scriptsFilePath, 'utf-8');
                            const config = this.parseScriptsFile(content);
                            const projectName = entry.name;
                            
                            const scriptsWithProject = config.scripts.map(script => ({
                                ...script,
                                projectPath: subPath,
                                projectName: projectName
                            }));
                            
                            this.scripts.push(...scriptsWithProject);
                            this.scriptsFiles.set(projectName, scriptsFilePath);
                        } catch (error) {
                            console.error(`Error reading .scriptsrc in ${entry.name}:`, error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error scanning subdirectories:', error);
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
