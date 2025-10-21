import { useContext, useState } from "react"
import { GlobalStateContext, GlobalDataContext } from "./data"
import { CanMsgV2, NetFieldV2, CanPointV2 } from "@/types/datatypes"


/**
 * Interface for facilitating the highlighting of related CanPoints while hovering over a NetField.
 */
export interface HighlightState {
  messageId: string;
  values: number[];
  valuesInTopic?: number[];
}


interface CanPointDetailsProps {
  point: CanPointV2;
  msgId: string;
  index: number;
  highlightState: HighlightState;
}

const CanPointDetails = ({ point, msgId, index, highlightState }: CanPointDetailsProps) => (
  <div 
    key={index} 
    id={`msg-${msgId}-index-${index + 1}`}
    className={`bg-gray-50 p-2 rounded flex ${
      highlightState.messageId === msgId 
        ? highlightState.valuesInTopic?.includes(index + 1)
          ? 'bg-red-50 border-2 border-red-400'
          : highlightState.values.includes(index + 1)
            ? 'bg-blue-50 border-2 border-blue-400'
            : 'border-2'
        : 'border-2'
    }`}
  >
    <span className="text-gray-500 border-r pr-2 mr-2 flex items-center">
      <a href={`#msg-${msgId}-index-${index + 1}`} className="hover:text-blue-500">
        {index + 1}.
      </a>
    </span>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{point.size}bit</span>
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
        {point.endianness && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
            {point.endianness}
          </span>
        )}
      </div>
      {(point.default !== undefined) && (
        <div className="text-sm text-gray-600 mt-1">
          {point.default !== undefined && <span>Default: {point.default}</span>}
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
  msgId: string;
  onMouseEnter: (field: NetFieldV2, msgId: string) => void;
  onMouseLeave: () => void;
}

const NetFieldItem = ({ field, msgId, onMouseEnter, onMouseLeave }: NetFieldItemProps) => {
  const valuesInTopic = getValuesInTopic(field.name);
  
  return <div 
    className="bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100"
    onMouseEnter={() => onMouseEnter(field, msgId)}
    onMouseLeave={onMouseLeave}
  >
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="font-medium">{field.name}</span>
        {field.unit && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700">
            Unit: {field.unit}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {field.values.length > 0 && (
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


/**
 * Retrieves an array of numeric values from the given field name string.
 *
 * This function searches for placeholders in the format "{number}" within the provided field name.
 * It extracts the numeric values from these placeholders and returns them as an array of integers.
 *
 * @param fieldName - The field name string to search for numeric placeholders.
 * @returns An array of integers extracted from the placeholders in the field name.
 */
export const getValuesInTopic = (fieldName: string) => {
  // Hacky way to check if the field name contains a placeholder
  const regex = new RegExp("{\\d}", 'g');
  return fieldName.match(regex)?.map((val) => parseInt(val.replace(/{|}/g, '')) ?? []);
}


export const Detail = () => {
  const { globalState } = useContext(GlobalStateContext)
  const { activeFile } = globalState
  const { globalData } = useContext(GlobalDataContext)
  const [hoveredValue, setHoveredValue] = useState<string | null>(null)
  const [highlightedValues, setHighlightedValues] = useState<number[]>([])
  const [highlightState, setHighlightState] = useState<HighlightState>({
    messageId: '',
    values: []
  });

  if (!activeFile) {
    return <div>No file selected</div>
  }

  const handleNetFieldHover = (field: NetFieldV2, msgId: string) => {
    
    const valuesInTopic = getValuesInTopic(field.name);
    if (valuesInTopic) console.log(valuesInTopic);

    setHighlightState({
      messageId: msgId,
      values: field.values,
      valuesInTopic: valuesInTopic
    });
  }

  const handleNetFieldLeave = () => {
    setHighlightState({
      messageId: '',
      values: []
    });
  };

  return (
    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-6 md:min-h-min">
      <h1 className="text-2xl font-bold mb-4">
        File: {activeFile.filename}
        {activeFile.is_dirty && <span className="text-red-500 ml-2">*</span>}
      </h1>
      <div className="space-y-4">
        {activeFile.content.map((msg: CanMsgV2) => (
          <div key={msg.id} id={`msg-${msg.id}`} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">
                  ID: <a href={`#msg-${msg.id}`} className="hover:text-blue-500">{msg.id}</a>
                </h2>
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
                    <span>{msg.key}</span>
                  </>
                )}
              </div>

              {/* Two-column layout for Fields and Points */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {/* Netfields Column */}
                <div className="space-y-2">
                  <h3 className="font-medium mb-2">Net Fields</h3>
                  <div className="space-y-2">
                    {msg.fields.map((field: NetFieldV2, idx: number) => (
                      <NetFieldItem
                        key={idx}
                        field={field}
                        msgId={msg.id}
                        onMouseEnter={handleNetFieldHover}
                        onMouseLeave={handleNetFieldLeave}
                      />
                    ))}
                  </div>
                </div>

                {/* CAN Points Column */}
                <div className="space-y-2">
                  <h3 className="font-medium mb-2">CAN Points</h3>
                  <div className="space-y-2">
                    {msg.points.map((point, idx) => (
                      <CanPointDetails
                        key={idx}
                        point={point}
                        msgId={msg.id}
                        index={idx}
                        highlightState={highlightState}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


