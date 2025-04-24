import * as vscode from 'vscode';
import { ProjectExporter } from './projectExporter';
import { SettingsViewProvider } from './settingsView';

export function activate(ctx: vscode.ExtensionContext): void {
    const exporter = new ProjectExporter();

    ctx.subscriptions.push(
        vscode.commands.registerCommand('projectExporter.exportProject', () => exporter.exportProject()),
        vscode.commands.registerCommand('projectExporter.quickExport',  () => exporter.quickExport()),
        vscode.commands.registerCommand('projectExporter.addCustomExclusion', addPattern),
        vscode.commands.registerCommand('projectExporter.openSettings', () =>
            vscode.commands.executeCommand('workbench.view.extension.projectExporter'))
    );

    ctx.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'projectExporter.settingsView',
            new SettingsViewProvider(ctx.extensionUri)
        )
    );
}

export function deactivate() {}

async function addPattern() {
    const pat = await vscode.window.showInputBox({ prompt: 'Glob pattern to ignore' });
    if (!pat) return;
    const cfg = vscode.workspace.getConfiguration('projectExporter');
    const list = cfg.get<string[]>('customExclusions') ?? [];
    if (list.includes(pat)) {
        vscode.window.showInformationMessage('Pattern already exists.');
        return;
    }
    await cfg.update('customExclusions', [...list, pat], vscode.ConfigurationTarget.Workspace);
}
