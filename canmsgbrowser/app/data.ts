import { createContext } from "react";
import { CanMsgJsonFileV2, CanMsgV2 } from "@/types/datatypes";
import { SourceMode } from "@/types/datatypes";

/**
 * Returns true if any human-readable field on a CanMsg (id, desc, key,
 * bidir_mode, net field name/unit/doc/desc, can point name/c_type/format)
 * contains the given query.
 */
export const matchesQuery = (msg: CanMsgV2, query: string): boolean => {
    if (!query) return true;
    const q = query.toLowerCase();
    const fields = msg.fields ?? [];
    const points = msg.points ?? [];
    const haystacks: (string | number | undefined)[] = [
        msg.id,
        msg.desc,
        msg.key,
        msg.bidir_mode,
        ...(msg.clients ?? []),
        ...fields.flatMap(f => [f.name, f.unit, f.doc, f.desc]),
        ...points.flatMap(p => [p.name, p.c_type, p.format, p.formatter?.key]),
    ];
    return haystacks.some(v => v !== undefined && String(v).toLowerCase().includes(q));
};

export const GlobalDataContext = createContext<{
    globalData: CanMsgJsonFileV2[],
    setGlobalData: React.Dispatch<React.SetStateAction<CanMsgJsonFileV2[]>>
}>({
    globalData: [],
    setGlobalData: () => { }
});

export interface GlobalState {
    dataSource: SourceMode;
    selectedBranch: string | null;
    searchQuery: string;
}

export const GlobalStateContext = createContext<{
    globalState: GlobalState,
    setGlobalState: React.Dispatch<React.SetStateAction<GlobalState>>
}>({
    globalState: {
        dataSource: SourceMode.GitHub,
        selectedBranch: null,
        searchQuery: "",
    },
    setGlobalState: (state) => {
        console.log("Default setGlobalState called with:", state);
    }
});

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
                content: file.rawContent,
                is_dirty: false
            } as CanMsgJsonFileV2;
        });

        return newCanMsgJsonFiles;
    } catch (error) {
        console.error("Error in fetchGitHubContentV3:", error)
        throw error
    }
}
