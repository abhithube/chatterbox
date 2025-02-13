import { Chat } from '@/components/chat'
import { MessageFeed } from '@/components/message-feed'
import { TopicSidebar } from '@/components/topic-sidebar'
import { db } from '@/lib/drizzle'
import { getParty, isMember } from '@/lib/queries'
import { SocketProvider } from '@/lib/socket'
import { ClerkProvider } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

const PARTY_ID = 'ec49e442-da01-4e22-8012-c4a0e0625a9a'
const TOPIC_ID = '99fa190b-52de-4e37-a8da-d8cf78cbbacf'

export default async function Page() {
  const userId = (await auth()).userId!

  if (!(await isMember(db, PARTY_ID, userId))) {
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
