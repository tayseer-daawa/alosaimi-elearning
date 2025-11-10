import { createFileRoute } from '@tanstack/react-router'
import ExampleComponent from '../features/example/components/ExampleComponent'

export const Route = createFileRoute('/example')({
  component: ExampleComponent,
})
