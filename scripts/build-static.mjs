import { cp, mkdir, readdir, rm, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'dist');
const files=['index.html','styles.css','core.js','ui.js','community-media.js','operations.js','app.js','data.js','business.js','business-ui.js'];
// Lista fechada: documentação, testes, .git e arquivos locais não são publicados.
async function copyAssets(source,destination) {
  await mkdir(destination,{recursive:true});
  for (const entry of await readdir(source,{withFileTypes:true})) {
    if (entry.name.startsWith('.')) continue;
    const src=path.join(source,entry.name),dest=path.join(destination,entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Link simbólico não permitido nos assets: ${entry.name}`);
    if (entry.isDirectory()) await copyAssets(src,dest);
    else if (/\.(png|webp|svg|ttf|txt)$/i.test(entry.name) && !entry.name.startsWith('.')) await cp(src,dest);
    else throw new Error(`Asset não previsto: ${entry.name}`);
  }
}
await rm(output,{recursive:true,force:true});
await mkdir(output);
for(const file of files) {
  if ((await lstat(path.join(root,file))).isSymbolicLink()) throw new Error(`Link simbólico não permitido: ${file}`);
  await cp(path.join(root,file),path.join(output,file));
}
await copyAssets(path.join(root,'assets'),path.join(output,'assets'));
console.log('Site estático preparado em dist/. Documentação e testes não foram incluídos.');
