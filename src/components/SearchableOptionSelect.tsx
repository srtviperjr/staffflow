import { Autocomplete, TextField } from '@mui/material'
import { sortAlpha } from '../constants/staffingPlanOptions'

export interface OptionItem {
  value: string
  label: string
}

interface SearchableOptionSelectProps {
  label: string
  options: OptionItem[]
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
}

export default function SearchableOptionSelect({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  required,
  disabled,
}: SearchableOptionSelectProps) {
  const selected = options.find((option) => option.value === value) ?? null

  return (
    <Autocomplete
      disabled={disabled}
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      value={selected}
      onChange={(_, newValue) => onChange(newValue?.value ?? '')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={Boolean(error)}
          helperText={error ?? helperText}
        />
      )}
    />
  )
}

export function sortOptionLabels(options: string[]) {
  return sortAlpha(options)
}
