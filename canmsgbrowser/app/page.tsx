"use client"

import React, { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

import { CanMsgJsonFileV2, SourceMode, DEFAULT_BRANCH } from "@/types/datatypes"
import { Browse } from "./detail"
import { GlobalDataContext, GlobalStateContext, GlobalState, fetchGitHubContentV3 } from "./data"

const PageContent = () => {
  const searchParams = useSearchParams()
  const branchParam = searchParams.get("branch") || DEFAULT_BRANCH
  const [globalData, setGlobalData] = useState<CanMsgJsonFileV2[]>([])

  const [globalState, setGlobalState] = useState<GlobalState>({
    dataSource: SourceMode.GitHub,
    selectedBranch: branchParam,
    searchQuery: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchGitHubContentV3(globalState.selectedBranch ?? DEFAULT_BRANCH) as CanMsgJsonFileV2[]
        setGlobalData(data)
      } catch (error) {
        console.error(`Error fetching data for branch ${globalState.selectedBranch}:`, error)
      }
    }
    fetchData()
  }, [globalState.selectedBranch])

  return (
    <GlobalDataContext.Provider value={{ globalData, setGlobalData }}>
      <GlobalStateContext.Provider value={{ globalState, setGlobalState }}>
        <TooltipProvider delayDuration={150}>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#" className="font-bold">CAN Messages</BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <Browse />
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </GlobalStateContext.Provider>
    </GlobalDataContext.Provider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  )
}
