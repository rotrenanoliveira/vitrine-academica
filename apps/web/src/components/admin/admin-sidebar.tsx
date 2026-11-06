'use client'

import {
  ArrowLeft01Icon,
  Building01Icon,
  DashboardSquare01Icon,
  Folder01Icon,
  Tag01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const sections = [
  { href: '/admin', label: 'Visão geral', icon: DashboardSquare01Icon },
  { href: '/admin#projetos', label: 'Projetos', icon: Folder01Icon },
  { href: '/admin#usuarios', label: 'Usuários', icon: UserGroupIcon },
  { href: '/admin#instituicoes', label: 'Instituições', icon: Building01Icon },
  { href: '/admin#tags', label: 'Tags', icon: Tag01Icon },
]

export function AdminSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <p className="px-2 py-1 font-heading text-lg font-semibold">Vitrine Acadêmica</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Indicadores</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => (
                <SidebarMenuItem key={section.href}>
                  <SidebarMenuButton tooltip={section.label} render={<Link href={section.href} />}>
                    <HugeiconsIcon icon={section.icon} />
                    <span>{section.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Voltar ao site" render={<Link href="/" />}>
              <HugeiconsIcon icon={ArrowLeft01Icon} />
              <span>Voltar ao site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
