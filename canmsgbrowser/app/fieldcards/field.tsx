"use client"

import { FieldCard } from "@/components/field-card"

const fieldsData = [
  {
    name: "Calypso/Bidir/State/FirstOff/A",
    unit: "Z",
    sim: {
      min: 1,
      max: 100,
      inc_min: 1,
      inc_max: 2
    },
    points: [
      {
        size: 32,
        signed: true,
        endianness: "little",
        format: "divide10000",
        default_value: 18.443,
        ieee754_f32: false
      }
    ]
  },
  {
    name: "Calypso/Bidir/State/FirstOff/B",
    unit: "G",
    sim: {
      min: 1,
      max: 100,
      inc_min: 1,
      inc_max: 2
    },
    points: [
      {
        size: 16,
        signed: true,
        endianness: "little",
        format: "divide100",
        default_value: -21.8,
        ieee754_f32: false
      }
    ]
  },
  {
    name: "Calypso/Bidir/State/FirstOff/C",
    unit: "G",
    sim: {
      min: 1,
      max: 100,
      inc_min: 1,
      inc_max: 2
    },
    points: [
      {
        size: 8,
        default_value: 19
      }
    ]
  }
]

export default function FieldCardTest() {
  return (
    <>
    </>
    // <div className="container mx-auto py-8 px-4 max-w-3xl">
    //   <h1 className="text-2xl font-bold mb-6">Field Cards</h1>
    //   <div className="space-y-6">
    //     {fieldsData.map((field, index) => (
    //       <FieldCard key={index} {...field} />
    //     ))}
    //   </div>
    // </div>
  )
}

