import "@mdxeditor/editor/style.css";

import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  MDXEditor,
  MDXEditorMethods,
  UndoRedo,
  frontmatterPlugin,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { useEffect, useRef } from "react";

function App() {
  const editorRef = useRef<MDXEditorMethods>(null);

  const handleChange = () => {
    if (editorRef.current) {
      storage.setItem("local:note", editorRef.current.getMarkdown());
    }
  };

  useEffect(() => {
    const unwatch = storage.watch<string>("local:note", (newNote, _oldNote) => {
      if (newNote) {
        editorRef.current?.setMarkdown(newNote);
      }
    });
    return unwatch;
  }, []);

  useEffect(() => {
    (async () => {
      const note = await storage.getItem<string>("local:note");
      if (note) {
        editorRef.current?.setMarkdown(note);
      }
    })();
  }, []);

  return (
    <div
      style={{ height: "100vh" }}
      onClick={() => {
        editorRef.current?.focus();
      }}
    >
      <MDXEditor
        autoFocus
        ref={editorRef}
        markdown=""
        onChange={handleChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          quotePlugin(),
          markdownShortcutPlugin(),
          thematicBreakPlugin(),
          frontmatterPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <BlockTypeSelect />
                <BoldItalicUnderlineToggles />
                <CreateLink />
                <ListsToggle />
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}

export default App;
