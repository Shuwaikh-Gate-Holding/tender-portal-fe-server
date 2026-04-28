# Follow these instructions while making changes to the project:

- for every command you run, make sure i am on windows powershell environment.
- For stylings, use the mantine stylings.
- Alwyas use pnpm for anything insteaad of npm.
- for forms creation and validation use @mantine/form.
- in order to do anything mantine related use .skills/mantine/llms.txt
- as you can se ei have added server.ts inside routeFileIgnorePatters in vite config, if the route has any server function which is used only in that route, create a folder for that route and add the route code inside routefolder/route.tsx and add the server function inside routefolder/server.ts.
- dont run eslint checks after evert step.
- dont invoke any supabase in client side code, always invoke supabase from server functions.
- Always invoke any supabase related things inside server functions.
