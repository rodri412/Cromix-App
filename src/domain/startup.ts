export function startupPrepared({ ready, waitingForProfile, needsEnvelope, envelopeLoaded, envelopeError }: { ready: boolean; waitingForProfile: boolean; needsEnvelope: boolean; envelopeLoaded: boolean; envelopeError: boolean }) {
  return ready && !waitingForProfile && (!needsEnvelope || envelopeLoaded || envelopeError);
}
