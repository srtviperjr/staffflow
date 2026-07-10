import { Autocomplete, TextField } from '@mui/material'
import { sortAlpha } from '../constants/staffingPlanOptions'

interface SearchableSelectProps {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  freeSolo?: boolean
}

export default function SearchableSelect({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  required,
  freeSolo = false,
}: SearchableSelectProps) {
  return (
    <Autocomplete
      freeSolo={freeSolo}
      options={sortAlpha(options)}
      value={freeSolo ? value : value || null}
      onChange={(_, newValue) => onChange(newValue ?? '')}
      onInputChange={freeSolo ? (_, newValue) => onChange(newValue) : undefined}
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
