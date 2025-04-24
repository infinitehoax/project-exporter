import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import mm from 'micromatch';
import { FileData } from './types';

type ExportFormat      = 'Markdown' | 'JSON' | 'Text';
type QuickExportFormat = 'Markdown' | 'Text';

export class ProjectExporter {
    private readonly defaultIgnore: string[] = [
        '**/node_modules/**','**/.yarn/**','**/.npm/**','**/.pnpm-store/**','**/vendor/**',
        '**/*.lock','package-lock.json','yarn.lock','pnpm-lock.yaml','.pnp.*',
        '**/.git/**','**/.svn/**','**/.hg/**',
        '**/dist/**','**/build/**','**/out/**','**/bin/**','**/obj/**','**/target/**',
        '**/.next/**','**/.vite/**','**/.turbo/**','**/.parcel-cache/**','**/.svelte-kit/**',
        '**/.webpack/**','**/.rollup.cache/**','**/.cache-loader/**','**/.cache/**',
        '**/coverage/**','**/.nyc_output/**','**/reports/**',
        '**/.vscode/**','**/.idea/**','**/.history/**','**/*.swp','**/*~',
        '**/.venv/**','**/env/**','**/venv/**','**/__pycache__/**',
        '**/*.py[cod]','**/*.pyo','**/*.egg-info/**',
        '**/*.dll','**/*.exe','**/*.pdb',
        '**/*.log','**/*.map','**/*.min.js','**/*.min.css',
        '**/.DS_Store','**/Thumbs.db','**/Icon\r'
    ];

    private readonly binaryExt: string[] = [
        '.jpg','.jpeg','.png','.gif','.ico','.pdf','.exe','.dll','.so','.dylib','.bin',
        '.zip','.tar','.gz','.7z','.rar','.woff','.woff2','.ttf','.eot',
        '.mp3','.mp4','.avi','.mov','.sqlite','.db','.dat'
    ];

    private readonly langMap: Record<string,string> = {
        '.js':'javascript','.ts':'typescript','.jsx':'javascript','.tsx':'typescript',
        '.py':'python','.java':'java','.html':'html','.css':'css','.scss':'scss',
        '.json':'json','.md':'markdown','.xml':'xml','.yaml':'yaml','.yml':'yaml',
        '.sh':'shell','.bash':'shell','.php':'php','.rb':'ruby','.go':'go','.rs':'rust',
        '.cpp':'cpp','.c':'c','.cs':'csharp','.vue':'vue','.svelte':'svelte',
        '.sql':'sql','.graphql':'graphql','.proto':'protobuf'
    };

    private readonly maxBytes = 1048576;

