# TODO

## Core Functionality
- [x] **`init`**: Initialize a new Kit repository.
- [x] **Object Model**: `hash-object`, `cat-file`, `write-tree`, `commit-tree`.
- [x] **Index / Staging Area**: `update-index`, `ls-files`, `add`, `unstage`.
- [x] **Commit History**: `commit`, `log`, `status`.
- [x] **Branching**: `branch`.
- [x] **Diffing**: `diff`.

## Future Features & Enhancements

### Revision Parsing & Inspection
- [ ] **`rev-parse`**: Implement a robust revision parser (short SHAs, `HEAD^`, `HEAD~n`).
- [ ] **`show`**: Create a command to show detailed object information, including commit diffs.

### Repository History & Safety
- [ ] **`reflog`**: Implement the reflog mechanism for tracking `HEAD` movements.
- [ ] **`stash`**: Implement temporary storage for work in progress.

### Usability & Output
- [ ] **`log` Decorations**: Add branch and `HEAD` pointers to the log output.
- [ ] **`cat-file -p`**: Add pretty-printing for tree objects.

### Working Directory Management
- [ ] **`checkout`**: Restore working tree files from a specific commit.
- [ ] **`restore`**: Discard changes in the working directory by restoring from the index.

### Code Quality
- [x] **Major Refactoring**: Centralized Index I/O and command logic.
- [ ] **Ongoing Cleanup**: Continue to standardize error handling and improve consistency.
