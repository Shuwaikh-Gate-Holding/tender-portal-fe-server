import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.user) {
      if (context.auth.role === 'admin') {
        throw redirect({ to: '/admin' })
      } else {
        throw redirect({ to: '/vendors' })
      }
    }
  },
  component: App,
})

function App() {
  return <></>
}
