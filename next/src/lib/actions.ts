'use server'

import {
  db,
  MessageCreate,
  messages,
  parties,
  PartyCreate,
  partyUsers,
  TopicCreate,
  topics,
  users,
} from './drizzle'
import {
  publishMemberCreated,
  publishPartyCreated,
  publishTopicCreated,
  publishUserCreated,
} from './events'
import { Message, PartyDetails, Topic, User } from './types'
import { nanoid } from 'nanoid'
import { selectPartyUser, selectTopic } from './queries'
import { auth, currentUser, UserJSON } from '@clerk/nextjs/server'

export async function createUser(data: UserJSON): Promise<User> {
  const email = data.email_addresses[0].email_address

  const user = await db.transaction(async (tx) => {
    const [userRow] = await tx
      .insert(users)
      .values({
        id: data.id,
        name:
          (data.first_name ?? '') +
          (data.last_name ? ` ${data.last_name}` : ''),
        image: data.image_url,
      })
      .returning()

    await publishUserCreated({
      ...userRow,
      email,
    })

    const user: User = {
      id: userRow.id,
      email,
      name: userRow.name,
      image: userRow.image,
    }

    return user
  })

  return user
}

export async function createParty(data: PartyCreate): Promise<PartyDetails> {
  const user = (await currentUser())!

  const party = await db.transaction(async (tx) => {
    const [partyRow] = await tx
      .insert(parties)
      .values({
        id: nanoid(),
        title: data.title,
      })
      .returning()

    const [partyUserRow] = await tx
      .insert(partyUsers)
      .values({
        partyId: partyRow.id,
        userId: user.id,
        isAdmin: true,
      })
      .returning()

    const [topicRow] = await tx
      .insert(topics)
      .values({
        id: nanoid(),
        title: 'general',
        partyId: partyRow.id,
      })
      .returning()

    await publishPartyCreated(partyRow)

    await publishMemberCreated(partyUserRow)

    await publishTopicCreated(topicRow)

    const party: PartyDetails = {
      id: partyRow.id,
      title: partyRow.title,
      topics: [
        {
          id: topicRow.id,
          title: topicRow.title,
        },
      ],
      members: [
        {
          id: partyUserRow.userId,
          name: user.fullName!,
          image: user.imageUrl,
          isAdmin: partyUserRow.isAdmin,
        },
      ],
    }

    return party
  })

  return party
}

export async function createTopic(data: TopicCreate): Promise<Topic> {
  const userId = (await auth()).userId!

  const topic = await db.transaction(async (tx) => {
    const partyUserRow = await selectPartyUser(tx, data.partyId, userId)
    if (!partyUserRow) {
      return tx.rollback()
    }

    const [topicRow] = await tx
      .insert(topics)
      .values({
        id: nanoid(),
        title: data.title,
        partyId: data.partyId,
      })
      .returning()

    await publishTopicCreated(topicRow)

    const topic: Topic = {
      id: topicRow.id,
      title: topicRow.title,
    }

    return topic
  })

  return topic
}

export async function createMessage(data: MessageCreate): Promise<Message> {
  const user = (await currentUser())!

  const message = await db.transaction(async (tx) => {
    const topicRow = await selectTopic(tx, data.topicId)
    if (!topicRow) {
      return tx.rollback()
    }

    const partyUserRow = await selectPartyUser(tx, topicRow.partyId, user.id)
    if (!partyUserRow) {
      return tx.rollback()
    }

    const [messageRow] = await tx
      .insert(messages)
      .values({
        id: nanoid(),
        content: data.content,
        topicId: topicRow.id,
        userId: partyUserRow.userId,
      })
      .returning()

    const message: Message = {
      id: messageRow.id,
      content: messageRow.content,
      createdAt: messageRow.createdAt.toUTCString(),
      author: {
        id: messageRow.userId,
        name: user.fullName!,
        image: user.imageUrl,
      },
    }

    return message
  })

  return message
}
