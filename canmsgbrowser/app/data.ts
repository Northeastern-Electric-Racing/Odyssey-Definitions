import { createContext } from "react";
import { CanMsgJsonFileV2 } from "@/types/datatypes";
import { SourceMode } from "@/types/datatypes";

export enum RenderPageEnum {
    Overview = "Overview",
    Settings = "Settings",
    Profile = "Profile",
    Details = "Details",
}

export const GlobalDataContext = createContext<{
    globalData: CanMsgJsonFileV2[],
    setGlobalData: React.Dispatch<React.SetStateAction<CanMsgJsonFileV2[]>>
}>({
    globalData: [], // Your initial global data
    setGlobalData: () => { } // Function to update the data
});

export interface GlobalState {
    activePage: RenderPageEnum;
    activeFile: CanMsgJsonFileV2 | null;
    dataSource: SourceMode;
    selectedBranch: string | null;
}



export const GlobalStateContext = createContext<{
    globalState: GlobalState,
    setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>
}>({
    globalState: {
        activePage: RenderPageEnum.Overview,
        activeFile: null,
        dataSource: SourceMode.GitHub,
        selectedBranch: null,
    },
    setGlobalState: (state) => {
        console.log("Default setGlobalState called with:", state);
    }
});

export const defaultSections = {
  sections: [
    {
      name: RenderPageEnum.Overview,
      path: "/overview",
    },
  ],
};



export const fetchGitHubContentV3 = async (branch: string) => {
    try {
        if (!branch) {
            branch = "main";
        }
        const response = await fetch(`https://api.github.com/repos/Northeastern-Electric-Racing/Odyssey-Definitions/contents/can-messages?ref=${branch}`);
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }
        const fetchedFiles = await response.json();

        const fetchedFileContents = await Promise.all(
            fetchedFiles.map(async (file: any) => {
                const fileResponse = await fetch(file.download_url);
                if (!fileResponse.ok) {
                    throw new Error(`Failed to fetch file: ${file.name}`);
                }
                return {
                    name: file.name,
                    rawContent: await fileResponse.json()
                };
            })
        );

        const newCanMsgJsonFiles: CanMsgJsonFileV2[] = fetchedFileContents.map(file => {
            return {
                filename: file.name,
                content: file.rawContent, // Assuming rawContent is in the format of CanMsgV2[]
                is_dirty: false
            } as CanMsgJsonFileV2;
        });

        return newCanMsgJsonFiles;
    } catch (error) {
        console.error("Error in fetchGitHubContentV3:", error)
        throw error
    }
}