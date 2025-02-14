'use server'

import { db as drizzle, parties, partyUsers, topics, users } from './drizzle'
import {
  publishMemberCreated,
  publishPartyCreated,
  publishTopicCreated,
  publishUserCreated,
} from './events'
import { Member, PartyDetails, Topic, User } from './types'
import { nanoid } from 'nanoid'
import { isMember } from './queries'
import { auth, currentUser, UserJSON } from '@clerk/nextjs/server'

export async function createUser(data: UserJSON): Promise<User> {
  const user: User = {
    id: data.id,
    email: data.email_addresses[0].email_address,
    name:
      (data.first_name ?? '') + (data.last_name ? ` ${data.last_name}` : ''),
    image: data.image_url,
  }

  await drizzle.transaction(async (tx) => {
    await tx.insert(users).values({
      id: user.id,
      name: user.name,
      image: user.image,
    })

    await publishUserCreated({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    })
  })

  return user
}

type CreateParty = {
  title: string
}

export async function createParty(data: CreateParty): Promise<PartyDetails> {
  const user = (await currentUser())!

  const topic: Topic = {
    id: nanoid(),
    title: 'general',
  }

  const member: Member = {
    id: user.id,
    name: user.fullName!,
    image: user.imageUrl,
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

    await publishPartyCreated({
      id: party.id,
      title: party.title,
    })

    await publishMemberCreated({
      userId: member.id,
      partyId: party.id,
      isAdmin: member.isAdmin,
    })

    await publishTopicCreated({
      id: topic.id,
      title: topic.title,
      partyId: party.id,
    })
  })

  return party
}

type CreateTopic = {
  title: string
  partyId: string
}

export async function createTopic(data: CreateTopic): Promise<Topic> {
  const userId = (await auth()).userId!

  const topic: Topic = {
    id: nanoid(),
    title: data.title,
  }

  await drizzle.transaction(async (tx) => {
    if (!(await isMember(tx, data.partyId, userId))) {
      return tx.rollback()
    }

    await drizzle.insert(topics).values({
      id: topic.id,
      title: topic.title,
      partyId: data.partyId,
    })

    await publishTopicCreated({
      id: topic.id,
      title: topic.title,
      partyId: data.partyId,
    })
  })

  return topic
}
