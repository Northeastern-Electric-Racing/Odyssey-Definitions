import { useContext, useState } from "react"
import { GlobalStateContext, GlobalDataContext, matchesQuery } from "./data"
import { CanMsgJsonFileV2, CanMsgV2, NetFieldV2, CanPointV2 } from "@/types/datatypes"
import { CopyGrafanaSqlButton } from "@/components/copy-grafana-sql"

/**
 * Interface for facilitating the highlighting of related CanPoints while hovering over a NetField.
 */
export interface HighlightState {
  messageId: string;
  values: number[];
  valuesInTopic?: number[];
}

/**
 * Retrieves an array of numeric values from the given field name string.
 *
 * This function searches for placeholders in the format "{number}" within the provided field name.
 * It extracts the numeric values from these placeholders and returns them as an array of integers.
 */
export const getValuesInTopic = (fieldName: string) => {
  const regex = new RegExp("{\\d}", 'g');
  return fieldName.match(regex)?.map((val) => parseInt(val.replace(/{|}/g, '')) ?? []);
}

const msgAnchor = (filename: string, msgId: string | undefined, idx: number) =>
  `msg-${filename}-${msgId ?? idx}`;

const pointAnchor = (filename: string, msgId: string | undefined, msgIdx: number, pointIdx: number) =>
  `${msgAnchor(filename, msgId, msgIdx)}-index-${pointIdx + 1}`;

interface CanPointDetailsProps {
  point: CanPointV2;
  anchorId: string;
  msgKey: string;
  index: number;
  highlightState: HighlightState;
}

const CanPointDetails = ({ point, anchorId, msgKey, index, highlightState }: CanPointDetailsProps) => (
  <div
    id={anchorId}
    className={`bg-gray-50 p-2 rounded flex ${
      highlightState.messageId === msgKey
        ? highlightState.valuesInTopic?.includes(index + 1)
          ? 'bg-red-50 border-2 border-red-400'
          : highlightState.values.includes(index + 1)
            ? 'bg-blue-50 border-2 border-blue-400'
            : 'border-2'
        : 'border-2'
    }`}
  >
    <span className="text-gray-500 border-r pr-2 mr-2 flex items-center">
      <a href={`#${anchorId}`} className="hover:text-blue-500">
        {index + 1}.
      </a>
    </span>
    <div className="flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        {point.name && (
          <span className="font-mono text-sm text-slate-800">{point.name}</span>
        )}
        <span className="font-medium">{point.size}bit</span>
        {point.c_type && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-800 font-mono">
            {point.c_type}
          </span>
        )}
        {point.signed && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            signed
          </span>
        )}
        {point.format && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
            {point.format}
          </span>
        )}
        {point.formatter && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-800 font-mono">
            {point.formatter.key}
            {point.formatter.arg !== undefined ? `(${point.formatter.arg})` : ''}
          </span>
        )}
        {point.endianness && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
            {point.endianness}
          </span>
        )}
        {point.parse === false && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
            no-parse
          </span>
        )}
        {point.ieee754_f32 && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-fuchsia-100 text-fuchsia-800">
            ieee754_f32
          </span>
        )}
      </div>
      {(point.default !== undefined) && (
        <div className="text-sm text-gray-600 mt-1">
          <span>Default: {point.default}</span>
        </div>
      )}
      {point.sim && (
        <div className="text-sm text-gray-600 mt-1 pt-1 border-t">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              point.sim.options
                ? 'bg-purple-100 text-purple-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {point.sim.options ? 'enum' : 'sweep'}
            </span>
          </div>
          {point.sim.options ? (
            <span>Options: {point.sim.options.map(([val, prob]) => `${val}(${prob})`).join(', ')}</span>
          ) : (
            <span>Range: {point.sim.min} to {point.sim.max}</span>
          )}
        </div>
      )}
    </div>
  </div>
)

interface NetFieldItemProps {
  field: NetFieldV2;
  msgKey: string;
  onMouseEnter: (field: NetFieldV2, msgKey: string) => void;
  onMouseLeave: () => void;
}

