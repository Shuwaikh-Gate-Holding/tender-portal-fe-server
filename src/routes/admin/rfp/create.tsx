import BaseNavbar from '#/components/BaseNavbar'
import CustomButton from '#/components/CustomButton'
import {
  Alert,
  Box,
  Button,
  FileInput,
  Group,
  NumberInput,
  Paper,
  Radio,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { createRfpAction, fetchCategories } from './server'

export const Route = createFileRoute('/admin/rfp/create')({
  component: RouteComponent,
  loader: async () => {
    return { categories: await fetchCategories() }
  },
})

function RouteComponent() {
  const { categories } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const { supabase } = Route.useRouteContext()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      starts_at: '',
      ends_at: '',
      minimum_decrement: 100,
      terms: '',
      category_id: '',
      bid_direction: 'reverse',
      attachment: null as File | null,
    },
    validate: {
      title: (value) =>
        value.length < 2 ? 'Title must have at least 2 characters' : null,
      description: (value) =>
        value.length < 10
          ? 'Description must have at least 10 characters'
          : null,
      category_id: (value) => (!value ? 'Please select a category' : null),
      starts_at: (value) => (!value ? 'Start date is required' : null),
      ends_at: (value) => (!value ? 'End date is required' : null),
    },
  })

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    setError('')

    try {
      let attachmentUrl = null

      // Upload file to Supabase Storage if selected
      if (values.attachment) {
        const selectedFile = values.attachment
        console.log('[RFP UPLOAD] Starting file upload:', selectedFile.name)
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `rfp-attachments/${fileName}`

        const { data: _, error: uploadError } = await supabase.storage
          .from('rfp-files')
          .upload(filePath, selectedFile)

        if (uploadError) {
          console.error('[RFP UPLOAD] Upload error:', uploadError)
          throw new Error(
            `File upload failed: ${uploadError.message}. Please ensure the 'rfp-files' storage bucket exists in Supabase.`,
          )
        } else {
          const { data: urlData } = supabase.storage
            .from('rfp-files')
            .getPublicUrl(filePath)
          attachmentUrl = urlData.publicUrl
        }
      }

      // Convert datetime-local values to Kuwait timezone ISO strings
      const startsAtKuwait = values.starts_at
        ? `${values.starts_at}:00+03:00`
        : null
      const endsAtKuwait = values.ends_at ? `${values.ends_at}:00+03:00` : null

      const rfpData: any = {
        title: values.title,
        description: values.description,
        starts_at: startsAtKuwait,
        ends_at: endsAtKuwait,
        minimum_decrement: values.minimum_decrement,
        category_id: values.category_id ? parseInt(values.category_id) : null,
        bid_direction: values.bid_direction,
        status: 'draft',
        terms: values.terms,
      }

      if (attachmentUrl) {
        rfpData.attachment_url = attachmentUrl
      }

      await createRfpAction({ data: rfpData })

      navigate({ to: '/admin' })
    } catch (err: any) {
      setError(err.message || 'Failed to create RFP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="Create New RFP"
        actionButton={
          <CustomButton
            buttonType="secondary"
            onClick={() => navigate({ to: '/admin' })}
          >
            Back to Dashboard
          </CustomButton>
        }
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Paper shadow="sm" p="xl" radius="md">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="RFP Title"
                placeholder="e.g., Office Furniture Supply Contract"
                required
                {...form.getInputProps('title')}
              />

              <Textarea
                label="Description"
                placeholder="Provide detailed requirements and specifications..."
                required
                rows={6}
                {...form.getInputProps('description')}
              />

              <Select
                label="Category"
                placeholder="Select a category"
                required
                data={categories.map((cat: any) => ({
                  value: cat.id.toString(),
                  label: cat.name,
                }))}
                {...form.getInputProps('category_id')}
                description="Only vendors assigned to this category will see this RFP"
              />

              <Group grow>
                <TextInput
                  type="datetime-local"
                  label="Start Date & Time (Kuwait Time - GMT+3)"
                  required
                  {...form.getInputProps('starts_at')}
                  description="Enter time in Kuwait timezone"
                />

                <TextInput
                  type="datetime-local"
                  label="End Date & Time (Kuwait Time - GMT+3)"
                  required
                  {...form.getInputProps('ends_at')}
                  description="Enter time in Kuwait timezone"
                />
              </Group>

              <NumberInput
                label="Minimum Bid Decrement (KWD)"
                min={1}
                required
                {...form.getInputProps('minimum_decrement')}
              />

              <Radio.Group
                label="Auction Type"
                required
                {...form.getInputProps('bid_direction')}
              >
                <Stack gap="xs" mt="xs">
                  <Radio
                    value="reverse"
                    label={
                      <Box>
                        <Text size="sm" fw={500}>
                          Reverse Auction (Lowest Wins)
                        </Text>
                        <Text size="xs" c="dimmed">
                          Vendors must bid lower than the current lowest bid
                        </Text>
                      </Box>
                    }
                  />
                  <Radio
                    value="forward"
                    label={
                      <Box>
                        <Text size="sm" fw={500}>
                          Open Auction (Lowest Wins)
                        </Text>
                        <Text size="xs" c="dimmed">
                          Vendors can bid any amount (lower, equal, or higher) -
                          Ranking by lowest bid
                        </Text>
                      </Box>
                    }
                  />
                </Stack>
              </Radio.Group>

              <Textarea
                label="Terms and Conditions"
                placeholder="Enter the terms and conditions that vendors must accept before bidding..."
                required
                rows={6}
                {...form.getInputProps('terms')}
                description="Vendors must read and accept these terms before they can place bids"
              />

              <FileInput
                label="Attachment (Optional)"
                placeholder="Upload file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                {...form.getInputProps('attachment')}
              />

              {error && (
                <Alert color="red" title="Error" radius="md">
                  {error}
                </Alert>
              )}

              <Group mt="xl">
                <Button
                  type="submit"
                  loading={loading}
                  size="md"
                  className="flex-1"
                  color="indigo"
                >
                  Create RFP
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/admin' })}
                  size="md"
                  color="gray"
                >
                  Cancel
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </div>
    </div>
  )
}
