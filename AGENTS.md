# Important Rules

- Don't create comments for getters and setters. It's a waste of space.
- Use JSDoc type definitions as much as possible. Declare new types if needed
- If there are multiple implementation options, ask the user which one to implement
- Keep things DRY: Don't repeat yourself. 
- Keep things simple stupid: Prefer simple solutions over complex ones.
- Keep the code as simple as possible. Don't implement workarounds and fallbacks if not strictly necessary.
- Use the `gh` CLI tool to inspect broken workflow runs
- If you try to make the builds work on github actions, use the ./RUNNER-FIX-HISTORY.md file to check the history of fixes, and try to understand what was tried and what was not tried yet.
- Please write temp files into the project itself, since write operations outside of the repo can not be auto approved. Write them into a `temp/` directory and ignore that directory in git. You can use these temp files to store data between iterations.
- Don't skip tests, just to enable a release. If a test is failing, it's very likely for a good reason.