import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  TextInput,
  Checkbox,
  Button,
  Paper,
  Title,
  Container,
  Stack,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { addVendorAction } from '../admin/vendors/server'
import BaseNavbar from '#/components/BaseNavbar'
import CustomButton from '#/components/CustomButton'

export const Route = createFileRoute('/vendors/add')({
  component: AddVendor,
})

function AddVendor() {
  const router = useRouter()

  const form = useForm({
    initialValues: {
      email: '',
      approved: false,
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      await addVendorAction({ data: values })
      router.navigate({ to: '/admin/vendors' })
    } catch (error) {
      console.error('Error adding vendor:', error)
      alert('Failed to add vendor')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="Add Vendor"
        actionButton={
          <CustomButton
            buttonType="secondary"
            onClick={() => router.navigate({ to: '/admin/vendors' })}
          >
            Back to Vendors
          </CustomButton>
        }
      />

      <Container size="sm" py="xl">
        <Paper withBorder shadow="md" p={30} radius="md">
          <Title order={2} mb="lg" ta="center">
            Add New Vendor
          </Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              <TextInput
                label="Vendor Email"
                placeholder="vendor@example.com"
                required
                {...form.getInputProps('email')}
              />
              <Checkbox
                label="Approved"
                {...form.getInputProps('approved', { type: 'checkbox' })}
              />
              <Button type="submit" fullWidth mt="xl" color="indigo">
                Add Vendor
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </div>
  )
}
