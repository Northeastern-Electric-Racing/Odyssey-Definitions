"use client"

import * as React from "react"
import { ChevronRight, File, Folder, Search } from "lucide-react"
import { useState, useContext } from "react"
import { GlobalDataContext, GlobalStateContext, GlobalState, matchesQuery } from "@/app/data"
import { fetchGitHubContentV3 } from "@/app/data"
import { CanMsgJsonFileV2, CanMsgV2, DEFAULT_BRANCH, SourceMode } from "@/types/datatypes"

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

export function SearchForm({
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<"form">, "onChange"> & { value: string; onChange: (v: string) => void }) {
  return (
    <form {...props} onSubmit={(e) => e.preventDefault()}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <SidebarInput
            id="search"
            placeholder="Search id, desc, fields, docs..."
            className="pl-8 border-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 select-none opacity-50" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}

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
  const { globalData, setGlobalData } = useContext(GlobalDataContext)
  const { globalState, setGlobalState } = useContext(GlobalStateContext)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchFromGitHub = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchGitHubContentV3(globalState.selectedBranch ?? DEFAULT_BRANCH) as CanMsgJsonFileV2[]
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
      dataSource: SourceMode.GitHub,
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
                setSelectedBranch={handleBranchChange}
                handleFetchFromGitHub={handleFetchFromGitHub}
                setGlobalState={setGlobalState}
                isLoading={isLoading}
              />

              {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SearchForm
            className="w-full p-2 mb-2 rounded"
            value={globalState.searchQuery}
            onChange={(v) => setGlobalState(prev => ({ ...prev, searchQuery: v }))}
          />
          <SidebarGroupContent>
            <SidebarMenu>
              {globalData.map((item, index) => (
                <Tree
                  key={index}
                  item={item}
                  searchQuery={globalState.searchQuery}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

const scrollToAnchor = (anchor: string) => {
  const el = document.getElementById(anchor);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  history.replaceState(null, "", `#${anchor}`);
};

function Tree({
  item,
  searchQuery,
}: {
  item: CanMsgJsonFileV2,
  searchQuery: string,
}) {
  const { filename, content } = item

  const contentArray = Array.isArray(content) ? content : [];
  if (!contentArray.length) return null;

  const q = searchQuery.trim();
  const filenameMatches = filename.toLowerCase().includes(q.toLowerCase());
  const visibleMessages = q
    ? contentArray.filter((m: CanMsgV2) => filenameMatches || matchesQuery(m, q))
    : contentArray;

  if (q && visibleMessages.length === 0 && !filenameMatches) return null;

  const handleFileClick = () => scrollToAnchor(`file-${filename}`);
  const handleMsgClick = (msg: CanMsgV2, idx: number) =>
    scrollToAnchor(`msg-${filename}-${msg.id ?? idx}`);

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={q.length > 0}
        open={q.length > 0 ? true : undefined}
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
            {visibleMessages.map((a: CanMsgV2, index: number) => {
              const label = a.id ? `${a.id} - ${a.desc}` : a.desc;
              return (
                <SidebarMenuButton
                  onClick={() => handleMsgClick(a, index)}
                  key={index}
                  className="truncate"
                  title={label}
                >
                  <File />
                  <span className="truncate">{label}</span>
                </SidebarMenuButton>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
