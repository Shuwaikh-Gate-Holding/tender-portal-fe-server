import BaseNavbar from '#/components/BaseNavbar'
import CustomButton from '#/components/CustomButton'
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Category, User } from './server'
import {
  fetchVendorsData,
  toggleVendorApprovalAction,
  toggleVendorCategoryAction,
} from './server'

export const Route = createFileRoute('/admin/vendors/')({
  component: VendorsManagement,
  loader: async () => {
    return await fetchVendorsData()
  },
})

function VendorsManagement() {
  const {
    users,
    categories,
    vendorCategoriesMapping: initialMapping,
  } = Route.useLoaderData()
  const router = useRouter()
  const [opened, { open, close }] = useDisclosure(false)
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [vendorCategoriesMapping, setVendorCategoriesMapping] =
    useState(initialMapping)

  useEffect(() => {
    setVendorCategoriesMapping(initialMapping)
  }, [initialMapping])

  const toggleApproval = async (email: string, approved: boolean) => {
    try {
      await toggleVendorApprovalAction({ data: { email, approved } })
      await router.invalidate()
    } catch (error) {
      console.error('Error toggling approval:', error)
    }
  }

  const toggleCategory = async (
    vendorEmail: string,
    categoryId: number,
    hasCategory: boolean,
  ) => {
    try {
      await toggleVendorCategoryAction({
        data: { vendorEmail, categoryId, hasCategory },
      })

      setVendorCategoriesMapping((prev) => {
        const currentCategories = prev[vendorEmail] || []
        let nextCategories: number[]
        if (hasCategory) {
          nextCategories = currentCategories.filter((id) => id !== categoryId)
        } else {
          nextCategories = [...currentCategories, categoryId]
        }
        return {
          ...prev,
          [vendorEmail]: nextCategories,
        }
      })
    } catch (error) {
      console.error('Error toggling category:', error)
    }
  }

  const openCategoryModal = (email: string) => {
    setSelectedVendor(email)
    open()
  }

  const rows = users.map((user: User) => {
    const userCategories = vendorCategoriesMapping[user.email] || []
    return (
      <Table.Tr key={user.id}>
        <Table.Td>
          <Text size="sm" fw={500}>
            {user.email}
          </Text>
        </Table.Td>
        <Table.Td>
          {user.isAdmin ? (
            <Badge color="violet" variant="light">
              Admin
            </Badge>
          ) : (
            <Badge color="blue" variant="light">
              Vendor
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          {user.approved ? (
            <Badge color="green" variant="light">
              Approved
            </Badge>
          ) : (
            <Badge color="yellow" variant="light">
              Pending
            </Badge>
          )}
        </Table.Td>
        <Table.Td>
          <Text size="xs" c="dimmed">
            {new Date(user.created_at).toLocaleDateString()}
          </Text>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              color={user.approved ? 'orange' : 'green'}
              onClick={() => toggleApproval(user.email, user.approved)}
            >
              {user.approved ? 'Revoke' : 'Approve'}
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={() => openCategoryModal(user.email)}
            >
              Categories ({userCategories.length})
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    )
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="User Management"
        actionButton={
          <CustomButton
            buttonType="secondary"
            onClick={() => router.navigate({ to: '/admin' })}
          >
            Back to Dashboard
          </CustomButton>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Paper shadow="sm" radius="md" p="md" withBorder>
          <Group justify="space-between" mb="lg">
            <div>
              <Text size="lg" fw={700}>
                All Users
              </Text>
              <Text size="sm" c="dimmed">
                Manage user roles and permissions
              </Text>
            </div>
            <Button
              variant="outline"
              onClick={() => router.navigate({ to: '/admin/vendors/add' })}
            >
              Add Vendor
            </Button>
          </Group>

          <ScrollArea h={600} offsetScrollbars>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Registered</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows}
                {users.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text ta="center" py="xl" c="dimmed">
                        No vendors yet. Vendors will appear here after they
                        register.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      </div>

      <Modal
        opened={opened}
        onClose={close}
        title={`Manage Categories for ${selectedVendor}`}
        size="md"
        centered
        radius="md"
      >
        <Text size="sm" c="dimmed" mb="lg">
          Select categories this vendor can view and bid on:
        </Text>

        <ScrollArea h={400} offsetScrollbars>
          <Stack gap="xs">
            {categories.map((category: Category) => {
              const currentMapping = selectedVendor
                ? vendorCategoriesMapping[selectedVendor] || []
                : []
              const isAssigned = currentMapping.includes(category.id)
              return (
                <Paper key={category.id} withBorder p="xs" radius="sm">
                  <Checkbox
                    label={category.name}
                    checked={isAssigned}
                    onChange={() =>
                      selectedVendor &&
                      toggleCategory(selectedVendor, category.id, isAssigned)
                    }
                    styles={{ label: { cursor: 'pointer' } }}
                  />
                </Paper>
              )
            })}
          </Stack>
        </ScrollArea>

        <Group justify="flex-end" mt="xl">
          <Button onClick={close}>Done</Button>
        </Group>
      </Modal>
    </div>
  )
}
