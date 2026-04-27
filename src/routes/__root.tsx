import { MantineProvider, createTheme } from '@mantine/core'
import '@mantine/core/styles.css'
import '../index.css'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { fetchUserSession } from '#/server/user'

// Define what your Auth Context looks like
export interface AuthState {
  user: User | null
  role: 'admin' | 'vendor' | null
}

interface MyRouterContext {
  queryClient: QueryClient
  supabase: SupabaseClient
  auth: AuthState
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`
const theme = createTheme({ primaryColor: 'indigo' })

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Procurement Portal' },
    ],
  }),
  beforeLoad: async ({ location }) => {
    try {
      const auth = await fetchUserSession()

      // Redirect to login if not authenticated and not already on the login page
      if (!auth.user && location.pathname !== '/login') {
        throw redirect({
          to: '/login',
          search: {
            redirect: location.href,
          },
        })
      }

      // If user is already logged in and goes to /login, redirect them to their dashboard
      if (auth.user && location.pathname === '/login') {
        if (auth.role === 'admin') {
          throw redirect({ to: '/admin' })
        } else {
          throw redirect({ to: '/vendors' })
        }
      }

      return { auth }
    } catch (error) {
      if (error instanceof Error && error.message.includes('redirect')) {
        throw error
      }
      return { auth: { user: null, role: null } }
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}






