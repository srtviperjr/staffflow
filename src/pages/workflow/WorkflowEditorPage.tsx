import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import StopCircleIcon from '@mui/icons-material/StopCircle'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { useRoles } from '../../context/RolesContext'
import { useWorkflows } from '../../context/WorkflowContext'
import type { WorkflowNodeData, WorkflowNodeKind } from '../../types/workflow'
import { workflowNodeTypes, type FlowNode, type FlowNodeData } from '../../components/workflow/WorkflowNodes'

function enrichNodes(
  nodes: WorkflowDefinitionNodes,
  rolesById: Map<string, string>,
  statesById: Map<string, { name: string; color: string }>,
): FlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      ...node.data,
      roleName: node.data.roleId ? rolesById.get(node.data.roleId) : undefined,
      stateName: node.data.stateId ? statesById.get(node.data.stateId)?.name : undefined,
      stateColor: node.data.stateId ? statesById.get(node.data.stateId)?.color : undefined,
    },
  }))
}

type WorkflowDefinitionNodes = ReturnType<typeof useWorkflows>['workflows'][number]['nodes']

function toPersistedNodes(nodes: FlowNode[]) {
  return nodes.map((node) => ({
    id: node.id,
    type: (node.type || 'step') as WorkflowNodeKind,
    position: node.position,
    data: {
      kind: (node.type || 'step') as WorkflowNodeKind,
      label: node.data.label,
      roleId: node.data.roleId || '',
      stateId: node.data.stateId || '',
      decisionQuestion: node.data.decisionQuestion,
    } satisfies WorkflowNodeData,
  }))
}

function toPersistedEdges(edges: Edge[]) {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: typeof edge.label === 'string' ? edge.label : undefined,
  }))
}

