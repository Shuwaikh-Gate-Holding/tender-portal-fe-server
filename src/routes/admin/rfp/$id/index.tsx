import BaseNavbar from '#/components/BaseNavbar'
import CustomButton from '#/components/CustomButton'
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  Loader
} from '@mantine/core'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Calendar, FileText } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchBids, fetchRfpDetail, updateRfpStatusAction } from './server'

export const Route = createFileRoute('/admin/rfp/$id/')({
  component: AdminRfpDetail,
})

function AdminRfpDetail() {
  const { id } = Route.useParams()
  const router = useRouter()

  // Poll for RFP details
  const { data: rfp, isLoading: loadingRfp, refetch } = useQuery({
    queryKey: ['adminRfpDetail', id],
    queryFn: () => fetchRfpDetail({ data: { id } }),
  })

  // Poll for bids (5s interval)
  const { data: bids = [], refetch: refetchBids } = useQuery({
    queryKey: ['adminBids', id],
    queryFn: () => fetchBids({ data: { id } }),
    refetchInterval: rfp?.status === 'open' ? 5000 : false,
    enabled: !!rfp,
  })

  const updateStatus = async (newStatus: string) => {
    try {
      await updateRfpStatusAction({ data: { id, status: newStatus } })
      refetch()
      refetchBids()
    } catch (error: any) {
      alert('Error updating status: ' + error.message)
    }
  }

  const exportBids = () => {
    if (bids.length === 0) {
      alert('No bids to export')
      return
    }

    // Create CSV content
    const headers = [
      'Vendor Email',
      'Bid Amount (KWD)',
      'Date & Time',
      'Comments',
      'Attachment Links',
    ]
    const rows = bids.map((bid) => [
      bid.vendor_email,
      bid.amount.toString(),
      new Date(bid.created_at).toLocaleString('en-US', {
        timeZone: 'Asia/Kuwait',
      }),
      bid.comments || '',
      bid.attachment_url || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${rfp?.title.replace(/\s+/g, '_')}_bids.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'green'
      case 'draft':
        return 'gray'
      case 'closed':
        return 'red'
      default:
        return 'blue'
    }
  }

  if (loadingRfp || !rfp) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="RFP Details"
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
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Stack gap="lg">
              <Paper withBorder shadow="sm" radius="md" p="xl">
                <Group justify="space-between" align="flex-start" mb="md">
                  <Box>
                    <Title order={2} mb="xs">
                      {rfp.title}
                    </Title>
                    <Badge color={getStatusColor(rfp.status)} variant="filled">
                      {rfp.status}
                    </Badge>
                  </Box>
                </Group>

                <Text style={{ whiteSpace: 'pre-wrap' }} c="gray.7" lh={1.6}>
                  {rfp.description}
                </Text>

                {rfp.attachment_url && (
                  <Alert
                    mt="xl"
                    variant="light"
                    color="blue"
                    title="RFP Attachment"
                    icon={<FileText size={18} />}
                  >
                    <Anchor
                      href={rfp.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      fw={500}
                    >
                      View RFP Document
                    </Anchor>
                  </Alert>
                )}
              </Paper>

              <Paper withBorder shadow="sm" radius="md">
                <Box p="lg" style={{ borderBottom: '1px solid #eee' }}>
                  <Title order={4}>Bids Received ({bids.length})</Title>
                </Box>

                <Box p="0">
                  {bids.length === 0 ? (
                    <Text ta="center" py="xl" c="dimmed">
                      No bids submitted yet.
                    </Text>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {bids.map((bid, index) => (
                        <Box key={bid.id} p="lg">
                          <Group justify="space-between" align="flex-start">
                            <Box>
                              <Text fw={700} size="md">
                                {bid.vendor_email}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {new Date(bid.created_at).toLocaleString()}
                              </Text>
                            </Box>
                            <Box ta="right">
                              <Text fw={800} size="lg" c="indigo">
                                {bid.amount.toLocaleString()} KWD
                              </Text>
                              {index === 0 && (
                                <Badge size="xs" color="green" variant="light">
                                  Lowest Bid
                                </Badge>
                              )}
                            </Box>
                          </Group>

                          {bid.comments && (
                            <Paper withBorder p="xs" mt="sm" radius="sm" bg="gray.0">
                              <Text size="xs" fw={700} c="dimmed" mb={4}>
                                COMMENTS:
                              </Text>
                              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                                {bid.comments}
                              </Text>
                            </Paper>
                          )}

                          {bid.attachment_url && (
                            <Box mt="sm">
                              <Text size="xs" fw={700} c="dimmed" mb={4}>
                                ATTACHMENTS:
                              </Text>
                              <Group gap="xs">
                                {bid.attachment_url.split(',').map((url, idx) => (
                                  <Anchor
                                    key={idx}
                                    href={url.trim()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="sm"
                                    display="flex"
                                    style={{ alignItems: 'center', gap: '4px' }}
                                  >
                                    <FileText size={14} />
                                    File {idx + 1}
                                  </Anchor>
                                ))}
                              </Group>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </div>
                  )}
                </Box>
              </Paper>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Stack gap="lg">
              <Paper withBorder shadow="sm" radius="md" p="xl">
                <Title order={4} mb="md">
                  Timeline (Kuwait Time)
                </Title>
                <Stack gap="md">
                  <Group gap="xs">
                    <Calendar size={18} className="text-gray-400" />
                    <Box>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        Opens
                      </Text>
                      <Text fw={500} size="sm">
                        {new Date(rfp.starts_at).toLocaleString('en-US', {
                          timeZone: 'Asia/Kuwait',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                  </Group>

                  <Group gap="xs">
                    <Calendar size={18} className="text-gray-400" />
                    <Box>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        Closes
                      </Text>
                      <Text fw={500} size="sm">
                        {new Date(rfp.ends_at).toLocaleString('en-US', {
                          timeZone: 'Asia/Kuwait',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                  </Group>

                  <Group gap="xs">
                    <Box>
                      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                        Minimum Decrement
                      </Text>
                      <Text fw={500} size="sm">
                        {rfp.minimum_decrement} KWD
                      </Text>
                    </Box>
                  </Group>
                </Stack>
              </Paper>

              <Paper withBorder shadow="sm" radius="md" p="xl">
                <Title order={4} mb="md">
                  Actions
                </Title>
                <Stack gap="sm">
                  {rfp.status === 'draft' && (
                    <Button
                      color="green"
                      onClick={() => updateStatus('open')}
                      fullWidth
                    >
                      Publish RFP
                    </Button>
                  )}
                  {rfp.status === 'open' && (
                    <>
                      <Button
                        color="yellow"
                        onClick={() => updateStatus('draft')}
                        fullWidth
                      >
                        Unpublish RFP
                      </Button>
                      <Button
                        color="red"
                        onClick={() => updateStatus('closed')}
                        fullWidth
                      >
                        Close RFP
                      </Button>
                    </>
                  )}
                  {rfp.status === 'draft' && (
                    <Button
                      variant="outline"
                      color="blue"
                      onClick={() => router.navigate({
                        to: '/admin/rfp/$id/edit',
                        params: { id: rfp.id }
                      })}
                      fullWidth
                    >
                      Edit RFP
                    </Button>
                  )}
                  <Button
                    variant="light"
                    color="gray"
                    onClick={exportBids}
                    fullWidth
                  >
                    Export Bids
                  </Button>
                </Stack>
              </Paper>
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </div>
  )
}

export default AdminRfpDetail
