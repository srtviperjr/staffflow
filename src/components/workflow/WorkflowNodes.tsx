import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Box, Typography } from '@mui/material'

import type { DecisionMode, FieldCondition } from '../../types/workflow'

export type FlowNodeData = {
  label: string
  kind: 'start' | 'step' | 'decision' | 'end'
  roleId: string
  stateId: string
  decisionQuestion?: string
  waitForAction?: boolean
  decisionMode?: DecisionMode
  fieldCondition?: FieldCondition
  roleName?: string
  stateName?: string
  stateColor?: string
  conditionSummary?: string
  [key: string]: unknown
}

export type FlowNode = Node<FlowNodeData, 'start' | 'step' | 'decision' | 'end'>

const baseCardSx = {
  minWidth: 180,
  maxWidth: 220,
  px: 1.5,
  py: 1.25,
  borderRadius: 2,
  border: '2px solid',
  bgcolor: 'background.paper',
  boxShadow: '0 4px 14px rgba(122,52,0,0.12)',
}

function MetaLine({
  roleName,
  stateName,
  stateColor,
  waitForAction,
}: {
  roleName?: string
  stateName?: string
  stateColor?: string
  waitForAction?: boolean
}) {
  return (
    <Box sx={{ mt: 0.75 }}>
      {roleName ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Role: {roleName}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          Role: unassigned
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: stateColor || '#bdbdbd',
            flexShrink: 0,
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {stateName || 'No state'}
        </Typography>
      </Box>
      {waitForAction ? (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: '#ed6c02' }}>
          Waits for approve/reject
        </Typography>
      ) : null}
    </Box>
  )
}

function StartNode({ data, selected }: NodeProps<FlowNode>) {
  return (
    <Box
      sx={{
        ...baseCardSx,
        borderColor: selected ? 'primary.main' : '#2e7d32',
        borderRadius: 999,
        textAlign: 'center',
        minWidth: 120,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
        {data.label || 'Start'}
      </Typography>
      <MetaLine roleName={data.roleName} stateName={data.stateName} stateColor={data.stateColor} />
      <Handle type="source" position={Position.Bottom} />
    </Box>
  )
}

function StepNode({ data, selected }: NodeProps<FlowNode>) {
  return (
    <Box
      sx={{
        ...baseCardSx,
        borderColor: selected ? 'primary.main' : 'primary.light',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
        STEP
      </Typography>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
        {data.label}
      </Typography>
      <MetaLine
        roleName={data.roleName}
        stateName={data.stateName}
        stateColor={data.stateColor}
        waitForAction={data.waitForAction}
      />
      <Handle type="source" position={Position.Bottom} />
    </Box>
  )
}

function DecisionNode({ data, selected }: NodeProps<FlowNode>) {
  const isField = data.decisionMode === 'field'
  return (
    <Box sx={{ width: 190, height: 190, position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ top: 8 }} />
      <Box
        sx={{
          position: 'absolute',
          inset: 18,
          transform: 'rotate(45deg)',
          border: '2px solid',
          borderColor: selected ? 'primary.main' : '#ed6c02',
          bgcolor: isField ? '#e8f5e9' : '#fff8f0',
          boxShadow: '0 4px 14px rgba(122,52,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ transform: 'rotate(-45deg)', textAlign: 'center', px: 1, maxWidth: 110 }}>
          <Typography variant="caption" sx={{ color: '#ed6c02', fontWeight: 700 }}>
            {isField ? 'FIELD' : 'DECISION'}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {data.label}
          </Typography>
          {data.conditionSummary || data.decisionQuestion ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              {data.conditionSummary || data.decisionQuestion}
            </Typography>
          ) : null}
          <MetaLine roleName={data.roleName} stateName={data.stateName} stateColor={data.stateColor} />
        </Box>
      </Box>
      <Handle id="yes" type="source" position={Position.Left} style={{ left: 8, top: '50%' }} />
      <Handle id="no" type="source" position={Position.Right} style={{ right: 8, top: '50%' }} />
      <Typography
        variant="caption"
        sx={{ position: 'absolute', left: -6, top: '42%', color: '#2e7d32', fontWeight: 700 }}
      >
        Yes
      </Typography>
      <Typography
        variant="caption"
        sx={{ position: 'absolute', right: -2, top: '42%', color: '#c62828', fontWeight: 700 }}
      >
        No
      </Typography>
    </Box>
  )
}

function EndNode({ data, selected }: NodeProps<FlowNode>) {
  return (
    <Box
      sx={{
        ...baseCardSx,
        borderColor: selected ? 'primary.main' : '#616161',
        borderRadius: 999,
        textAlign: 'center',
        minWidth: 130,
        bgcolor: '#f5f5f5',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {data.label || 'End'}
      </Typography>
      <MetaLine roleName={data.roleName} stateName={data.stateName} stateColor={data.stateColor} />
    </Box>
  )
}

export const workflowNodeTypes = {
  start: memo(StartNode),
  step: memo(StepNode),
  decision: memo(DecisionNode),
  end: memo(EndNode),
}
