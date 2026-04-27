import React, { useEffect, useState } from 'react'
import {
  fetchAuctionTicker,
  fetchBids,
  fetchMyRank,
  placeBidAction,
  checkVendorApproval,
} from '../server'
import type { Bid } from '../server'
import { Route } from '..'
import {
  Stack,
  Text,
  Paper,
  Group,
  TextInput,
  Textarea,
  FileInput,
  Button,
  Badge,
  Alert,
  Title,
  Box,
  Divider,
  Grid,
  Loader,
} from '@mantine/core'
import { Timer, TrendingDown, Award, Info } from 'lucide-react'

interface AuctionBoardProps {
  rfp: {
    id: string
    title: string
    minimum_decrement: number
    ends_at: string
    bid_direction?: string
  }
}

interface Ticker {
  best_bid: number
  seq: number
  last_bid_at: string
}

const AuctionBoard: React.FC<AuctionBoardProps> = ({ rfp }) => {
  const { supabase } = Route.useRouteContext()
  const [ticker, setTicker] = useState<Ticker | null>(null)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [myBid, setMyBid] = useState('')
  const [bidComments, setBidComments] = useState('')
  const [bidFiles, setBidFiles] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [allBids, setAllBids] = useState<Bid[]>([])
  const [isApproved, setIsApproved] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const isAuctionEnded = new Date().getTime() >= new Date(rfp.ends_at).getTime()

  // Check vendor approval status
  useEffect(() => {
    const checkApproval = async () => {
      const approved = await checkVendorApproval()
      setIsApproved(approved)
      setLoading(false)
    }
    checkApproval()
  }, [])

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const endTime = new Date(rfp.ends_at).getTime()
      const distance = endTime - now

      if (distance < 0) {
        setTimeRemaining('Auction ended')
        return
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      )
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [rfp.ends_at])

  // Subscribe to ticker updates
  useEffect(() => {
    const loadTicker = async () => {
      const data = await fetchAuctionTicker({ data: { rfpId: rfp.id } })
      if (data) {
        setTicker(data)
      }
    }
    loadTicker()

    const channel = supabase.channel(`ticker-${rfp.id}`)
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'auction_ticker',
          filter: `rfp_id=eq.${rfp.id}`,
        },
        (payload) => {
          console.log('[REALTIME] Ticker update received:', payload)
          const updated = payload.new as any
          setTicker({
            best_bid: updated.current_best_bid,
            seq: updated.bid_count,
            last_bid_at: updated.last_updated,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [rfp.id, supabase])

  // Fetch all bids
  useEffect(() => {
    const loadBids = async () => {
      const data = await fetchBids({ data: { rfpId: rfp.id } })
      setAllBids(data)
    }
    loadBids()

    const channel = supabase.channel(`bids-${rfp.id}`)
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `rfp_id=eq.${rfp.id}`,
        },
        () => {
          loadBids()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [rfp.id, supabase])

  // Fetch my rank
  useEffect(() => {
    const loadRank = async () => {
      const rank = await fetchMyRank({ data: { rfpId: rfp.id } })
      setMyRank(rank)
    }
    loadRank()
  }, [rfp.id, ticker?.seq])

  const handleBid = async () => {
    const now = new Date().getTime()
    const endTime = new Date(rfp.ends_at).getTime()
    if (now >= endTime) {
      setMessage('This auction has ended. No more bids are accepted.')
      return
    }

    const total = parseInt(myBid)
    if (isNaN(total) || total <= 0) {
      setMessage('Please enter a valid whole number bid amount')
      return
    }

    if (rfp.bid_direction === 'reverse' && ticker && ticker.best_bid) {
      const decrement = ticker.best_bid - total
      if (decrement < rfp.minimum_decrement) {
        setMessage(
          `For reverse auctions, your bid must be at least ${rfp.minimum_decrement} KWD less than the current lowest bid of ${ticker.best_bid} KWD`,
        )
        return
      }
    }

    const attachmentUrls: string[] = []
    if (bidFiles.length > 0) {
      setUploading(true)
      setMessage('Uploading files...')

      for (let i = 0; i < bidFiles.length; i++) {
        const file = bidFiles[i]
        setUploadProgress(
          `Uploading ${i + 1} of ${bidFiles.length}: ${file.name}`,
        )

        try {
          const fileExt = file.name.split('.').pop()
          const fileName = `${rfp.id}-${Date.now()}-${i}.${fileExt}`
          const filePath = `bid-attachments/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('rfp-files')
            .upload(filePath, file)

          if (uploadError) {
            setMessage(`Error uploading ${file.name}: ${uploadError.message}`)
            setUploading(false)
            setUploadProgress('')
            return
          }

          const { data: urlData } = supabase.storage
            .from('rfp-files')
            .getPublicUrl(filePath)
          attachmentUrls.push(urlData.publicUrl)
        } catch (err) {
          setMessage(`Error uploading ${file.name}`)
          setUploading(false)
          setUploadProgress('')
          return
        }
      }

      setUploading(false)
      setUploadProgress('')
    }

    setMessage('Submitting bid...')
    try {
      await placeBidAction({
        data: {
          rfpId: rfp.id,
          amount: total,
          comments: bidComments,
          attachmentUrls,
        },
      })
      setMessage('Bid placed successfully!')
      setMyBid('')
      setBidComments('')
      setBidFiles([])
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    )
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={3}>Live Auction</Title>
        <Badge color={isAuctionEnded ? 'red' : 'green'} variant="dot" size="lg">
          {isAuctionEnded ? 'Auction Ended' : 'Live'}
        </Badge>
      </Group>

      {/* Countdown Timer */}
      <Paper
        p="md"
        radius="md"
        bg="indigo.7"
        c="white"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Group gap="xs" mb={4}>
          <Timer size={18} />
          <Text size="sm" fw={500}>
            Time Remaining
          </Text>
        </Group>
        <Text size="xl" fw={800} style={{ fontSize: '2rem' }}>
          {timeRemaining}
        </Text>
      </Paper>

      <Grid grow gap="md">
        <Grid.Col span={6}>
          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb={4}>
              <TrendingDown size={16} className="text-indigo-500" />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Current Lowest Bid
              </Text>
            </Group>
            <Text size="xl" fw={700} c="indigo">
              {ticker ? `${ticker.best_bid.toLocaleString()} KWD` : '--'}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper withBorder p="md" radius="md">
            <Group gap="xs" mb={4}>
              <Award size={16} className="text-indigo-500" />
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                My Rank
              </Text>
            </Group>
            <Text size="xl" fw={700} c="indigo">
              {myRank != null ? `#${myRank}` : '--'}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      {!isApproved ? (
        <Alert
          icon={<Info size={16} />}
          title="Approval Pending"
          color="yellow"
        >
          You need to be approved by an administrator before you can place bids.
        </Alert>
      ) : (
        <Paper withBorder p="md" radius="md" bg="gray.0">
          <Stack gap="md">
            <TextInput
              label="Bid Amount (KWD)"
              placeholder="Enter your bid amount"
              value={myBid}
              onChange={(e) => setMyBid(e.target.value)}
              disabled={isAuctionEnded}
              type="number"
              required
              description={
                ticker
                  ? `Current lowest: ${ticker.best_bid.toLocaleString()} KWD${rfp.bid_direction === 'reverse'
                    ? ` (Must be at least ${rfp.minimum_decrement} KWD less)`
                    : ''
                  }`
                  : 'No bids yet'
              }
            />

            <Textarea
              label="Comments (Optional)"
              placeholder="Add any comments or notes about your bid..."
              value={bidComments}
              onChange={(e) => setBidComments(e.target.value)}
              disabled={isAuctionEnded}
              rows={3}
            />

            <FileInput
              label="Attachments (Optional)"
              placeholder="Upload one or more files"
              multiple
              value={bidFiles}
              onChange={(files) => setBidFiles(files)}
              disabled={uploading || isAuctionEnded}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />

            {uploading && (
              <Alert variant="light" color="blue" title="Uploading Files">
                <Text size="xs">{uploadProgress}</Text>
              </Alert>
            )}

            <Button
              onClick={handleBid}
              disabled={uploading || isAuctionEnded || !myBid}
              loading={uploading}
              fullWidth
              color="indigo"
              size="md"
            >
              {isAuctionEnded ? 'Auction Ended' : 'Place Bid'}
            </Button>

            {message && !uploading && (
              <Text size="sm" c="dimmed" ta="center">
                {message}
              </Text>
            )}
          </Stack>
        </Paper>
      )}

      {/* All Bids */}
      <Paper withBorder p="md" radius="md">
        <Title order={4} mb="md">
          Recent Bids
        </Title>
        <Divider mb="md" />
        {allBids.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            No bids placed yet. Be the first!
          </Text>
        ) : (
          <Box style={{ maxHeight: 300, overflowY: 'auto' }}>
            <Stack gap="xs">
              {allBids.map((bid, index) => (
                <Paper
                  key={bid.id}
                  p="sm"
                  radius="sm"
                  withBorder
                  bg={bid.is_mine ? 'indigo.0' : 'gray.0'}
                  style={{ borderColor: bid.is_mine ? 'indigo.2' : undefined }}
                >
                  <Group justify="space-between">
                    <Group gap="md">
                      <Text fw={700} c="gray.6">
                        #{index + 1}
                      </Text>
                      <Box>
                        <Text fw={700} size="sm">
                          {bid.amount.toLocaleString()} KWD
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(bid.created_at).toLocaleString()}
                        </Text>
                      </Box>
                    </Group>
                    {bid.is_mine && (
                      <Badge size="xs" variant="filled" color="indigo">
                        Your Bid
                      </Badge>
                    )}
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>
    </Stack>
  )
}

export default AuctionBoard
