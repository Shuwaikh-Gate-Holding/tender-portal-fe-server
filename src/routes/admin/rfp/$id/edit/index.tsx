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
  Anchor,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { fetchCategories, uploadRfpFiles } from '../../server'
import { fetchRfpForEdit, updateRfpAction } from './server'
import { getKuwaitDateTimeInputValue } from '#/utils/timezone'

export const Route = createFileRoute('/admin/rfp/$id/edit/')({
  component: EditRfp,
  loader: async ({ params: { id } }) => {
    const [categories, { rfp, terms }] = await Promise.all([
      fetchCategories(),
      fetchRfpForEdit({ data: { id } }),
    ])

    return { categories, rfp, terms }
  },
})

function EditRfp() {
  const { categories, rfp, terms } = Route.useLoaderData()
  const { id } = Route.useParams()
  const navigate = Route.useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm({
    initialValues: {
      title: rfp.title || '',
      description: rfp.description || '',
      starts_at: rfp.starts_at ? getKuwaitDateTimeInputValue(rfp.starts_at) : '',
      ends_at: rfp.ends_at ? getKuwaitDateTimeInputValue(rfp.ends_at) : '',
      minimum_decrement: rfp.minimum_decrement || 100,
      base_amount: rfp.base_amount || 0,
      terms: terms || '',
      category_id: rfp.category_id ? rfp.category_id.toString() : '',
      bid_direction: rfp.bid_direction || 'reverse',
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
      let attachmentUrl = rfp.attachment_url

      // Upload file to Supabase Storage if a new one is selected
      if (values.attachment) {
        const selectedFile = values.attachment
        console.log('[RFP UPLOAD] Starting file upload:', selectedFile.name)
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `rfp-attachments/${fileName}`

        const formdata = new FormData()
        formdata.append('filePath', filePath)
        formdata.append('selectedFile', selectedFile)

        // @ts-ignore
        const result = await uploadRfpFiles(formdata)
        attachmentUrl = result?.attachmentUrl
      }

      // Convert datetime-local values to Kuwait timezone ISO strings
      const startsAtKuwait = values.starts_at
        ? `${values.starts_at}:00+03:00`
        : null
      const endsAtKuwait = values.ends_at ? `${values.ends_at}:00+03:00` : null

      const updateData: any = {
        id,
        title: values.title,
        description: values.description,
        starts_at: startsAtKuwait,
        ends_at: endsAtKuwait,
        minimum_decrement: values.minimum_decrement,
        base_amount: values.base_amount,
        category_id: values.category_id ? parseInt(values.category_id) : null,
        bid_direction: values.bid_direction,
        terms: values.terms,
        attachment_url: attachmentUrl,
      }

      await updateRfpAction({ data: updateData })

      navigate({ to: '/admin/rfp/$id', params: { id } })
    } catch (err: any) {
      setError(err.message || 'Failed to update RFP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="Edit RFP"
        actionButton={
          <CustomButton
            buttonType="secondary"
            onClick={() => navigate({ to: '/admin/rfp/$id', params: { id } })}
          >
            Cancel
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
              <NumberInput
                label="Base Amount (KWD)"
                min={0}
                required
                {...form.getInputProps('base_amount')}
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

              <Box>
                <FileInput
                  label="Attachment"
                  placeholder={rfp.attachment_url ? "Change attachment" : "Upload file"}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  {...form.getInputProps('attachment')}
                />
                {rfp.attachment_url && !form.values.attachment && (
                  <Text size="xs" mt={4} c="dimmed">
                    Current attachment: <Anchor href={rfp.attachment_url} target="_blank" size="xs">View File</Anchor>
                  </Text>
                )}
                <Text size="xs" mt={4} c="dimmed">
                  Leave empty to keep current attachment, or select a new file to replace it
                </Text>
              </Box>

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
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate({ to: '/admin/rfp/$id', params: { id } })}
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
