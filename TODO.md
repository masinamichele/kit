# TODO

## Immediate Priorities
- [x] **Coverage baseline reached**: split E2E suite now exceeds targets (`line >= 95%`, `branch >= 90%`, `functions ~= 100%`).
- [ ] **Maintain coverage baseline**: keep coverage above target while adding/fixing behavior.
- [x] **Test output artifact**: generate and maintain `tests/.artifacts/command-output.log` for command-by-command output review.
- [ ] **Type-checking cleanup**: review the current TypeScript/compiler setup so valid command definitions do not require incidental annotations just to pass the build.
- [ ] **`status` correctness**: fix deletion and edge-case reporting so `HEAD`, index, and working tree comparisons stay consistent.
- [ ] **`diff` correctness**: replace the current duplicate-line-sensitive LCS output with a stable line matching strategy.
- [ ] **Error handling and parsing hardening**: make object, ref, index, and revision parsing fail clearly instead of depending on unchecked destructuring and regex matches.
- [ ] **Branch UX decision**: decide whether `branch <name>` should keep the current create-or-switch behavior or be split into behavior closer to Git.

## Implemented
- [x] `init`
- [x] `hash-object`
- [x] `cat-file`
- [x] `write-tree`
- [x] `commit-tree`
- [x] `update-index`
- [x] `ls-files`
- [x] `add`
- [x] `unstage`
- [x] `commit`
- [x] `log`
- [x] `status`
- [x] `branch`
- [x] `rev-parse`
- [x] `diff`

## Existing Features To Improve
- [ ] **`rev-parse`**: extend validation and error messages around ambiguous or malformed revisions.
- [ ] **`cat-file`**: consider adding pretty-printing for trees and typed object inspection.
- [ ] **`log`**: add branch and `HEAD` decorations.
- [ ] **Index format**: validate read/write invariants and malformed entry handling.
- [ ] **Refs behavior**: tighten behavior around unborn branches and branch creation before the first commit.
- [ ] **Ignore semantics**: clarify and improve how `.kitignore` intentionally differs from `.gitignore`.
- [ ] **Optional repo files**: decide which files are truly optional at runtime, especially `.kitignore`, and make initialization/error handling match that decision.

## Future Commands
- [ ] **`show`**: display commit/object details together with diffs.
- [ ] **`reflog`**: track `HEAD` movements.
- [ ] **`stash`**: store work in progress safely.
- [ ] **`checkout`**: restore the working tree from a target commit or branch, in a simplified model.
- [ ] **`restore`**: discard working tree changes from the index.