const NetFieldItem = ({ field, msgKey, onMouseEnter, onMouseLeave }: NetFieldItemProps) => {
  const valuesInTopic = getValuesInTopic(field.name);

  return <div
    className="bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100"
    onMouseEnter={() => onMouseEnter(field, msgKey)}
    onMouseLeave={onMouseLeave}
  >
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="font-medium">{field.name}</span>
        <CopyGrafanaSqlButton topic={field.name} />
        {field.unit && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
            Unit: {field.unit}
          </span>
        )}
      </div>
      {(field.doc || field.desc) && (
        <div className="mt-1 text-xs text-slate-700">
          {field.doc && <div>{field.doc}</div>}
          {field.desc && (
            <div className="text-slate-500 italic font-mono">{field.desc}</div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {field.values && field.values.length > 0 && (
          <div className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm">
            Values: {field.values.join(', ')}
          </div>
        )}
        {valuesInTopic && (
          <div className="px-2 py-1 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            Topic: {valuesInTopic.join(', ')}
          </div>
        )}
      </div>
    </div>
  </div>
}

const MessageCard = ({
  msg,
  filename,
  msgIdx,
}: {
  msg: CanMsgV2;
  filename: string;
  msgIdx: number;
}) => {
  const [highlightState, setHighlightState] = useState<HighlightState>({
    messageId: '',
    values: [],
  });

  const anchor = msgAnchor(filename, msg.id, msgIdx);

  const handleNetFieldHover = (field: NetFieldV2, msgKey: string) => {
    setHighlightState({
      messageId: msgKey,
      values: field.values ?? [],
      valuesInTopic: getValuesInTopic(field.name),
    });
  };

  const handleNetFieldLeave = () => {
    setHighlightState({ messageId: '', values: [] });
  };

  return (
    <div id={anchor} className="bg-white rounded-lg shadow p-4 scroll-mt-20">
      <div className="flex justify-between items-start mb-4">
        <div>
          {msg.id ? (
            <h2 className="text-xl font-semibold">
              ID: <a href={`#${anchor}`} className="hover:text-blue-500">{msg.id}</a>
            </h2>
          ) : (
            <h2 className="text-xl font-semibold text-slate-500">(no id)</h2>
          )}
          <p className="text-gray-600">{msg.desc}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-[auto,1fr] gap-x-4 text-sm">
          {msg.sim_freq !== undefined && (
            <>
              <span className="font-medium">Simulation Frequency:</span>
              <span>{msg.sim_freq}Hz</span>
            </>
          )}
          {msg.key && (
            <>
              <span className="font-medium">Key:</span>
              <span className="font-mono">{msg.key}</span>
            </>
          )}
          {msg.bidir_mode && (
            <>
              <span className="font-medium">Bidir mode:</span>
              <span className="font-mono">{msg.bidir_mode}</span>
            </>
          )}
          {msg.clients && msg.clients.length > 0 && (
            <>
              <span className="font-medium">Clients:</span>
              <span className="font-mono">{msg.clients.join(", ")}</span>
            </>
          )}
          {msg.is_ext && (
            <>
              <span className="font-medium">Extended:</span>
              <span>yes</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <h3 className="font-medium mb-2">Net Fields</h3>
            <div className="space-y-2">
              {(msg.fields ?? []).map((field: NetFieldV2, idx: number) => (
                <NetFieldItem
                  key={idx}
                  field={field}
                  msgKey={anchor}
                  onMouseEnter={handleNetFieldHover}
                  onMouseLeave={handleNetFieldLeave}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium mb-2">CAN Points</h3>
            <div className="space-y-2">
              {(msg.points ?? []).map((point, idx) => (
                <CanPointDetails
                  key={idx}
                  point={point}
                  anchorId={pointAnchor(filename, msg.id, msgIdx, idx)}
                  msgKey={anchor}
                  index={idx}
                  highlightState={highlightState}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileSection = ({
  file,
  query,
}: {
  file: CanMsgJsonFileV2;
  query: string;
}) => {
  const content = Array.isArray(file.content) ? file.content : [];
  const filenameMatches = file.filename.toLowerCase().includes(query.toLowerCase());
  const visible = query
    ? content.filter(m => filenameMatches || matchesQuery(m, query))
    : content;

  if (visible.length === 0) return null;

  return (
    <section id={`file-${file.filename}`} className="space-y-4 scroll-mt-20">
      <h1 className="text-2xl font-bold border-b pb-2">
        {file.filename}
        {file.is_dirty && <span className="text-red-500 ml-2">*</span>}
      </h1>
      {visible.map((msg, idx) => (
        <MessageCard
          key={`${file.filename}-${msg.id ?? idx}`}
          msg={msg}
          filename={file.filename}
          msgIdx={idx}
        />
      ))}
    </section>
  );
};

export const Browse = () => {
  const { globalData } = useContext(GlobalDataContext);
  const { globalState } = useContext(GlobalStateContext);
  const q = globalState.searchQuery.trim();

  if (!globalData.length) {
    return (
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min">
        No files loaded. Fetch a branch from GitHub or load local files from the sidebar.
      </div>
    );
  }

  const sections = globalData.map(file => (
    <FileSection key={file.filename} file={file} query={q} />
  ));
  const anyVisible = globalData.some(file => {
    const content = Array.isArray(file.content) ? file.content : [];
    const filenameMatches = file.filename.toLowerCase().includes(q.toLowerCase());
    return q
      ? content.some(m => filenameMatches || matchesQuery(m, q))
      : content.length > 0;
  });

  return (
    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min space-y-8">
      {q && (
        <p className="text-sm text-slate-600">
          Filtering by <span className="font-mono bg-slate-200 px-1 rounded">{q}</span>
        </p>
      )}
      {!anyVisible && q && (
        <p className="text-slate-500">No messages match this search.</p>
      )}
      {sections}
    </div>
  );
};
