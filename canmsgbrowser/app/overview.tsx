import { useContext, useState } from "react"
import { GlobalDataContext } from "./data"
import { CanMsgJsonFileV2, CanMsgV2, NetFieldV2, CanPointV2 } from "@/types/datatypes"
import { cn } from "@/lib/utils"
import { getValuesInTopic, HighlightState } from "./detail"

const OverviewCanMsgCard = ({ msg }: { msg: CanMsgV2 }) => {
  const [expanded, setExpanded] = useState(false)
  const [highlightState, setHighlightState] = useState<HighlightState>({
    messageId: '',
    values: []
  });

  const handleNetFieldHover = (field: NetFieldV2) => {
    setHighlightState({
      messageId: msg.id,
      values: field.values,
      valuesInTopic: getValuesInTopic(field.name)
    });
  }

  const handleNetFieldLeave = () => {
    setHighlightState({
      messageId: '',
      values: []
    });
  };

  return (
    <div className={cn(
      "border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden",
      expanded ? "mb-3" : "mb-2"
    )}>
      <div className="flex items-stretch h-10">
        <div className="flex items-center flex-1">
          <div className="h-full flex items-center bg-green-100 text-green-800 font-mono font-bold px-4 self-stretch">
            {msg.id}
          </div>
          <span className="font-medium text-slate-700 px-3">{msg.desc}</span>
          {msg.is_ext && (
            <span className="px-2 bg-blue-100 text-blue-800 rounded-full text-xs">
              Extended
            </span>
          )}
        </div>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="px-3 rounded-none hover:bg-slate-100 text-slate-600"
        >
          {expanded ? "Hide" : "Show"}
        </button>
      </div>
      {expanded && (
        <>
          <hr className="mb-3" />
          <div className="px-2 pb-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">Netfields</h3>
                <table className="w-full">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="text-left pb-2">Name</th>
                      <th className="text-left pb-2">Unit</th>
                      <th className="text-left pb-2">Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {msg.fields.map((field: NetFieldV2, index: number) => (
                      <tr 
                        key={index} 
                        className="border-t border-slate-200 hover:bg-slate-100 cursor-pointer"
                        onMouseEnter={() => handleNetFieldHover(field)}
                        onMouseLeave={handleNetFieldLeave}
                      >
                        <td className="py-2 text-slate-700">{field.name}</td>
                        <td className="py-2 text-slate-500">{field.unit}</td>
                        <td className="py-2 font-mono text-xs bg-slate-100 rounded px-2">
                          {field.values.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-800 mb-3">Canpoints</h3>
                <table className="w-full">
                  <thead>
                    <tr className="text-slate-600">
                      <th className="text-left pb-2">Size</th>
                      <th className="text-left pb-2">Type</th>
                      <th className="text-left pb-2">Format</th>
                    </tr>
                  </thead>
                  <tbody>
                    {msg.points.map((point: CanPointV2, index: number) => (
                      <tr 
                        key={index} 
                        className={cn(
                          "border-t border-slate-200",
                          highlightState.messageId === msg.id && (
                            highlightState.values.includes(index + 1)
                              ? "bg-blue-100"
                              : highlightState.valuesInTopic?.includes(index + 1)
                                ? "bg-red-100"
                                : ""
                          )
                        )}
                      >
                        <td className="py-2 text-slate-700">{point.size}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            point.signed 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {point.signed ? 'Signed' : 'Unsigned'}
                          </span>
                        </td>
                        <td className="py-2 font-mono text-xs">
                          {point.format || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const OverviewCanFileCard = ({ file }: { file: CanMsgJsonFileV2 }) => (
  <div className="mb-6 p-4 border rounded-xl">
    <h2 className="text-xl font-bold mb-4">{file.filename}</h2>
    {file.content?.map((msg, index) => (
      <OverviewCanMsgCard key={index} msg={msg} />
    ))}
  </div>
)

export const Overview = () => {
  const { globalData } = useContext(GlobalDataContext)

  return (
    <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-4">
      <h1 className="text-2xl font-bold mb-4">Overview</h1>
      {globalData.map((file, index) => (
        <OverviewCanFileCard key={index} file={file} />
      ))}
    </div>
  )
}

