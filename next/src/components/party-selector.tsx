import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { getParties } from '@/lib/queries'
import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react'
import Link from 'next/link'
import { redirect, RedirectType } from 'next/navigation'
import { PartyDialog } from './party-dialog'
import { db } from '@/lib/drizzle'

export async function PartySelector({
  partyId,
  userId,
}: {
  partyId: string
  userId: string
}) {
  const parties = await getParties(db, userId)

  const selected = parties.find((party) => party.id === partyId)
  if (!selected) {
    redirect(`/topics${parties[0].id}`, RedirectType.replace)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Party</span>
                  <span className="">{selected.title}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width]"
              align="start"
            >
              {parties.map((party) => (
                <DropdownMenuItem key={party.id} asChild>
                  <Link href={`/topics/${party.id}`}>
                    {party.title}{' '}
                    {party.id === selected.id && <Check className="ml-auto" />}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DialogTrigger asChild>
                <DropdownMenuItem>Add new</DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <PartyDialog />
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
