import { Slider } from '@/components/ui/slider'

interface LabeledSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
}

export function LabeledSlider({ label, value, onChange, min, max }: LabeledSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">{label}</label>
        <span className="text-xs font-bold text-text-primary">{value}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={1}
        className="w-full"
      />
    </div>
  )
}
