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
import { Box, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useEffect, useRef, useState } from "react";
import { formatDistance } from "date-fns";
import { styled } from "@stitches/react";
import { Note, storedNotes } from "@/utils/storage";

const ClampedText = styled(Text, {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

function App() {
  const editorRef = useRef<MDXEditorMethods>(null);
  const [noteObjects, setNoteObjects] = useState<Record<number, Note>>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | undefined>();
  const currentNote =
    selectedNoteId !== undefined ? noteObjects[selectedNoteId] : undefined;

  const updateCurrentStoredNote = (update: Partial<Note>) => {
    if (selectedNoteId && currentNote) {
      storedNotes.setValue({
        ...noteObjects,
        [selectedNoteId]: {
          ...currentNote,
          timeLastModified: new Date().valueOf(),
          ...update,
        },
      });
    }
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      updateCurrentStoredNote({
        markdown: editorRef.current.getMarkdown(),
      });
    }
  };

  const handleTitleChange = (title: string) => {
    updateCurrentStoredNote({
      title,
    });
  };

  const newNote = async () => {
    const oldNotes = await storedNotes.getValue();
    const newId = new Date().valueOf();
    storedNotes.setValue({
      ...oldNotes,
      [newId]: {
        markdown: "",
        title: "",
        timeLastModified: new Date().valueOf(),
      },
    });
    return newId;
  };

  useEffect(() => {
    const unwatch = storedNotes.watch((newNotes, _oldNotes) => {
      if (newNotes) {
        setNoteObjects(newNotes);
      }
    });
    return unwatch;
  }, []);

  useEffect(() => {
    if (currentNote) {
      editorRef.current?.setMarkdown(currentNote.markdown);
    }
  }, [currentNote]);

  useEffect(() => {
    (async () => {
      const initNotes = await storedNotes.getValue();
      if (initNotes) {
        setNoteObjects(initNotes);
        if (Object.keys(initNotes).length == 0) {
          setSelectedNoteId(await newNote());
        } else {
          setSelectedNoteId(Number(Object.keys(initNotes).at(0)));
        }
      }
    })();
  }, []);

  return (
    <Flex direction="row" gap="2" style={{ height: "100vh" }}>
      <Flex
        direction="column"
        gap="4"
        p="4"
        height="100%"
        style={{
          minWidth: "16rem",
          maxWidth: "16rem",
          backgroundColor: "var(--sand-4)",
        }}
      >
        <Heading>Notes</Heading>
        {Object.entries(noteObjects).map(([timeCreated, note]) => (
          <Card asChild>
            <button
              onClick={() => setSelectedNoteId(Number(timeCreated))}
              style={{ cursor: "pointer" }}
            >
              <Text as="div" size="2" weight="bold">
                {note.title}
              </Text>
              <ClampedText as="div" color="gray" size="2">
                {note.markdown}
              </ClampedText>
            </button>
          </Card>
        ))}
        <Card asChild>
          <button onClick={newNote} style={{ cursor: "pointer" }}>
            <ClampedText as="div" color="gray" size="2">
              New Note
            </ClampedText>
          </button>
        </Card>
      </Flex>
      <Flex direction="column" width="100%" p="4" gap="4">
        <TextField.Input
          placeholder="Untitled note"
          size="3"
          value={currentNote?.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <Box
          height="100%"
          onClick={() => {
            editorRef.current?.focus();
          }}
        >
          <MDXEditor
            ref={editorRef}
            markdown=""
            onChange={handleEditorChange}
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
        </Box>
        <Text as="div" size="2">
          last edited{" "}
          {currentNote &&
            formatDistance(new Date(currentNote.timeLastModified), new Date(), {
              addSuffix: true,
            })}
        </Text>
      </Flex>
    </Flex>
  );
}

export default App;
