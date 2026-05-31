const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

let watchers = {};

function activate(context) {
    let disposable = vscode.commands.registerCommand('taskflow.linkFolder', async () => {
        // Ask for task ID
        const taskId = await vscode.window.showInputBox({
            prompt: 'Enter TaskFlow Task ID to link',
            placeHolder: 'e.g. 42'
        });
        if (!taskId) return;

        // Ask for target file count
        const target = await vscode.window.showInputBox({
            prompt: 'How many files = 100% complete?',
            placeHolder: 'e.g. 10',
            value: '10'
        });

        const folderPath = vscode.workspace.rootPath;
        if (!folderPath) {
            vscode.window.showErrorMessage('Open a folder in VSCode first!');
            return;
        }

        const token = await vscode.window.showInputBox({
            prompt: 'Paste your TaskFlow JWT token',
            placeHolder: 'eyJ...'
        });
        if (!token) return;

        // Count current files
        function countFiles(dir) {
            let count = 0;
            try {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
                    if (item.isDirectory()) count += countFiles(path.join(dir, item.name));
                    else count++;
                }
            } catch {}
            return count;
        }

        async function sendProgress(fileCount) {
            const progress = Math.min(100, Math.round((fileCount / parseInt(target || 10)) * 100));
            try {
                await fetch(`http://localhost:8000/api/tasks/${taskId}/progress`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ progress, folder_path: folderPath })
                });
                vscode.window.setStatusBarMessage(`TaskFlow: ${progress}% ✦`, 3000);
            } catch {}
        }

        // Initial sync
        sendProgress(countFiles(folderPath));

        // Watch for file changes
        if (watchers[taskId]) watchers[taskId].dispose();
        const watcher = vscode.workspace.createFileSystemWatcher('**/*');
        watcher.onDidCreate(() => sendProgress(countFiles(folderPath)));
        watcher.onDidDelete(() => sendProgress(countFiles(folderPath)));
        watcher.onDidChange(() => sendProgress(countFiles(folderPath)));
        watchers[taskId] = watcher;
        context.subscriptions.push(watcher);

        vscode.window.showInformationMessage(`✦ TaskFlow: Task #${taskId} linked to this folder!`);
    });

    context.subscriptions.push(disposable);
}

function deactivate() {
    Object.values(watchers).forEach(w => w.dispose());
}

module.exports = { activate, deactivate };