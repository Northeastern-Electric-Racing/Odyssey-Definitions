"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export const buildGrafanaSql = (topic: string): string => {
  const alias = topic.split("/").pop() || topic;
  return `SELECT values[1] AS "${alias}", time FROM data WHERE "dataTypeName"='${topic}' AND $__timeFilter(time);`;
};

interface CopyGrafanaSqlButtonProps {
  topic: string;
  className?: string;
}

export const CopyGrafanaSqlButton = ({ topic, className }: CopyGrafanaSqlButtonProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sql = buildGrafanaSql(topic);
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy SQL to clipboard:", err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy Grafana selector SQL"
          className={cn(
            "inline-flex items-center justify-center h-6 w-6 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors",
            className
          )}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="font-medium mb-1">
          {copied ? "Copied!" : "Copy Grafana selector SQL"}
        </div>
        <div className="text-xs text-slate-500 font-mono break-all">
          {buildGrafanaSql(topic)}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
