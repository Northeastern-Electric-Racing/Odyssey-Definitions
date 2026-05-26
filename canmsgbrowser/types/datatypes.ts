
 export const DEFAULT_BRANCH = "main"
//export const DEFAULT_BRANCH = "main"

export interface Sim {
    min?: number;
    max?: number;
    inc_min?: number;
    inc_max?: number;
    round?: boolean;
    options?: [number, number][];
}

export enum SourceMode {
    GitHub = 'github',
    Local = 'local',
}


export interface CanMsgJsonFileV2 {
    filename: string;
    content: CanMsgV2[];
    is_dirty: boolean;
}

export interface NetFieldV2 {
    name: string;
    unit: string;
    values?: number[];
    doc?: string;
    desc?: string;
}

export interface Formatter {
    key: string;
    arg?: number;
}

export interface CanPointV2 {
    size: number;
    name?: string;
    c_type?: string;
    parse?: boolean;
    signed?: boolean;
    endianness?: string;
    format?: string;
    formatter?: Formatter;
    default?: number;
    ieee754_f32?: boolean;
    sim?: Sim;
}

export interface CanMsgV2 {
    id?: string;
    desc: string;
    points?: CanPointV2[];
    fields?: NetFieldV2[];
    key?: string;
    is_ext?: boolean;
    sim_freq?: number;
    bidir_mode?: string;
    clients?: number[];
}