function WorkflowEditorCanvas() {
  const { roles } = useRoles()
  const { workflows, saveWorkflow, createWorkflow, addState } = useWorkflows()

  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [newStateName, setNewStateName] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId),
    [workflows, selectedWorkflowId],
  )

  const rolesById = useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles],
  )

  const statesById = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>()
    for (const state of selectedWorkflow?.states ?? []) {
      map.set(state.id, { name: state.name, color: state.color })
    }
    return map
  }, [selectedWorkflow])

  useEffect(() => {
    if (!selectedWorkflowId && workflows.length > 0) {
      setSelectedWorkflowId(workflows[0].id)
    }
  }, [workflows, selectedWorkflowId])

  useEffect(() => {
    if (!selectedWorkflow) return
    setNodes(enrichNodes(selectedWorkflow.nodes, rolesById, statesById))
    setEdges(
      selectedWorkflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? undefined,
        targetHandle: edge.targetHandle ?? undefined,
        label: edge.label,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 2 },
        labelStyle: { fontWeight: 700, fill: '#5d4037' },
      })),
    )
    setSelectedNodeId(null)
  }, [selectedWorkflow?.id, rolesById, statesById, selectedWorkflow, setNodes, setEdges])

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      const label =
        connection.sourceHandle === 'yes'
          ? 'Yes'
          : connection.sourceHandle === 'no'
            ? 'No'
            : undefined
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.sourceHandle || 'out'}-${connection.target}-${crypto.randomUUID().slice(0, 6)}`,
            label,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
          },
          current,
        ),
      )
    },
    [setEdges],
  )

  const addNode = (kind: WorkflowNodeKind) => {
    if (!selectedWorkflow) return
    const defaultStateId = selectedWorkflow.states[0]?.id ?? ''
    const id = crypto.randomUUID()
    const defaults: Record<WorkflowNodeKind, WorkflowNodeData> = {
      start: { kind: 'start', label: 'Start', roleId: '', stateId: defaultStateId },
      step: {
        kind: 'step',
        label: 'New Step',
        roleId: roles[0]?.id ?? '',
        stateId: defaultStateId,
      },
      decision: {
        kind: 'decision',
        label: 'Decision?',
        decisionQuestion: 'What should happen next?',
        roleId: roles[0]?.id ?? '',
        stateId: defaultStateId,
      },
      end: { kind: 'end', label: 'End', roleId: '', stateId: defaultStateId },
    }

    const position = {
      x: 180 + nodes.length * 24,
      y: 40 + nodes.length * 40,
    }

    setNodes((current) => [
      ...current,
      {
        id,
        type: kind,
        position,
        data: {
          ...defaults[kind],
          roleName: defaults[kind].roleId ? rolesById.get(defaults[kind].roleId) : undefined,
          stateName: defaults[kind].stateId
            ? statesById.get(defaults[kind].stateId)?.name
            : undefined,
          stateColor: defaults[kind].stateId
            ? statesById.get(defaults[kind].stateId)?.color
            : undefined,
        } satisfies FlowNodeData,
      },
    ])
    setSelectedNodeId(id)
  }

  const updateSelectedNode = (patch: Partial<WorkflowNodeData>) => {
    if (!selectedNodeId) return
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== selectedNodeId) return node
        const nextData = {
          ...node.data,
          ...patch,
          roleName:
            patch.roleId !== undefined
              ? rolesById.get(patch.roleId)
              : node.data.roleName,
          stateName:
            patch.stateId !== undefined
              ? statesById.get(patch.stateId)?.name
              : node.data.stateName,
          stateColor:
            patch.stateId !== undefined
              ? statesById.get(patch.stateId)?.color
              : node.data.stateColor,
        }
        return { ...node, data: nextData }
      }),
    )
  }

  const handleSave = () => {
    if (!selectedWorkflow) return
    saveWorkflow({
      ...selectedWorkflow,
      nodes: toPersistedNodes(nodes),
      edges: toPersistedEdges(edges),
    })
    setSuccessMessage(`Saved workflow "${selectedWorkflow.name}".`)
    setShowSuccess(true)
  }

  const handleCreateWorkflow = () => {
    const name = newWorkflowName.trim()
    if (!name) return
    const created = createWorkflow(name)
    setNewWorkflowName('')
    setSelectedWorkflowId(created.id)
    setSuccessMessage(`Created workflow "${created.name}".`)
    setShowSuccess(true)
  }

  const handleAddState = () => {
    if (!selectedWorkflow || !newStateName.trim()) return
    const created = addState(selectedWorkflow.id, {
      name: newStateName.trim(),
      color: '#D35400',
    })
    setNewStateName('')
    setSuccessMessage(`Added state "${created.name}".`)
    setShowSuccess(true)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AccountTreeIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" color="primary">
            Workflow Editor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Define flowchart steps, assigned roles, item states, and Yes/No decision branches
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '280px 1fr 300px' },
          gap: 2,
          alignItems: 'stretch',
          minHeight: { xs: 'auto', lg: '70vh' },
        }}
      >
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Workflows
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="workflow-select-label">Active workflow</InputLabel>
              <Select
                labelId="workflow-select-label"
                label="Active workflow"
                value={selectedWorkflowId}
                onChange={(event) => setSelectedWorkflowId(event.target.value)}
              >
                {workflows.map((workflow) => (
                  <MenuItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="New workflow name"
                value={newWorkflowName}
                onChange={(event) => setNewWorkflowName(event.target.value)}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateWorkflow}
                disabled={!newWorkflowName.trim()}
              >
                Create Workflow
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Add to canvas
            </Typography>
            <Stack spacing={1}>
              <Button variant="contained" startIcon={<PlaylistAddIcon />} onClick={() => addNode('step')}>
                Add Step
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CallSplitIcon />}
                onClick={() => addNode('decision')}
              >
                Add Decision
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<StopCircleIcon />}
                onClick={() => addNode('end')}
              >
                Add End
              </Button>
              <Button variant="contained" color="secondary" startIcon={<SaveIcon />} onClick={handleSave}>
                Save Workflow
              </Button>
            </Stack>

            <Alert severity="info" sx={{ mt: 2 }}>
              Connect nodes by dragging from a handle. Decision diamonds expose Yes (left) and No
              (right) paths.
            </Alert>
          </CardContent>
        </Card>

        <Card sx={{ overflow: 'hidden', minHeight: 520 }}>
          <Box sx={{ height: { xs: 520, lg: '70vh' } }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={workflowNodeTypes}
              onSelectionChange={({ nodes: selected }) => {
                setSelectedNodeId(selected[0]?.id ?? null)
              }}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background gap={18} color="#e8d8c8" />
              <Controls />
              <MiniMap
                nodeStrokeColor="#D35400"
                nodeColor={(node) => {
                  if (node.type === 'decision') return '#ffe0b2'
                  if (node.type === 'end') return '#eeeeee'
                  if (node.type === 'start') return '#c8e6c9'
                  return '#ffe8d6'
                }}
              />
            </ReactFlow>
          </Box>
        </Card>

        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
              Step Inspector
            </Typography>

            {!selectedNode ? (
              <Typography variant="body2" color="text.secondary">
                Select a node on the flowchart to assign its role and state.
              </Typography>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Label"
                  value={selectedNode.data.label}
                  onChange={(event) => updateSelectedNode({ label: event.target.value })}
                  fullWidth
                />

                {selectedNode.type === 'decision' && (
                  <TextField
                    label="Decision question"
                    value={selectedNode.data.decisionQuestion || ''}
                    onChange={(event) =>
                      updateSelectedNode({ decisionQuestion: event.target.value })
                    }
                    fullWidth
                    multiline
                    minRows={2}
                  />
                )}

                {selectedNode.type !== 'end' && (
                  <FormControl fullWidth>
                    <InputLabel id="role-assign-label">Assigned role</InputLabel>
                    <Select
                      labelId="role-assign-label"
                      label="Assigned role"
                      value={selectedNode.data.roleId || ''}
                      onChange={(event) => updateSelectedNode({ roleId: event.target.value })}
                    >
                      <MenuItem value="">
                        <em>Unassigned</em>
                      </MenuItem>
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <FormControl fullWidth>
                  <InputLabel id="state-assign-label">Item state</InputLabel>
                  <Select
                    labelId="state-assign-label"
                    label="Item state"
                    value={selectedNode.data.stateId || ''}
                    onChange={(event) => updateSelectedNode({ stateId: event.target.value })}
                  >
                    <MenuItem value="">
                      <em>No state</em>
                    </MenuItem>
                    {(selectedWorkflow?.states ?? []).map((state) => (
                      <MenuItem key={state.id} value={state.id}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Typography variant="caption" color="text.secondary">
                  When an item reaches this node, it will be marked with the selected state and
                  assigned to the selected role
                  {selectedNode.type === 'decision' ? ' for the decision' : ''}.
                </Typography>
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Workflow states
            </Typography>
            <Stack spacing={0.75} sx={{ mb: 2 }}>
              {(selectedWorkflow?.states ?? []).map((state) => (
                <Box key={state.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: state.color,
                    }}
                  />
                  <Typography variant="body2">{state.name}</Typography>
                </Box>
              ))}
            </Stack>
            <Stack spacing={1}>
              <TextField
                size="small"
                label="New state name"
                value={newStateName}
                onChange={(event) => setNewStateName(event.target.value)}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddState}
                disabled={!newStateName.trim()}
              >
                Add State
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3500}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setShowSuccess(false)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default function WorkflowEditorPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorCanvas />
    </ReactFlowProvider>
  )
}
