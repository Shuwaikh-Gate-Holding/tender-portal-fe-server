import BaseNavbar from '#/components/BaseNavbar'
import CustomButton from '#/components/CustomButton'
import {
  ActionIcon,
  Box,
  Button,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Edit, Trash } from 'lucide-react'
import { useState } from 'react'
import type { Category } from './server'
import {
  deleteCategoryAction,
  fetchCategories,
  upsertCategoryAction,
} from './server'

export const Route = createFileRoute('/admin/categories/')({
  component: CategoriesManagement,
  loader: async () => {
    return { categories: await fetchCategories() }
  },
})

function CategoriesManagement() {
  const { categories } = Route.useLoaderData()
  const router = useRouter()
  const [opened, { open, close }] = useDisclosure(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
    },
    validate: {
      name: (value) =>
        value.length < 2 ? 'Name must have at least 2 characters' : null,
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    try {
      await upsertCategoryAction({
        data: {
          id: editingId || undefined,
          name: values.name,
          description: values.description,
        },
      })

      form.reset()
      setEditingId(null)
      close()
      await router.invalidate()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    form.setValues({
      name: category.name,
      description: category.description,
    })
    setEditingId(category.id)
    open()
  }

  const handleDelete = async (id: number, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This will affect all RFPs and vendors assigned to this category.`,
      )
    ) {
      return
    }

    try {
      await deleteCategoryAction({ data: { id } })
      await router.invalidate()
    } catch (error: any) {
      alert('Error deleting category: ' + error.message)
    }
  }

  const handleAdd = () => {
    form.reset()
    setEditingId(null)
    open()
  }

  const rows = categories.map((category) => (
    <Table.Tr key={category.id}>
      <Table.Td>
        <Text size="sm" fw={500}>
          {category.name}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {category.description || 'No description'}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="light"
            color="blue"
            onClick={() => handleEdit(category)}
            title="Edit"
          >
            <Edit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => handleDelete(category.id, category.name)}
            title="Delete"
          >
            <Trash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="Category Management"
        actionButton={
          <CustomButton
            buttonType="secondary"
            onClick={() => router.navigate({ to: '/admin' })}
          >
            Back to Dashboard
          </CustomButton>
        }
      />

      <Container size="xl" py="xl">
        <Stack gap="lg">
          <Group justify="space-between">
            <Box>
              <Title order={2}>Categories</Title>
              <Text c="dimmed" size="sm">
                Manage business categories for RFPs and vendors
              </Text>
            </Box>
            <Button onClick={handleAdd} color="indigo">
              + Add New Category
            </Button>
          </Group>

          <Paper withBorder shadow="sm" radius="md">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Category Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th style={{ width: 100 }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows}
                {categories.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={3}>
                      <Text ta="center" py="xl" c="dimmed">
                        No categories found. Add your first category to get
                        started.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>
      </Container>

      <Modal
        opened={opened}
        onClose={close}
        title={editingId ? 'Edit Category' : 'Add New Category'}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Category Name"
              placeholder="e.g., Technology, Construction"
              required
              {...form.getInputProps('name')}
            />
            <Textarea
              label="Description"
              placeholder="Brief description of this category"
              rows={3}
              {...form.getInputProps('description')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="light" color="gray" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} color="indigo">
                {editingId ? 'Update Category' : 'Add Category'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  )
}
