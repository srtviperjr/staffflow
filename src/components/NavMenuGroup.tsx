import { useId, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { ReactNode } from 'react'

export type NavMenuItem =
  | {
      label: string
      to: string
      icon?: ReactNode
      active?: boolean
    }
  | {
      label: string
      onClick: () => void
      icon?: ReactNode
      active?: boolean
    }

interface NavMenuGroupProps {
  label: string
  icon?: ReactNode
  active?: boolean
  items: NavMenuItem[]
}

function navButtonSx(active: boolean) {
  return {
    opacity: active ? 1 : 0.75,
    bgcolor: active ? 'rgba(255,255,255,0.15)' : 'transparent',
  }
}

function itemKey(item: NavMenuItem) {
  return 'to' in item ? item.to : `action:${item.label}`
}

export default function NavMenuGroup({ label, icon, active = false, items }: NavMenuGroupProps) {
  const buttonId = useId()
  const menuId = useId()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  return (
    <Box>
      <Button
        id={buttonId}
        color="inherit"
        startIcon={icon}
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={navButtonSx(active || open)}
      >
        {label}
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          list: {
            'aria-labelledby': buttonId,
            dense: true,
          },
        }}
      >
        {items.map((item) =>
          'to' in item ? (
            <MenuItem
              key={itemKey(item)}
              component={RouterLink}
              to={item.to}
              selected={Boolean(item.active)}
              onClick={() => setAnchorEl(null)}
            >
              {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ) : (
            <MenuItem
              key={itemKey(item)}
              selected={Boolean(item.active)}
              onClick={() => {
                setAnchorEl(null)
                item.onClick()
              }}
            >
              {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          ),
        )}
      </Menu>
    </Box>
  )
}

export { navButtonSx }
