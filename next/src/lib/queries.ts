import { partyUsers, parties, Db } from './drizzle'
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
        },
      },
      partyUsers: {
        columns: {
          isAdmin: true,
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
    })),
  }

  return party
}

export async function isMember(
  db: Db,
  partyId: string,
  userId: string,
): Promise<boolean> {
  const row = await db.query.partyUsers.findFirst({
    where: and(eq(partyUsers.partyId, partyId), eq(partyUsers.userId, userId)),
  })

  return !!row
}
