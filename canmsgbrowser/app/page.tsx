"use client"

import React, { Suspense, useEffect, useState, useContext } from "react"
import { useSearchParams } from "next/navigation" // Import useSearchParams
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { CanMsgV2, CanMsgJsonFileV2, NetFieldV2, CanPointV2 } from "@/types/datatypes"
import { Overview } from "./overview"
import { Detail } from "./detail"
import { GlobalDataContext, fetchGitHubContentV3, GlobalStateContext, GlobalState } from "./data"
import { RenderPageEnum } from "./data"
import { SourceMode, DEFAULT_BRANCH } from "@/types/datatypes"

const Settings = () => <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">Settings Content</div>
const Profile = () => <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">Profile Content</div>

const PageContent = () => {

  
  const searchParams = useSearchParams()
  const branchParam = searchParams.get("branch") || DEFAULT_BRANCH
  const [globalData, setGlobalData] = useState<CanMsgJsonFileV2[]>([]) // Updated to V2

  // Initialize activeState at the component level
  const [globalState, setGlobalState] = useState<GlobalState>({
    activePage: RenderPageEnum.Overview,
    activeFile: null,
    dataSource: SourceMode.GitHub, // Default data source
    selectedBranch: branchParam, // Add selectedBranch to globalState
  });

  // console.log("PageContent Render - Current State:", {
  //   activePage: globalState.activePage,
  //   hasActiveFile: !!globalState.activeFile,
  //   selectedBranch: globalState.selectedBranch,
  // });

  const renderContent = () => {
    switch (globalState.activePage) {
      case RenderPageEnum.Overview:
        return <Overview />
      case RenderPageEnum.Settings:
        return <Settings />
      case RenderPageEnum.Profile:
        return <Profile />
      case RenderPageEnum.Details:
        if (globalState.activeFile) {
          return <Detail /> // Ensure Detail component accepts CanMsgJsonFileV2
        }
        return <div>File not selected</div>
      default:
        return <Overview />
    }
  }

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
  }, [globalState.selectedBranch]) // Dependency triggers fetch on selectedBranch change

  useEffect(() => {
    console.log("Active State Updated:", globalState) // Enhanced debugging log
  }, [globalState])

  return (
    <GlobalDataContext.Provider value={{ globalData, setGlobalData }}>
      <GlobalStateContext.Provider value={{ globalState, setGlobalState }}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#" className="font-bold">{globalState.activePage}</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-4">
              {renderContent()}
            </div>
          </SidebarInset>
        </SidebarProvider>
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