    async exportProject(): Promise<void> {
        const wk = vscode.workspace.workspaceFolders?.[0];
        if (!wk) { vscode.window.showErrorMessage('No workspace open'); return; }
        const root = wk.uri.fsPath;

        const fmt = await vscode.window.showQuickPick(['Markdown','JSON','Text']);
        if (!fmt) return;
        const ext = fmt === 'Markdown' ? 'md' : fmt === 'JSON' ? 'json' : 'txt';

        const outUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(path.join(root,`project-export.${ext}`)),
            filters: { [fmt]: [ext] }
        });
        if (!outUri) return;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Exporting project',
            cancellable: true
        }, async (progress, token) => {
            const ignore = [...this.defaultIgnore, ...this.userIgnores()];
            const files = await this.collect(root, ignore, progress, token);
            if (token.isCancellationRequested) return;
            const tree = await this.buildTree(root, ignore);
            await fsPromises.writeFile(outUri.fsPath, this.render(files, tree, fmt as ExportFormat), 'utf8');
            vscode.window.showInformationMessage(`Project exported (${files.length} files)`);
        });
    }

    async quickExport(): Promise<void> {
        const ed = vscode.window.activeTextEditor;
        if (!ed) { vscode.window.showErrorMessage('No active editor'); return; }
        const fmt = await vscode.window.showQuickPick(['Markdown','Text']);
        if (!fmt) return;
        const body = ed.selection.isEmpty ? ed.document.getText() : ed.document.getText(ed.selection);
        const txt = fmt==='Text'
            ? `FILE: ${ed.document.fileName}\n\n${body}`
            : `# Quick Export\n\n## ${ed.document.fileName}\n\n\`\`\`${ed.document.languageId}\n${body}\n\`\`\``;
        await vscode.env.clipboard.writeText(txt);
        vscode.window.showInformationMessage(`Copied ${fmt} to clipboard`);
    }

    private userIgnores() {
        return vscode.workspace.getConfiguration('projectExporter').get<string[]>('customExclusions') ?? [];
    }
    private useEmoji() {
        return vscode.workspace.getConfiguration('projectExporter').get<'emoji'|'ascii'>('structureStyle','emoji') === 'emoji';
    }
    private isBin(fp:string) { const l=fp.toLowerCase(); return this.binaryExt.some(e=>l.endsWith(e)); }
    private skip(rel:string,pats:string[]) { const unix=rel.split(path.sep).join('/'); return mm.isMatch(unix,pats,{dot:true,nocase:true}); }
    private lang(fp:string){ return this.langMap[path.extname(fp).toLowerCase()] ?? ''; }

    private async collect(root:string, ignore:string[], progress:vscode.Progress<{message?:string;increment?:number}>, token:vscode.CancellationToken){
        const list:FileData[]=[]; let total=0,done=0;
        const count=async(d:string):Promise<void>=>{
            const r=path.relative(root,d); if(r&&this.skip(r+'/',ignore))return;
            for(const e of await fsPromises.readdir(d)){ const f=path.join(d,e); const r2=path.relative(root,f); if(this.skip(r2,ignore))continue;
                const s=await fsPromises.stat(f); if(s.isDirectory())await count(f); else total++; }
        };
        await count(root);
        const walk=async(d:string):Promise<void>=>{
            const r=path.relative(root,d); if(r&&this.skip(r+'/',ignore))return;
            for(const e of await fsPromises.readdir(d)){ const f=path.join(d,e); const r2=path.relative(root,f); if(this.skip(r2,ignore))continue;
                const s=await fsPromises.stat(f); done++; progress.report({increment:100/total});
                if(s.isDirectory())await walk(f); else if(s.size<=this.maxBytes&&!this.isBin(f))
                    list.push({path:r2,content:await fsPromises.readFile(f,'utf8'),language:this.lang(f),size:s.size,lastModified:s.mtime}); }
        };
        await walk(root); return list;
    }


    private async buildTree(root: string, ignore: string[]): Promise<string> {
        const lines: string[] = [];
        const useEmoji = this.useEmoji();           // true ⇒ 📁/📄  false ⇒ ascii
    
        const walk = async (dir: string, prefixFlags: boolean[] = []): Promise<void> => {
            const relDir = path.relative(root, dir);
            if (relDir && this.skip(relDir + '/', ignore)) return;
    
            let entries = await fsPromises.readdir(dir);
            entries = entries.filter(e =>
                !this.skip(path.relative(root, path.join(dir, e)), ignore)
            );
            entries.sort((a, b) => {
                const ad = fs.statSync(path.join(dir, a)).isDirectory();
                const bd = fs.statSync(path.join(dir, b)).isDirectory();
                return ad === bd ? a.localeCompare(b) : ad ? -1 : 1;
            });
    
            const lastIdx = entries.length - 1;
    
            for (let i = 0; i < entries.length; i++) {
                const entry  = entries[i];
                const full   = path.join(dir, entry);
                const rel    = path.relative(root, full);
                const isLast = i === lastIdx;
                const stat   = await fsPromises.stat(full);
    
                /* build the left-hand padding */
                const pad = prefixFlags
                    .map(flag => (flag ? '    ' : (useEmoji ? '  ' : '│   ')))
                    .join('');
    
                const branch = useEmoji ? '' : (isLast ? '└── ' : '├── ');
    
                if (stat.isDirectory()) {
                    lines.push(
                        pad +
                        branch +
                        (useEmoji ? '📁 ' : '') +
                        entry
                    );
                    await walk(full, [...prefixFlags, isLast]);
                } else if (!this.isBin(full)) {
                    lines.push(
                        pad +
                        branch +
                        (useEmoji ? '📄 ' : '') +
                        entry
                    );
                }
            }
        };
    
        await walk(root);
        return lines.join('\n');
    }
    


    private render(files:FileData[], tree:string, fmt:ExportFormat){
        if(fmt==='JSON') return JSON.stringify({exportedAt:new Date().toISOString(),structure:tree,files:files.map(f=>({...f,lastModified:f.lastModified.toISOString()}))},null,2);
        if(fmt==='Text') return ['PROJECT EXPORT','','STRUCTURE','',tree,'','FILES','',...files.flatMap(f=>[`=== ${f.path} ===`,'',f.content,'','='.repeat(40),''])].join('\n');
        const md:string[]=['# Project Export','','## Structure','','```',tree,'```','','## Files','']; for(const f of files){ md.push(`### ${f.path}`,`Last modified: ${f.lastModified.toISOString()}`,`Size: ${(f.size/1024).toFixed(2)} KB`,'','```'+(f.language||''),f.content,'```',''); } return md.join('\n');
    }
}
