import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BallotScreen } from '@/pages/voter/VotingPage'

const election = { name: 'Test Election' }

const posts = [
  {
    id: 1,
    title: 'President',
    candidates: [
      { id: 10, user: { name: 'Alice', designation: 'CEO' }, bio: '' },
      { id: 11, user: { name: 'Bob', designation: 'CTO' }, bio: '' },
    ],
  },
  {
    id: 2,
    title: 'Secretary',
    candidates: [
      { id: 20, user: { name: 'Charlie', designation: 'CFO' }, bio: '' },
      { id: 21, user: { name: 'Dana', designation: 'COO' }, bio: '' },
    ],
  },
]

describe('BallotScreen', () => {
  it('disables Review button when not all posts are answered', () => {
    render(
      <BallotScreen
        election={election}
        posts={posts}
        loading={false}
        ballot={{}}
        setBallot={() => {}}
        onBack={() => {}}
        onReview={() => {}}
      />
    )

    const btn = screen.getByRole('button', { name: /review selections/i })
    expect(btn).toBeDisabled()
  })

  it('enables Review button when all posts are answered', () => {
    const ballot = {
      1: { candidateId: 10, candidateName: 'Alice', postTitle: 'President' },
      2: { candidateId: 20, candidateName: 'Charlie', postTitle: 'Secretary' },
    }

    render(
      <BallotScreen
        election={election}
        posts={posts}
        loading={false}
        ballot={ballot}
        setBallot={() => {}}
        onBack={() => {}}
        onReview={() => {}}
      />
    )

    const btn = screen.getByRole('button', { name: /review selections/i })
    expect(btn).toBeEnabled()
  })

  it('calls setBallot when a candidate is selected', () => {
    const setBallot = vi.fn()

    render(
      <BallotScreen
        election={election}
        posts={posts}
        loading={false}
        ballot={{}}
        setBallot={setBallot}
        onBack={() => {}}
        onReview={() => {}}
      />
    )

    // Click the radio for Alice
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[0])

    expect(setBallot).toHaveBeenCalled()
  })

  it('renders all posts and candidates', () => {
    render(
      <BallotScreen
        election={election}
        posts={posts}
        loading={false}
        ballot={{}}
        setBallot={() => {}}
        onBack={() => {}}
        onReview={() => {}}
      />
    )

    expect(screen.getByText('President')).toBeInTheDocument()
    expect(screen.getByText('Secretary')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    expect(screen.getByText('Dana')).toBeInTheDocument()
  })
})
