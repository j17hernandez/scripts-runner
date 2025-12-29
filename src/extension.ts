import * as vscode from 'vscode';
import { ScriptsProvider, ScriptItem } from './scriptsProvider';
import { ScriptsManager } from './scriptsManager';

let scriptsProvider: ScriptsProvider;
let scriptsManager: ScriptsManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('Scripts Runner extension is now active!');

    scriptsManager = new ScriptsManager();
    scriptsProvider = new ScriptsProvider(scriptsManager);

    const treeView = vscode.window.createTreeView('scriptsRunnerView', {
        treeDataProvider: scriptsProvider,
        showCollapseAll: true
    });

    context.subscriptions.push(treeView);

    // Run Script Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.runScript', async (item?: ScriptItem) => {
            if (!item) {
                const scripts = scriptsManager.getScripts();
                if (scripts.length === 0) {
                    vscode.window.showWarningMessage('No hay scripts disponibles.');
                    return;
                }
                const selected = await vscode.window.showQuickPick(
                    scripts.map(s => ({ label: s.name, description: s.command, script: s })),
                    { placeHolder: 'Selecciona un script para ejecutar' }
                );
                if (selected) {
                    runScript(selected.script.name, selected.script.command);
                }
            } else {
                runScript(item.script.name, item.script.command);
            }
        })
    );

    // Add Script Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.addScript', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Nombre del script',
                placeHolder: 'ej: build, test, deploy'
            });
            if (!name) { return; }

            const command = await vscode.window.showInputBox({
                prompt: 'Comando a ejecutar',
                placeHolder: 'ej: npm run build'
            });
            if (!command) { return; }

            const description = await vscode.window.showInputBox({
                prompt: 'Descripción (opcional)',
                placeHolder: 'ej: Compila el proyecto'
            });

            try {
                await scriptsManager.addScript({ name, command, description });
                scriptsProvider.refresh();
                vscode.window.showInformationMessage(`Script "${name}" agregado correctamente.`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error al agregar script: ${error}`);
            }
        })
    );

    // Edit Script Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.editScript', async (item: ScriptItem) => {
            if (!item) { return; }

            const name = await vscode.window.showInputBox({
                prompt: 'Nombre del script',
                value: item.script.name
            });
            if (!name) { return; }

            const command = await vscode.window.showInputBox({
                prompt: 'Comando a ejecutar',
                value: item.script.command
            });
            if (!command) { return; }

            const description = await vscode.window.showInputBox({
                prompt: 'Descripción (opcional)',
                value: item.script.description || ''
            });

            try {
                await scriptsManager.updateScript(item.script.name, { name, command, description });
                scriptsProvider.refresh();
                vscode.window.showInformationMessage(`Script "${name}" actualizado correctamente.`);
            } catch (error) {
                vscode.window.showErrorMessage(`Error al actualizar script: ${error}`);
            }
        })
    );

    // Delete Script Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.deleteScript', async (item: ScriptItem) => {
            if (!item) { return; }

            const confirm = await vscode.window.showWarningMessage(
                `¿Estás seguro de eliminar el script "${item.script.name}"?`,
                { modal: true },
                'Eliminar'
            );

            if (confirm === 'Eliminar') {
                try {
                    await scriptsManager.deleteScript(item.script.name);
                    scriptsProvider.refresh();
                    vscode.window.showInformationMessage(`Script "${item.script.name}" eliminado.`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error al eliminar script: ${error}`);
                }
            }
        })
    );

    // Refresh Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.refresh', () => {
            scriptsManager.reload();
            scriptsProvider.refresh();
        })
    );

    // Create .scriptsrc File Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.createScriptsFile', async () => {
            try {
                await scriptsManager.createScriptsFile();
                scriptsProvider.refresh();
                vscode.window.showInformationMessage('Archivo .scriptsrc creado correctamente.');
            } catch (error) {
                vscode.window.showErrorMessage(`Error al crear archivo: ${error}`);
            }
        })
    );

    // Open .scriptsrc File Command
    context.subscriptions.push(
        vscode.commands.registerCommand('scriptsRunner.openScriptsFile', async () => {
            const filePath = scriptsManager.getScriptsFilePath();
            if (filePath) {
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
            } else {
                vscode.window.showWarningMessage('No se encontró el archivo .scriptsrc');
            }
        })
    );

    // Watch for changes in .scriptsrc
    const watcher = vscode.workspace.createFileSystemWatcher('**/.scriptsrc');
    watcher.onDidChange(() => {
        scriptsManager.reload();
        scriptsProvider.refresh();
    });
    watcher.onDidCreate(() => {
        scriptsManager.reload();
        scriptsProvider.refresh();
    });
    watcher.onDidDelete(() => {
        scriptsManager.reload();
        scriptsProvider.refresh();
    });
    context.subscriptions.push(watcher);
}

function runScript(name: string, command: string) {
    const terminal = vscode.window.createTerminal(`Script: ${name}`);
    terminal.show();
    terminal.sendText(command);
}

export function deactivate() {}
