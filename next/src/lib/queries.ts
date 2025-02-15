import {
  partyUsers,
  parties,
  Db,
  topics,
  PartyUserRow,
  TopicRow,
} from './drizzle'
import { Party, PartyDetails } from './types'
import { and, eq, exists } from 'drizzle-orm'

export async function getParties(db: Db, userId: string): Promise<Party[]> {
  const rows = await db
    .select({
      id: parties.id,
      title: parties.title,
    })
    .from(parties)
    .where(
      exists(
        db
          .select()
          .from(partyUsers)
          .where(
            and(
              eq(partyUsers.partyId, parties.id),
              eq(partyUsers.userId, userId),
            ),
          ),
      ),
    )

  return rows
}

export async function getParty(
  db: Db,
  id: string,
): Promise<PartyDetails | null> {
  const row = await db.query.parties.findFirst({
    columns: {
      id: true,
      title: true,
    },
    with: {
      topics: {
        columns: {
          id: true,
          title: true,
          partyId: true,
        },
      },
      partyUsers: {
        columns: {
          isAdmin: true,
          partyId: true,
        },
        with: {
          user: true,
        },
      },
    },
    where: eq(parties.id, id),
  })
  if (!row) return null

  const party: PartyDetails = {
    id: row.id,
    title: row.title,
    topics: row.topics.map((row) => ({
      id: row.id,
      title: row.title,
    })),
    members: row.partyUsers.map((row) => ({
      id: row.user.id,
      name: row.user.name,
      image: row.user.image,
      isAdmin: row.isAdmin,
      partyId: row.partyId,
    })),
  }

  return party
}

export async function selectPartyUser(
  db: Db,
  partyId: string,
  userId: string,
): Promise<PartyUserRow | undefined> {
  return db.query.partyUsers.findFirst({
    where: and(eq(partyUsers.partyId, partyId), eq(partyUsers.userId, userId)),
  })
}

export async function selectTopic(
  db: Db,
  id: string,
): Promise<TopicRow | undefined> {
  return db.query.topics.findFirst({
    where: eq(topics.id, id),
  })
}
