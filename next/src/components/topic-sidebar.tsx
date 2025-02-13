import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Topic } from '@/lib/types'
import Link from 'next/link'
import { PartySelector } from './party-selector'
import { TopicDialog } from './topic-dialog'
import { auth } from '@clerk/nextjs/server'

export async function TopicSidebar({
  partyId,
  topicId,
  topics,
}: {
  partyId: string
  topicId?: string
  topics: Topic[]
}) {
  const userId = (await auth()).userId!

  return (
    <Sidebar side="left">
      <SidebarHeader>
        <PartySelector partyId={partyId} userId={userId} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Topics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {topics.map((topic) => (
                <SidebarMenuItem key={topic.id}>
                  <SidebarMenuButton asChild isActive={topic.id === topicId}>
                    <Link href={`/topics/${partyId}/${topic.id}`}>
                      {topic.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <Dialog>
                <DialogTrigger asChild>
                  <SidebarMenuButton>Add new</SidebarMenuButton>
                </DialogTrigger>
                <TopicDialog partyId={partyId} />
              </Dialog>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
