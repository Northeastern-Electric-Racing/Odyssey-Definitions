import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Point {
  size: number
  signed?: boolean
  endianness?: 'big' | 'little'
  format?: string
  default_value?: number
  ieee754_f32?: boolean
}

interface Sim {
  min: number
  max: number
  inc_min: number
  inc_max: number
}

interface FieldCardProps {
  name: string
  unit: string
  sim: Sim
  points: Point[]
}

export function FieldCard({ name, unit, sim, points }: FieldCardProps) {
  const [pointsState, setPointsState] = useState(points)

  const updatePoint = (index: number, field: keyof Point, value: any) => {
    const newPoints = [...pointsState]
    newPoints[index] = { ...newPoints[index], [field]: value }
    setPointsState(newPoints)
  }

  return (
    <Card className="w-full mb-6 border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-mono">{name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="unit" className="text-blue-600">Unit</Label>
          <Input 
            id="unit" 
            defaultValue={unit} 
            className="w-20 font-mono"
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <Label htmlFor="sim-min" className="text-blue-600">Min</Label>
            <Input 
              id="sim-min" 
              defaultValue={sim.min}
              className="font-mono"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="sim-max" className="text-blue-600">Max</Label>
            <Input 
              id="sim-max" 
              defaultValue={sim.max}
              className="font-mono"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="inc-min" className="text-blue-600">Inc Min</Label>
            <Input 
              id="inc-min" 
              defaultValue={sim.inc_min}
              className="font-mono"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="inc-max" className="text-blue-600">Inc Max</Label>
            <Input 
              id="inc-max" 
              defaultValue={sim.inc_max}
              className="font-mono"
            />
          </div>
        </div>
        {pointsState.map((point, index) => (
          <div key={index} className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h3 className="font-mono text-blue-700">Point {index + 1}</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor={`size-${index}`} className="text-blue-600">Size (bits)</Label>
                <Input 
                  id={`size-${index}`} 
                  type="number"
                  value={point.size}
                  onChange={(e) => updatePoint(index, 'size', parseInt(e.target.value))}
                  className="font-mono"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`signed-enabled-${index}`}
                    checked={point.signed !== undefined}
                    onCheckedChange={(checked) => updatePoint(index, 'signed', checked ? false : undefined)}
                  />
                  <Label htmlFor={`signed-enabled-${index}`} className="text-blue-600">Signed</Label>
                </div>
                {point.signed !== undefined && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Switch
                      id={`signed-value-${index}`}
                      checked={point.signed}
                      onCheckedChange={(checked) => updatePoint(index, 'signed', checked)}
                    />
                    <Label htmlFor={`signed-value-${index}`} className="text-blue-600">
                      {point.signed ? 'True' : 'False'}
                    </Label>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`endianness-enabled-${index}`}
                    checked={point.endianness !== undefined}
                    onCheckedChange={(checked) => updatePoint(index, 'endianness', checked ? 'big' : undefined)}
                  />
                  <Label htmlFor={`endianness-enabled-${index}`} className="text-blue-600">Endianness</Label>
                </div>
                {point.endianness !== undefined && (
                  <Select 
                    value={point.endianness}
                    onValueChange={(value: 'big' | 'little') => updatePoint(index, 'endianness', value)}
                  >
                    <SelectTrigger className="mt-2 font-mono">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-50">
                      <SelectItem value="big">Big</SelectItem>
                      <SelectItem value="little">Little</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`format-enabled-${index}`}
                    checked={point.format !== undefined}
                    onCheckedChange={(checked) => updatePoint(index, 'format', checked ? '' : undefined)}
                  />
                  <Label htmlFor={`format-enabled-${index}`} className="text-blue-600">Format</Label>
                </div>
                {point.format !== undefined && (
                  <Input 
                    className="mt-2 font-mono"
                    value={point.format}
                    onChange={(e) => updatePoint(index, 'format', e.target.value)}
                    placeholder="e.g. divide100"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`default-value-enabled-${index}`}
                    checked={point.default_value !== undefined}
                    onCheckedChange={(checked) => updatePoint(index, 'default_value', checked ? 0 : undefined)}
                  />
                  <Label htmlFor={`default-value-enabled-${index}`} className="text-blue-600">Default</Label>
                </div>
                {point.default_value !== undefined && (
                  <Input 
                    className="mt-2 font-mono"
                    type="number"
                    value={point.default_value}
                    onChange={(e) => updatePoint(index, 'default_value', parseFloat(e.target.value))}
                  />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`ieee754-f32-enabled-${index}`}
                    checked={point.ieee754_f32 !== undefined}
                    onCheckedChange={(checked) => updatePoint(index, 'ieee754_f32', checked ? false : undefined)}
                  />
                  <Label htmlFor={`ieee754-f32-enabled-${index}`} className="text-blue-600">IEEE754</Label>
                </div>
                {point.ieee754_f32 !== undefined && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Switch
                      id={`ieee754-f32-value-${index}`}
                      checked={point.ieee754_f32}
                      onCheckedChange={(checked) => updatePoint(index, 'ieee754_f32', checked)}
                    />
                    <Label htmlFor={`ieee754-f32-value-${index}`} className="text-blue-600">
                      {point.ieee754_f32 ? 'True' : 'False'}
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

