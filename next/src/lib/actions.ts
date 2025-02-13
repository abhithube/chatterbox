'use server'

import { auth } from '@/auth'
import { db as drizzle, parties, partyUsers, topics } from './drizzle'
import { publishPartyCreated, publishTopicCreated } from './events'
import { Member, PartyDetails, Topic } from './types'
import { nanoid } from 'nanoid'
import { isMember } from './queries'

type CreateParty = {
  title: string
}

export async function createParty(data: CreateParty) {
  const user = (await auth())!.user!

  const topic: Topic = {
    id: nanoid(),
    title: 'general',
  }

  const member: Member = {
    id: user.id!,
    name: user.name!,
    image: user.image!,
    isAdmin: true,
  }

  const party: PartyDetails = {
    id: nanoid(),
    title: data.title,
    topics: [topic],
    members: [member],
  }

  await drizzle.transaction(async (tx) => {
    await tx.insert(parties).values({
      id: party.id,
      title: party.title,
    })

    await tx.insert(partyUsers).values({
      partyId: party.id,
      userId: member.id,
      isAdmin: member.isAdmin,
    })

    await tx.insert(topics).values({
      id: topic.id,
      title: topic.title,
      partyId: party.id,
    })

    await publishPartyCreated(party)
  })
}

type CreateTopic = {
  title: string
  partyId: string
}

export async function createTopic(data: CreateTopic) {
  const user = (await auth())!.user!

  const topic: Topic = {
    id: nanoid(),
    title: data.title,
  }

  await drizzle.transaction(async (tx) => {
    if (!(await isMember(tx, data.partyId, user.id!))) {
      return tx.rollback()
    }

    await drizzle.insert(topics).values({
      id: topic.id,
      title: topic.title,
      partyId: data.partyId,
    })

    await publishTopicCreated(data.partyId, topic)
  })
}
