import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export interface SearchReplaceState {
  searchTerm: string;
  replaceTerm: string;
  caseSensitive: boolean;
  results: { from: number; to: number }[];
  currentIndex: number;
}

const searchReplacePluginKey = new PluginKey<SearchReplaceState>("searchReplace");

function getSearchResults(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  searchTerm: string,
  caseSensitive: boolean
): { from: number; to: number }[] {
  if (!searchTerm) return [];

  const results: { from: number; to: number }[] = [];
  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  doc.descendants((node: { isText: boolean; text?: string }, pos: number) => {
    if (!node.isText || !node.text) return;
    const text = caseSensitive ? node.text : node.text.toLowerCase();
    let index = text.indexOf(term);
    while (index !== -1) {
      results.push({
        from: pos + index,
        to: pos + index + term.length,
      });
      index = text.indexOf(term, index + 1);
    }
  });

  return results;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    searchReplace: {
      setSearchTerm: (term: string) => ReturnType;
      setReplaceTerm: (term: string) => ReturnType;
      setCaseSensitive: (caseSensitive: boolean) => ReturnType;
      goToNextResult: () => ReturnType;
      goToPrevResult: () => ReturnType;
      replaceCurrent: () => ReturnType;
      replaceAll: () => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export const SearchReplace = Extension.create({
  name: "searchReplace",

  addStorage() {
    return {
      searchTerm: "",
      replaceTerm: "",
      caseSensitive: false,
      results: [] as { from: number; to: number }[],
      currentIndex: 0,
    } as SearchReplaceState;
  },

  addCommands() {
    return {
      setSearchTerm:
        (term: string) =>
        ({ editor }) => {
          editor.storage.searchReplace.searchTerm = term;
          const results = getSearchResults(
            editor.state.doc,
            term,
            editor.storage.searchReplace.caseSensitive
          );
          editor.storage.searchReplace.results = results;
          editor.storage.searchReplace.currentIndex = results.length > 0 ? 0 : -1;
          // Trigger a transaction to update decorations
          editor.view.dispatch(editor.state.tr);
          return true;
        },

      setReplaceTerm:
        (term: string) =>
        ({ editor }) => {
          editor.storage.searchReplace.replaceTerm = term;
          return true;
        },

      setCaseSensitive:
        (caseSensitive: boolean) =>
        ({ editor }) => {
          editor.storage.searchReplace.caseSensitive = caseSensitive;
          const results = getSearchResults(
            editor.state.doc,
            editor.storage.searchReplace.searchTerm,
            caseSensitive
          );
          editor.storage.searchReplace.results = results;
          editor.storage.searchReplace.currentIndex = results.length > 0 ? 0 : -1;
          editor.view.dispatch(editor.state.tr);
          return true;
        },

      goToNextResult:
        () =>
        ({ editor }) => {
          const { results, currentIndex } = editor.storage.searchReplace;
          if (results.length === 0) return false;
          const nextIndex = currentIndex >= results.length - 1 ? 0 : currentIndex + 1;
          editor.storage.searchReplace.currentIndex = nextIndex;
          const result = results[nextIndex];
          editor.commands.setTextSelection(result);
          scrollToSelection(editor);
          editor.view.dispatch(editor.state.tr);
          return true;
        },

      goToPrevResult:
        () =>
        ({ editor }) => {
          const { results, currentIndex } = editor.storage.searchReplace;
          if (results.length === 0) return false;
          const prevIndex = currentIndex <= 0 ? results.length - 1 : currentIndex - 1;
          editor.storage.searchReplace.currentIndex = prevIndex;
          const result = results[prevIndex];
          editor.commands.setTextSelection(result);
          scrollToSelection(editor);
          editor.view.dispatch(editor.state.tr);
          return true;
        },

      replaceCurrent:
        () =>
        ({ editor }) => {
          const { results, currentIndex, replaceTerm } = editor.storage.searchReplace;
          if (results.length === 0 || currentIndex < 0) return false;
          const result = results[currentIndex];
          editor.chain().focus().setTextSelection(result).insertContent(replaceTerm).run();
          // Recalculate results after replacement
          const newResults = getSearchResults(
            editor.state.doc,
            editor.storage.searchReplace.searchTerm,
            editor.storage.searchReplace.caseSensitive
          );
          editor.storage.searchReplace.results = newResults;
          editor.storage.searchReplace.currentIndex = newResults.length > 0
            ? Math.min(currentIndex, newResults.length - 1)
            : -1;
          editor.view.dispatch(editor.state.tr);
          return true;
        },

      replaceAll:
        () =>
        ({ editor }) => {
          const { searchTerm, replaceTerm, caseSensitive } = editor.storage.searchReplace;
          if (!searchTerm) return false;
          const results = getSearchResults(editor.state.doc, searchTerm, caseSensitive);
          // Replace from end to start to preserve positions
          const chain = editor.chain().focus();
          for (let i = results.length - 1; i >= 0; i--) {
            chain.setTextSelection(results[i]).insertContent(replaceTerm);
          }
          chain.run();
          editor.storage.searchReplace.results = [];
          editor.storage.searchReplace.currentIndex = -1;
          editor.view.dispatch(editor.state.tr);
          return true;
        },

      clearSearch:
        () =>
        ({ editor }) => {
          editor.storage.searchReplace.searchTerm = "";
          editor.storage.searchReplace.replaceTerm = "";
          editor.storage.searchReplace.results = [];
          editor.storage.searchReplace.currentIndex = -1;
          editor.view.dispatch(editor.state.tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage as SearchReplaceState;

    return [
      new Plugin({
        key: searchReplacePluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, _oldDecorations) {
            if (!storage.searchTerm || storage.results.length === 0) {
              return DecorationSet.empty;
            }

            const decorations = storage.results.map((result, index) => {
              const className =
                index === storage.currentIndex
                  ? "search-highlight search-highlight-current"
                  : "search-highlight";
              return Decoration.inline(result.from, result.to, {
                class: className,
              });
            });

            return DecorationSet.create(tr.doc, decorations);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      "Mod-f": () => {
        // This will be caught by CollabEditor to show the FindReplaceBar
        return false;
      },
      "Mod-h": () => {
        // This will be caught by CollabEditor to show the FindReplaceBar
        return false;
      },
    };
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scrollToSelection(editor: any) {
  const { node } = editor.view.domAtPos(editor.state.selection.from);
  if (node?.scrollIntoView) {
    node.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
