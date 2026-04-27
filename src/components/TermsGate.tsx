import { Button, Checkbox, Stack } from '@mantine/core'
import React, { useState } from 'react'
import { acceptRfpTermsAction } from '../server/rfp-actions'

interface TermsGateProps {
  rfpId: string
  onAccepted: () => void
}

const TermsGate: React.FC<TermsGateProps> = ({ rfpId, onAccepted }) => {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      await acceptRfpTermsAction({ data: { rfpId } })
      onAccepted()
    } catch (error: any) {
      console.error('[TERMS] Error accepting terms:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack gap="md" align="center">
      <Checkbox
        label="I have read and agree to all terms and conditions"
        checked={agreed}
        onChange={(e) => setAgreed(e.currentTarget.checked)}
        size="sm"
      />
      <Button
        onClick={handleAccept}
        disabled={!agreed}
        loading={loading}
        color="indigo"
        fullWidth
      >
        Accept Terms & Participate
      </Button>
    </Stack>
  )
}

export default TermsGate
