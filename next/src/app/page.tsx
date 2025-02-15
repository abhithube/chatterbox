import { Chat } from '@/components/chat'
import { MessageFeed } from '@/components/message-feed'
import { TopicSidebar } from '@/components/topic-sidebar'
import { db } from '@/lib/drizzle'
import { getParty, selectPartyUser } from '@/lib/queries'
import { SocketProvider } from '@/lib/socket'
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

const PARTY_ID = '1'
const TOPIC_ID = '2'

export default async function Page() {
  const userId = (await auth()).userId!

  const partyUser = await selectPartyUser(db, PARTY_ID, userId)
  if (!partyUser) {
    notFound()
  }

  const party = await getParty(db, PARTY_ID)
  if (!party) {
    notFound()
  }

  const topic = party.topics.find((topic) => topic.id === TOPIC_ID)
  if (!topic) {
    notFound()
  }

  return (
    <ClerkProvider>
      <SocketProvider>
        <Chat
          party={party}
          topic={topic}
          topicsSidebar={
            <TopicSidebar
              partyId={party.id}
              topics={party.topics}
              topicId={topic.id}
            />
          }
          messageFeed={<MessageFeed topic={topic} />}
        />
      </SocketProvider>
    </ClerkProvider>
  )
}
