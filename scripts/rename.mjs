// Script de refactor temporal: renombra símbolos de código a inglés usando
// el compilador de TypeScript (ts-morph), no texto — así no toca strings de
// UI ni comentarios en español. Se borra al terminar el refactor.
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

function renameSymbol(kind, name, newName) {
  for (const sourceFile of project.getSourceFiles('src/**/*.{ts,tsx}')) {
    let node;
    if (kind === 'interface') node = sourceFile.getInterface(name);
    else if (kind === 'typeAlias') node = sourceFile.getTypeAlias(name);
    else if (kind === 'function') node = sourceFile.getFunction(name);
    else if (kind === 'variable') node = sourceFile.getVariableDeclaration(name);
    if (node) {
      console.log(`Renombrando ${kind} ${name} -> ${newName} (${sourceFile.getBaseName()})`);
      node.rename(newName);
      return true;
    }
  }
  console.warn(`NO ENCONTRADO: ${kind} ${name}`);
  return false;
}

// Renombra una propiedad de una interfaz (y todas sus referencias/destructuring).
function renamePropertyOfInterface(interfaceName, propName, newPropName) {
  for (const sourceFile of project.getSourceFiles('src/**/*.{ts,tsx}')) {
    const iface = sourceFile.getInterface(interfaceName);
    if (iface) {
      const prop = iface.getProperty(propName);
      if (prop) {
        console.log(`Renombrando propiedad ${interfaceName}.${propName} -> ${newPropName}`);
        prop.rename(newPropName);
        return true;
      }
    }
  }
  console.warn(`NO ENCONTRADA propiedad: ${interfaceName}.${propName}`);
  return false;
}

const renames = JSON.parse(process.argv[2]);
for (const r of renames) {
  if (r.kind === 'property') {
    renamePropertyOfInterface(r.owner, r.name, r.newName);
  } else {
    renameSymbol(r.kind, r.name, r.newName);
  }
}

await project.save();
console.log('Listo.');
