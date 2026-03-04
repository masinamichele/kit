# TODO

## Phase 1: The Foundations
- [x] **`init`**: Initialize a new Kit repository.
- [x] **Object Store**: Implement Git's core content-addressable storage.
  - [x] **`hash-object`**: Calculate an object ID and optionally create a blob from a file.
  - [x] **`cat-file`**: Inspect the content of a repository object by its ID.
    - [ ] Add pretty-printing (`-p`) for different object types (e.g., trees).
- [x] **`write-tree`**: Create a tree object from the current index.
- [x] **`commit-tree`**: Create a new commit object.

## Phase 2: The Staging Area (Index)
- [x] **Index Management**: Create and manage the staging area.
  - [x] **`update-index`**: Add file contents to the index.
  - [x] **`ls-files`**: Show information about files in the index.
  - [x] **`unstage`**: Remove file(s) from the staging area.

## Phase 3: Committing
- [x] **Commit Graph**: Build the history of the repository.
  - [x] **`write-tree`**: Create a tree object from the current index.
  - [x] **`commit-tree`**: Create a new commit object.

## Phase 4: Porcelain Commands
- [x] **User-Friendly Workflow**: Create higher-level commands that mimic the common Git workflow.
  - [x] **`add`**: A user-friendly interface for `update-index`.
  - [x] **`commit`**: Automate the process of creating trees and commits.
  - [x] **`log`**: Show the commit history.
    - [ ] Add branch and HEAD decorations.
  - [x] **`status`**: Show the working tree status.

## Phase 5: Branching and Merging
- [x] **Branching**: Manage different lines of development.
  - [x] **`branch`**: List, create, or delete branches.
  - [ ] **`checkout`**: Restore working tree files.
  - [ ] **`restore`**: Discard changes in the working directory.

## Phase 6: Refactoring & Cleanup
- [ ] **Abstract Index I/O**: Move all read/write logic for the index file into a dedicated `Index` helper.
- [ ] **General Codebase Cleanup**: Review all commands and helpers for consistency, clarity, and opportunities to reduce duplication.
