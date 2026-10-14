const { readFileSync, readdirSync } = require("node:fs");
const { join, resolve } = require("node:path");
const ts = require("typescript");

function checkMarkdownComponents(filename, content) {
  const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const host = ts.createCompilerHost({});
  host.getSourceFile = (name) => name === filename ? source : undefined;
  const program = ts.createProgram([filename], { noLib: true, noResolve: true }, host);
  const checker = program.getTypeChecker();
  const markdownImports = new Set();
  const markdownNamespaces = new Set();
  const rendererExports = ["default", "MarkdownAsync", "MarkdownHooks"];
  const failures = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.text !== "react-markdown") continue;
    const clause = statement.importClause;
    if (clause?.name) markdownImports.add(checker.getSymbolAtLocation(clause.name));
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const specifier of clause.namedBindings.elements) {
        if (rendererExports.includes((specifier.propertyName ?? specifier.name).text)) {
          markdownImports.add(checker.getSymbolAtLocation(specifier.name));
        }
      }
    } else if (clause?.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      markdownNamespaces.add(checker.getSymbolAtLocation(clause.namedBindings.name));
    }
  }

  function expressionSymbol(node) {
    if (ts.isPropertyAccessExpression(node)) return checker.getSymbolAtLocation(node.name);
    if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
      return checker.getTypeAtLocation(node.expression).getProperty(node.argumentExpression.text);
    }
    return ts.isShorthandPropertyAssignment(node.parent)
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
  }

  function isMarkdown(node, visited = new Set()) {
    if (!node || visited.has(node)) return false;
    visited.add(node);
    const symbol = expressionSymbol(node);
    if (markdownImports.has(symbol)) return true;
    if (ts.isPropertyAccessExpression(node) && markdownNamespaces.has(expressionSymbol(node.expression)) &&
        rendererExports.includes(node.name.text)) return true;
    for (const declaration of symbol?.declarations ?? []) {
      if (ts.isVariableDeclaration(declaration) && isMarkdown(declaration.initializer, visited)) return true;
    }
    return false;
  }

  const visitedRenderers = new Set();
  const visitedProps = new Set();
  function inspect(node, propsOnly = false) {
    // Spread JSX props need the components field; a renderer map needs all its values.
    const visited = propsOnly ? visitedProps : visitedRenderers;
    if (!node || visited.has(node)) return;
    visited.add(node);
    if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const symbol = expressionSymbol(node);
      for (const declaration of symbol?.declarations ?? []) {
        if (ts.isVariableDeclaration(declaration) || ts.isPropertyAssignment(declaration)) inspect(declaration.initializer, propsOnly);
        else if (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) inspect(declaration, propsOnly);
        else if (ts.isShorthandPropertyAssignment(declaration)) inspect(declaration.name, propsOnly);
      }
    } else if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isSpreadAssignment(property)) inspect(property.expression, propsOnly);
        else if (!propsOnly || property.name?.text === "components") {
          if (ts.isPropertyAssignment(property)) inspect(property.initializer);
          else if (ts.isShorthandPropertyAssignment(property)) inspect(property.name);
          else if (ts.isMethodDeclaration(property)) inspect(property);
        }
      }
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      if (propsOnly) return;
      // A renderer created inside another function gets a new React component identity on rerender.
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (ts.isFunctionLike(parent)) {
          const { line, character } = source.getLineAndCharacterOfPosition(node.getStart());
          failures.push(`${filename}:${line + 1}:${character + 1}: Move react-markdown component renderers to module scope to preserve DOM and focus.`);
          break;
        }
      }
    } else if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isNonNullExpression(node)) {
      inspect(node.expression, propsOnly);
    } else if (ts.isConditionalExpression(node)) {
      inspect(node.whenTrue, propsOnly);
      inspect(node.whenFalse, propsOnly);
    } else if (ts.isBinaryExpression(node)) {
      inspect(node.left, propsOnly);
      inspect(node.right, propsOnly);
    }
  }

  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      if (!isMarkdown(node.tagName)) { ts.forEachChild(node, visit); return; }
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxAttribute(attribute) && attribute.name.text === "components" &&
            attribute.initializer && ts.isJsxExpression(attribute.initializer)) {
          inspect(attribute.initializer.expression);
        } else if (ts.isJsxSpreadAttribute(attribute)) inspect(attribute.expression, true);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return failures;
}

function checkDirectory(directory) {
  let failures = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) failures = failures.concat(checkDirectory(path));
    else if (/\.[jt]sx?$/.test(entry.name)) failures = failures.concat(checkMarkdownComponents(path, readFileSync(path, "utf8")));
  }
  return failures;
}

if (require.main === module) {
  const failures = checkDirectory(resolve(__dirname, "../client/src"));
  for (const failure of failures) console.error(failure);
  process.exitCode = failures.length ? 1 : 0;
}

module.exports = { checkMarkdownComponents };
