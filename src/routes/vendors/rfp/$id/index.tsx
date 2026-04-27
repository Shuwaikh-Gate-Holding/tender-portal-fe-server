import BaseNavbar from '#/components/BaseNavbar'
import CustomButton from '#/components/CustomButton'
import TermsGate from '#/components/TermsGate'
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Calendar, FileText, InfoIcon } from 'lucide-react'
import { useState } from 'react'
import AuctionBoard from './components/AuctionBoard'
import type { RfpTerms } from './server'
import { checkTermsAcceptance, fetchRfpDetail, fetchRfpTerms } from './server'

export const Route = createFileRoute('/vendors/rfp/$id/')({
  component: RfpDetail,
  loader: async ({ params: { id } }) => {
    const [rfp, terms, accepted] = await Promise.all([
      fetchRfpDetail({ data: { id } }),
      fetchRfpTerms({ data: { rfpId: id } }),
      checkTermsAcceptance({ data: { rfpId: id } }),
    ])

    if (!rfp) {
      throw new Error('RFP not found')
    }

    return { rfp, terms, acceptedInitial: accepted }
  },
})

function RfpDetail() {
  const { rfp, terms, acceptedInitial } = Route.useLoaderData()
  const router = useRouter()
  const [accepted, setAccepted] = useState(acceptedInitial)

  const now = new Date()
  const start = new Date(rfp.starts_at)
  const end = new Date(rfp.ends_at)
  const isClosed = rfp.status === 'closed'
  const isUpcoming = rfp.status === 'open' && now < start
  const isActive = rfp.status === 'open' && now >= start && now <= end
  const isEnded = now > end

  const statusInfo = isClosed
    ? { label: 'Closed', color: 'gray' }
    : isActive
      ? { label: 'Active Now', color: 'green' }
      : isUpcoming
        ? { label: 'Upcoming', color: 'yellow' }
        : { label: 'Ended', color: 'gray' }

  return (
    <div className="min-h-screen bg-gray-50">
      <BaseNavbar
        title="Vendor Portal"
        actionButton={
          <CustomButton
            buttonType="secondary"
            onClick={() => router.navigate({ to: '/' })}
          >
            Back to Dashboard
          </CustomButton>
        }
      />

      <Container size="xl" py="xl">
        <Stack gap="lg">
          <Paper withBorder shadow="sm" radius="md" p="xl">
            <Group justify="space-between" align="flex-start" mb="md">
              <Box>
                <Title order={1} mb="xs">
                  {rfp.title}
                </Title>
                <Badge size="lg" color={statusInfo.color} variant="filled">
                  {statusInfo.label}
                </Badge>
              </Box>
            </Group>

            <Divider my="lg" />

            <Grid gap="xl">
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="lg">
                  <Box>
                    <Title order={3} mb="sm">
                      Description
                    </Title>
                    <Text
                      style={{ whiteSpace: 'pre-wrap' }}
                      c="gray.7"
                      lh={1.6}
                    >
                      {rfp.description}
                    </Text>
                  </Box>

                  {rfp.attachment_url && (
                    <Alert
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

                  <Box>
                    <Title order={3} mb="sm">
                      Terms & Conditions
                    </Title>
                    <Paper withBorder p="md" radius="sm" bg="gray.0">
                      <ScrollArea.Autosize mah={300}>
                        {terms.length === 0 ? (
                          <Text c="dimmed" fs="italic">
                            No terms specified for this RFP.
                          </Text>
                        ) : (
                          terms.map((term: RfpTerms) => (
                            <Text
                              key={term.id}
                              mb="sm"
                              size="sm"
                              style={{ whiteSpace: 'pre-wrap' }}
                            >
                              {term.terms_text}
                            </Text>
                          ))
                        )}
                      </ScrollArea.Autosize>
                    </Paper>
                  </Box>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="md">
                  <Paper withBorder p="md" radius="sm" bg="gray.0">
                    <Stack gap="sm">
                      <Group gap="xs">
                        <Calendar size={16} className="text-gray-500" />
                        <Box>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                            Start Date (Kuwait Time)
                          </Text>
                          <Text size="sm" fw={500}>
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
                        <Calendar size={16} className="text-gray-500" />
                        <Box>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                            End Date (Kuwait Time)
                          </Text>
                          <Text size="sm" fw={500}>
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
                          <Text size="sm" fw={500}>
                            {rfp.minimum_decrement} KWD
                          </Text>
                        </Box>
                      </Group>
                      <Group gap="xs">
                        <Box>
                          <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                            Base Amount
                          </Text>
                          <Text size="sm" fw={500}>
                            {rfp.base_amount} KWD
                          </Text>
                        </Box>
                      </Group>
                    </Stack>
                  </Paper>

                  <Box mt="md">
                    {!accepted ? (
                      <Paper withBorder p="xl" radius="md">
                        <Stack align="center" gap="md">
                          <InfoIcon size={32} className="text-indigo-500" />
                          <Text ta="center" fw={500}>
                            Please accept the terms to participate
                          </Text>
                          <TermsGate
                            rfpId={rfp.id}
                            onAccepted={() => setAccepted(true)}
                          />
                        </Stack>
                      </Paper>
                    ) : isClosed ? (
                      <Alert color="gray" title="RFP Closed">
                        This RFP has been closed and is no longer accepting
                        bids.
                      </Alert>
                    ) : isUpcoming ? (
                      <Alert
                        color="yellow"
                        title="Bidding Opens Soon"
                        icon={<InfoIcon />}
                      >
                        Bidding will open on{' '}
                        {new Date(rfp.starts_at).toLocaleString('en-US', {
                          timeZone: 'Asia/Kuwait',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        (Kuwait Time)
                      </Alert>
                    ) : isEnded ? (
                      <Alert color="gray" title="Bidding Period Ended">
                        The bidding period for this RFP has ended.
                      </Alert>
                    ) : (
                      <AuctionBoard rfp={rfp} />
                    )}
                  </Box>
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </Container>
    </div>
  )
}
