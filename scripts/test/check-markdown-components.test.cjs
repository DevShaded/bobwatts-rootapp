const assert = require("node:assert/strict");
const { test } = require("node:test");
const { checkMarkdownComponents } = require("../check-markdown-components.cjs");

test("reports inline react-markdown renderers at their source location", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import Markdown from "react-markdown";
    function Editor() {
      return <Markdown components={{ a: ({ children }) => <span>{children}</span> }}>Hello</Markdown>;
    }
  `);
  assert.equal(failures.length, 1);
  assert.match(failures[0], /editor.tsx:4:\d+:.*module scope/);
});

test("reports a renderer map created inside a component", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import Preview from "react-markdown";
    function Editor() {
      const components = { a(props) { return <span>{props.children}</span>; } };
      return <Preview components={components}>Hello</Preview>;
    }
  `);
  assert.equal(failures.length, 1);
});

test("reports local renderers reached through shorthand and spreads", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import Markdown from "react-markdown";
    function Editor() {
      const a = (props) => <span>{props.children}</span>;
      const renderers = { a };
      return <Markdown components={{ ...renderers }}>Hello</Markdown>;
    }
  `);
  assert.equal(failures.length, 1);
});

test("allows stable module renderers and unrelated JSX callbacks", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import Markdown from "react-markdown";
    const components = { a: ({ children }) => <span>{children}</span> };
    function Editor() {
      return <><Markdown components={components}>Hello</Markdown><button onClick={() => save()} /></>;
    }
  `);
  assert.deepEqual(failures, []);
});

test("allows module renderer references in a local map", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import { MarkdownHooks as Preview } from "react-markdown";
    const Link = ({ children }) => <span>{children}</span>;
    function Editor() {
      return <Preview components={{ a: Link }}>Hello</Preview>;
    }
  `);
  assert.deepEqual(failures, []);
});

test("only checks the imported Markdown component, including local shadowing", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import Markdown from "react-markdown";
    function Editor({ Markdown }) {
      return <Markdown components={{ a: () => <span /> }} />;
    }
  `);
  assert.deepEqual(failures, []);
});

test("reports renderers in JSX spread props and conditional maps", () => {
  for (const attribute of [
    '{...{ components: { a: () => <span /> } }}',
    'components={enabled ? { a: () => <span /> } : {}}',
  ]) {
    assert.equal(checkMarkdownComponents("editor.tsx", `
      import Markdown from "react-markdown";
      function Editor() { return <Markdown ${attribute}>Hello</Markdown>; }
    `).length, 1, attribute);
  }
});

test("reports inline renderers through default aliases and namespace imports", () => {
  for (const [declaration, component] of [
    ['import { default as Preview } from "react-markdown";', "Preview"],
    ['import * as markdown from "react-markdown";', "markdown.default"],
  ]) {
    assert.equal(checkMarkdownComponents("editor.tsx", `
      ${declaration}
      function Editor() { return <${component} components={{ a: () => <span /> }}>Hello</${component}>; }
    `).length, 1, declaration);
  }
});

test("reports renderers in logical fallback maps and JSX spread props", () => {
  for (const attribute of [
    'components={enabled && { a: () => <span /> } || {}}',
    'components={overrides ?? { a: () => <span /> }}',
    '{...(enabled && { components: { a: () => <span /> } } || {})}',
  ]) {
    assert.equal(checkMarkdownComponents("editor.tsx", `
      import Markdown from "react-markdown";
      function Editor() { return <Markdown ${attribute}>Hello</Markdown>; }
    `).length, 1, attribute);
  }
});

test("follows local Markdown component aliases", () => {
  assert.equal(checkMarkdownComponents("editor.tsx", `
    import Markdown from "react-markdown";
    const Preview = Markdown;
    function Editor() { return <Preview components={{ a: () => <span /> }} />; }
  `).length, 1);
});

test("follows renderer and props member access", () => {
  for (const attribute of [
    'components={props.components}',
    'components={props["components"]}',
    'components={{ a: props.components.a }}',
  ]) {
    assert.equal(checkMarkdownComponents("editor.tsx", `
      import Markdown from "react-markdown";
      function Editor() {
        const props = { components: { a: () => <span /> } };
        return <Markdown ${attribute}>Hello</Markdown>;
      }
    `).length, 1, attribute);
  }
});

test("follows method and shorthand renderer members", () => {
  for (const declaration of [
    'const renderers = { a() { return <span />; } };',
    'const a = () => <span />; const renderers = { a };',
  ]) {
    assert.equal(checkMarkdownComponents("editor.tsx", `
      import Markdown from "react-markdown";
      function Editor() { ${declaration} return <Markdown components={{ a: renderers.a }} />; }
    `).length, 1, declaration);
  }
});

test("allows stable renderer members and a shadowed component alias", () => {
  const failures = checkMarkdownComponents("editor.tsx", `
    import Markdown from "react-markdown";
    const Preview = Markdown;
    const props = { components: { a: () => <span /> } };
    function Editor() { return <Preview components={props.components} />; }
    function Other({ Preview }) { return <Preview components={{ a: () => <span /> }} />; }
  `);
  assert.deepEqual(failures, []);
});
