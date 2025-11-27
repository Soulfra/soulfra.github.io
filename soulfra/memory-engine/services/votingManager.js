// /memory-engine/services/votingManager.js

export async function initializeVote(ritualId) {
  if (!ritualId) {
    throw new Error('Missing ritualId to initialize vote.');
  }

  return {
    ritualId,
    votesFor: 0,
    votesAgainst: 0
  };
}

export async function castVote(voteRecord, direction) {
  if (!voteRecord || (direction !== 'for' && direction !== 'against')) {
    throw new Error('Invalid vote record or direction.');
  }

  const updatedVote = { ...voteRecord };

  if (direction === 'for') {
    updatedVote.votesFor += 1;
  } else {
    updatedVote.votesAgainst += 1;
  }

  return updatedVote;
}

export async function resolveVote(voteRecord) {
  if (!voteRecord) {
    throw new Error('Missing vote record to resolve.');
  }

  if (voteRecord.votesFor > voteRecord.votesAgainst) {
    return 'Approved';
  } else if (voteRecord.votesAgainst > voteRecord.votesFor) {
    return 'Rejected';
  } else {
    return 'Tied';
  }
}