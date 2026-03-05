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
This phase focuses on improving the existing codebase for consistency, clarity, and maintainability before adding new features.

### 1. Centralize Index Management
- **Goal**: Abstract all read/write operations for the `.kit/index` file into a single, dedicated helper.
- **Actions**:
  - [ ] Create a new helper file: `src/helpers/index.ts`.
  - [ ] Create an `Index` namespace within the new file.
  - [ ] Create `Index.read(): Promise<Map<string, string>>` by moving the parsing logic from `State.index()`.
  - [ ] Create `Index.write(state: Map<string, string>): Promise<void>` by moving the serialization logic from `unstage.command.ts`.
- **Impact**:
  - `unstage.command.ts` will be simplified to call `Index.read()` and `Index.write()`.
  - `update-index.command.ts` will be refactored to use `Index.read()` and `Index.write()`.
  - `State.index()` will be simplified to call `Index.read()`.

### 2. Consolidate Command Logic & Helpers
- **Goal**: Ensure commands are lean orchestrators and helpers have clear, single responsibilities.
- **Actions**:
  - [ ] Refactor `update-index.command.ts`: Move its core logic ("hash an object and add it to the index") into a new `Index.add(filePath: string)` helper function.
  - [ ] Refactor `add.command.ts`: Update it to call the new `Index.add(file)` in its loop, making the dependency chain clearer.
  - [ ] Refactor `ls-files.command.ts`: Update it to use the new `Index.read()` helper instead of performing its own file I/O.
  - [ ] Refactor `write-tree.command.ts`: Update it to use the new `Index.read()` helper.

### 3. Standardize Error Handling and Output
- **Goal**: Ensure a consistent user experience.
- **Actions**:
  - [ ] Review all commands to ensure they consistently `return` data rather than `console.log`ging it (exceptions: `status` and `log`).
  - [ ] Review all `assert` and `throw new Error` messages to ensure they are user-friendly and specific.
  - [ ] Refine `KitConfig.read()`: Decide on a consistent strategy for when the config file is missing (e.g., throw a specific error vs. returning a default object).

### 4. Final Polish
- **Goal**: Address minor inconsistencies.
- **Actions**:
  - [ ] **`KitRoot` Caching**: The `find` function's caching can be made more robust. Consider if `init` should explicitly set the cached value.
