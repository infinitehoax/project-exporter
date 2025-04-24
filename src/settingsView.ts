import * as vscode from 'vscode';

export class SettingsViewProvider implements vscode.WebviewViewProvider {
    constructor(private readonly extUri: vscode.Uri) {}

    resolveWebviewView(view: vscode.WebviewView) {
        view.webview.options = { enableScripts: true };
        view.webview.html = this.html(view.webview);

        view.webview.onDidReceiveMessage(async msg => {
            if (msg.command === 'openSettings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'projectExporter.');
            }
        });
    }

    private html(webview: vscode.Webview): string {
        const nonce = Date.now().toString();
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<style>
body{font:13px var(--vscode-font-family);padding:10px}
button{padding:4px 12px;cursor:pointer}
</style>
</head>
<body>
<h3>Project Exporter</h3>
<button id="btn">Open Extension Settings</button>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();
document.getElementById('btn').addEventListener('click',()=>vscode.postMessage({command:'openSettings'}));
</script>
</body>
</html>`;
    }
}
