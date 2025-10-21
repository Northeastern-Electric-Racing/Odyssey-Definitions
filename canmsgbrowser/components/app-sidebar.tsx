"use client"

import { useSearchParams } from "next/navigation" // Import useSearchParams
import * as React from "react"
import { ChevronRight, File, Folder, Search } from "lucide-react"
import Link from "next/link"
import { useState, createContext, useContext, useEffect } from "react"
import { GlobalDataContext, defaultSections, GlobalStateContext, GlobalState } from "@/app/data"
import { RenderPageEnum } from "@/app/data"
import { fetchGitHubContentV3 } from "@/app/data"
import { CanMsgJsonFileV2, DEFAULT_BRANCH, SourceMode } from "@/types/datatypes"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { cn } from "@/lib/utils"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  return (
    <form {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput
            id="search"
            placeholder="Search files..."
            className="pl-8 border-none"
          />
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 select-none opacity-50" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}



// Extracted DataSourcePanel component
function DataSourcePanel({
  sourceMode,
  selectedBranch,
  setSelectedBranch,
  handleFetchFromGitHub,
  setGlobalState,
  isLoading
}: {
  sourceMode: SourceMode;
  selectedBranch: string | null;
  setSelectedBranch: (branch: string) => void;
  handleFetchFromGitHub: () => Promise<void>;
  setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>;
  isLoading: boolean;
}) {
  return (
    <>
      {sourceMode === SourceMode.GitHub ? (
        <div className="space-y-4">
          <input
            type="text"
            value={selectedBranch ?? ""}
            onChange={(e) => setSelectedBranch(e.target.value)}
            placeholder="Enter branch name"
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              handleFetchFromGitHub();
              setGlobalState(prev => ({ ...prev, dataSource: SourceMode.GitHub }));
            }}
            className="w-full h-10 px-4 text-sm font-medium text-white bg-green-600 rounded cursor-pointer hover:bg-green-700"
            disabled={isLoading}
          >
            {isLoading ? "Fetching..." : "Fetch from GitHub"}
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-input"
          className="flex items-center justify-center w-full h-10 px-4 text-sm font-medium text-white bg-blue-600 rounded cursor-pointer hover:bg-blue-700"
        >
          Load Local Files
        </label>
      )}
    </>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const searchParams = useSearchParams()
  const branchParam = searchParams.get("branch") || "main"
  const { globalData, setGlobalData } = useContext(GlobalDataContext)
  const { globalState, setGlobalState } = useContext(GlobalStateContext)
  const [isLoading, setIsLoading] = useState(false) // Add loading state
  const [error, setError] = useState<string | null>(null) // Add error state

  const handleFileSelect = async (event: any) => {
    const files = event.target.files as FileList
    const newAllFiles: CanMsgJsonFileV2[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filename = file.name
      const text = await file.text()
      const json = JSON.parse(text)
      // Assuming json fits CanMsgJsonFileV2 structure
      const fileObject: CanMsgJsonFileV2 = { filename, content: json, is_dirty: false }
      newAllFiles.push(fileObject)
    }
    setGlobalData(newAllFiles) // Update globalData

    // Use the newAllFiles array directly to log filenames
    console.log(newAllFiles.map((msg) => [msg.filename]))
  }

  const handleFetchFromGitHub = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchGitHubContentV3(globalState.selectedBranch ?? DEFAULT_BRANCH) as CanMsgJsonFileV2[] // Use globalState.selectedBranch
      setGlobalData(data)
    } catch (err) {
      setError("Failed to fetch GitHub content.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBranchChange = (newBranch: string) => {
    setGlobalState(prev => ({
      ...prev,
      selectedBranch: newBranch,
      dataSource: SourceMode.GitHub, // Reset dataSource to GitHub on branch change
    }))
  }

  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Data Source</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="p-4">
              <Tabs
                defaultValue={SourceMode.GitHub}
                value={globalState.dataSource}
                onValueChange={(value) => setGlobalState(prev => ({ ...prev, dataSource: value as SourceMode }))}
                className="mb-4"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={SourceMode.GitHub}>GitHub</TabsTrigger>
                  <TabsTrigger value={SourceMode.Local}>Local</TabsTrigger>
                </TabsList>
              </Tabs>

              <DataSourcePanel
                sourceMode={globalState.dataSource}
                selectedBranch={globalState.selectedBranch}
                setSelectedBranch={handleBranchChange} // Update globalState
                handleFetchFromGitHub={handleFetchFromGitHub}
                setGlobalState={setGlobalState}
                isLoading={isLoading}
              />

              {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {defaultSections.sections.map((link, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton onClick={() => {
                    setGlobalState(prev => ({
                      ...prev,
                      activePage: link.name as RenderPageEnum
                    }))
                  }}>
                    <File className="h-4 w-4" />
                    {link.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SearchForm
            className="w-full p-2 mb-2 rounded"
          />
          <SidebarGroupContent>
            <SidebarMenu>
              {globalData.map((item, index) => (
                <Tree key={index} item={item} setGlobalState={setGlobalState} /> // Pass setGlobalState
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}



function Tree({ item, setGlobalState }: { item: CanMsgJsonFileV2, setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>> }) {
  const { filename, content } = item

  // Handles click on a JSON file
  const handleFileClick = () => {
    setGlobalState(prev => ({
      ...prev,
      activeFile: item,
      activePage: RenderPageEnum.Details,
    }));
  };

  // Handles click for a specific Can ID
  const handleItemClick = (item: CanMsgJsonFileV2, a: any) => {
    setGlobalState(prev => ({
      ...prev,
      activeFile: item,
      activePage: RenderPageEnum.Details,
    }));
    window.location.hash = `msg-${a.id}`
  }

  // Ensure content is an array
  const contentArray = Array.isArray(content) ? content : [];

  console.log("Content:", content);
  console.log("Content Array:", contentArray);
  if (!contentArray.length) {
    console.error("Error: Content is not an array or is empty:", typeof content, content);
    throw new Error(`Invalid content: ${typeof content} - ${JSON.stringify(content)}`);
  } else {
    console.log("Content array is not empty, length:", contentArray.length);
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={false}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton onClick={handleFileClick}>
            <ChevronRight className="h-4 w-4 transition-transform" />
            <Folder className="h-4 w-4" />
            {filename}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {contentArray.map((a, index) => (
              <SidebarMenuButton onClick={() => {handleItemClick(item, a)}} key={index} className="truncate" title={`${a.id} - ${a.desc}`}>
                <File />
                <span className="truncate">{a.id} - {a.desc}</span>
              </SidebarMenuButton>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
