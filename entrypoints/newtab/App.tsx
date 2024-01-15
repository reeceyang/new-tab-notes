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
import { formatDistanceToNow, intlFormat } from "date-fns";
import { Note, storedNotes } from "@/utils/storage";

function App() {
  const editorRef = useRef<MDXEditorMethods>(null);
  const [noteObjects, setNoteObjects] = useState<Record<number, Note>>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<number | undefined>();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
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
          <NoteCard
            onClick={() => setSelectedNoteId(Number(timeCreated))}
            isSelected={Number(timeCreated) === selectedNoteId}
            timeCreated={timeCreated}
            note={note}
          />
        ))}
        <Card asChild>
          <button onClick={newNote} style={{ cursor: "pointer" }}>
            <Text as="div" color="gray" size="2">
              New Note
            </Text>
          </button>
        </Card>
      </Flex>
      <Flex
        direction="column"
        p="4"
        gap="4"
        style={{ width: "calc(100vw - 16.5rem)" }} // HACK
      >
        <Box style={{ minHeight: "1.5rem", maxHeight: "1.5rem" }}>
          {!currentNote?.title || isEditingTitle ? (
            <TextField.Input
              placeholder="Untitled note"
              size="2"
              value={currentNote?.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              autoFocus
            />
          ) : (
            <Heading
              m="auto"
              onClick={() => setIsEditingTitle(true)}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentNote.title}
            </Heading>
          )}
        </Box>
        <Card
          style={{ height: "100%", marginTop: "0.375rem" }} // HACK: aligns with top of NoteCards
          onClick={() => {
            editorRef.current?.focus();
          }}
        >
          <MDXEditor
            ref={editorRef}
            markdown=""
            placeholder="Start editing using Markdown"
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
        </Card>
        <Text as="div" size="2">
          created {intlFormat(new Date(selectedNoteId ?? 0))}. last edited{" "}
          {currentNote &&
            formatDistanceToNow(new Date(currentNote.timeLastModified), {
              addSuffix: true,
            })}
        </Text>
      </Flex>
    </Flex>
  );
}

export default App;

const NoteCard = ({
  timeCreated,
  note,
  onClick,
  isSelected,
}: {
  timeCreated: string;
  note: Note;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  isSelected: boolean;
}) => {
  return (
    <Card
      asChild
      {...(isSelected && {
        style: { borderColor: "var(--blue-8)" },
      })}
    >
      <button onClick={onClick} style={{ cursor: "pointer" }}>
        <Flex direction="column" gap="2">
          {note.title ? (
            <Text
              as="div"
              size="2"
              weight="bold"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {note.title}
            </Text>
          ) : (
            <Text as="div" size="2" color="gray">
              Untitled note
            </Text>
          )}
          <Text
            as="div"
            size="2"
            color="gray"
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {note.markdown}
          </Text>
          <Text as="div" size="2" color="gray">
            {intlFormat(new Date(Number(timeCreated)))}
          </Text>
        </Flex>
      </button>
    </Card>
  );
};
