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
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
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
import type {
  ConditionOperator,
  DecisionMode,
  FieldCondition,
  WorkflowFormType,
  WorkflowNodeData,
  WorkflowNodeKind,
} from '../../types/workflow'
import {
  workflowNodeTypes,
  type FlowNode,
  type FlowNodeData,
} from '../../components/workflow/WorkflowNodes'
import {
  CONDITION_OPERATORS,
  WORKFLOW_FORMS,
  getFormFieldLabel,
  getWorkflowFormMeta,
} from '../../constants/workflowForms'

function conditionSummary(
  formType: WorkflowFormType | null | undefined,
  condition: FieldCondition | undefined,
  mode: DecisionMode | undefined,
  decisionQuestion?: string,
) {
  if ((mode || 'manual') !== 'field' || !condition?.field) {
    return decisionQuestion
  }
  const fieldLabel = getFormFieldLabel(formType, condition.field)
  const opLabel =
    CONDITION_OPERATORS.find((item) => item.value === condition.operator)?.label ||
    condition.operator
  const needsValue = condition.operator !== 'isEmpty' && condition.operator !== 'isNotEmpty'
  return needsValue ? `${fieldLabel} ${opLabel} "${condition.value}"` : `${fieldLabel} ${opLabel}`
}

function enrichNodes(
  nodes: WorkflowDefinitionNodes,
  rolesById: Map<string, string>,
  statesById: Map<string, { name: string; color: string }>,
  formType: WorkflowFormType | null | undefined,
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
      conditionSummary: conditionSummary(
        formType,
        node.data.fieldCondition,
        node.data.decisionMode,
        node.data.decisionQuestion,
      ),
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
      waitForAction: Boolean(node.data.waitForAction),
      decisionMode: node.data.decisionMode,
      fieldCondition: node.data.fieldCondition,
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
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [formType, setFormType] = useState<WorkflowFormType | ''>('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId),
    [workflows, selectedWorkflowId],
  )

  const formMeta = useMemo(() => getWorkflowFormMeta(formType || null), [formType])

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
    setWorkflowName(selectedWorkflow.name)
    setWorkflowDescription(selectedWorkflow.description)
    setFormType(selectedWorkflow.formType ?? '')
    setNodes(
      enrichNodes(selectedWorkflow.nodes, rolesById, statesById, selectedWorkflow.formType),
    )
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

  const selectedFieldMeta = useMemo(() => {
    const fieldKey = selectedNode?.data.fieldCondition?.field
    if (!fieldKey || !formMeta) return undefined
    return formMeta.fields.find((field) => field.key === fieldKey)
  }, [selectedNode, formMeta])

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
      start: {
        kind: 'start',
        label: 'Start',
        roleId: '',
        stateId: defaultStateId,
        waitForAction: false,
      },
      step: {
        kind: 'step',
        label: 'New Step',
        roleId: roles[0]?.id ?? '',
        stateId: defaultStateId,
        waitForAction: false,
      },
      decision: {
        kind: 'decision',
        label: 'Decision?',
        decisionQuestion: 'What should happen next?',
        decisionMode: 'manual',
        fieldCondition: { field: '', operator: 'equals', value: '' },
        roleId: roles[0]?.id ?? '',
        stateId: defaultStateId,
      },
      end: {
        kind: 'end',
        label: 'End',
        roleId: '',
        stateId: defaultStateId,
        waitForAction: false,
      },
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
          conditionSummary: conditionSummary(
            formType || null,
            defaults[kind].fieldCondition,
            defaults[kind].decisionMode,
            defaults[kind].decisionQuestion,
          ),
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
        const nextDataBase = {
          ...node.data,
          ...patch,
          roleName:
            patch.roleId !== undefined ? rolesById.get(patch.roleId) : node.data.roleName,
          stateName:
            patch.stateId !== undefined
              ? statesById.get(patch.stateId)?.name
              : node.data.stateName,
          stateColor:
            patch.stateId !== undefined
              ? statesById.get(patch.stateId)?.color
              : node.data.stateColor,
        }
        const nextData = {
          ...nextDataBase,
          conditionSummary: conditionSummary(
            formType || null,
            nextDataBase.fieldCondition,
            nextDataBase.decisionMode,
            nextDataBase.decisionQuestion,
          ),
        }
        return { ...node, data: nextData }
      }),
    )
  }

  const updateFieldCondition = (patch: Partial<FieldCondition>) => {
    if (!selectedNode) return
    const current = selectedNode.data.fieldCondition || {
      field: '',
      operator: 'equals' as ConditionOperator,
      value: '',
    }
    updateSelectedNode({
      fieldCondition: { ...current, ...patch },
    })
  }

  const handleSave = () => {
    if (!selectedWorkflow) return
    const claimedForm = formType || null
    const conflict = claimedForm
      ? workflows.find(
          (workflow) =>
            workflow.id !== selectedWorkflow.id && workflow.formType === claimedForm,
        )
      : undefined

    saveWorkflow({
      ...selectedWorkflow,
      name: workflowName.trim() || selectedWorkflow.name,
      description: workflowDescription.trim(),
      formType: claimedForm,
      nodes: toPersistedNodes(nodes),
      edges: toPersistedEdges(edges),
    })
    setSuccessMessage(
      conflict
        ? `Saved "${workflowName}". Detached form from "${conflict.name}" (one workflow per form).`
        : `Saved workflow "${workflowName.trim() || selectedWorkflow.name}".`,
    )
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

  const needsConditionValue =
    selectedNode?.data.fieldCondition?.operator !== 'isEmpty' &&
    selectedNode?.data.fieldCondition?.operator !== 'isNotEmpty'

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AccountTreeIcon color="primary" sx={{ fontSize: 36 }} />
        <Box>
          <Typography variant="h4" color="primary">
            Workflow Editor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Attach a form, define steps and field-based decisions, and drive live approvals
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '300px 1fr 320px' },
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
                    {workflow.formType
                      ? ` (${getWorkflowFormMeta(workflow.formType)?.label ?? workflow.formType})`
                      : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                size="small"
                label="Workflow name"
                value={workflowName}
                onChange={(event) => setWorkflowName(event.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Description"
                value={workflowDescription}
                onChange={(event) => setWorkflowDescription(event.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="form-attach-label">Attached form</InputLabel>
                <Select
                  labelId="form-attach-label"
                  label="Attached form"
                  value={formType}
                  onChange={(event) => {
                    const next = event.target.value as WorkflowFormType | ''
                    setFormType(next)
                    // Refresh condition summaries when form changes
                    setNodes((current) =>
                      current.map((node) => ({
                        ...node,
                        data: {
                          ...node.data,
                          conditionSummary: conditionSummary(
                            next || null,
                            node.data.fieldCondition,
                            node.data.decisionMode,
                            node.data.decisionQuestion,
                          ),
                        },
                      })),
                    )
                  }}
                >
                  <MenuItem value="">
                    <em>None (design only)</em>
                  </MenuItem>
                  {WORKFLOW_FORMS.map((form) => (
                    <MenuItem key={form.type} value={form.type}>
                      {form.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {formMeta ? (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  Decisions can reference {formMeta.fields.length} fields from{' '}
                  {formMeta.label}. Saved changes apply to new submissions and manager actions.
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  Attach a form to drive staffing or PAF requests from this chart.
                </Alert>
              )}
            </Stack>

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
              (right) paths. Field decisions branch automatically from form values.
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
                Select a node on the flowchart to assign its role, state, and decision rules.
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
                  <>
                    <FormControl fullWidth>
                      <InputLabel id="decision-mode-label">Decision type</InputLabel>
                      <Select
                        labelId="decision-mode-label"
                        label="Decision type"
                        value={selectedNode.data.decisionMode || 'manual'}
                        onChange={(event) =>
                          updateSelectedNode({
                            decisionMode: event.target.value as DecisionMode,
                          })
                        }
                      >
                        <MenuItem value="manual">Manual (approve / reject)</MenuItem>
                        <MenuItem value="field" disabled={!formType}>
                          Form field condition
                        </MenuItem>
                      </Select>
                    </FormControl>

                    {(selectedNode.data.decisionMode || 'manual') === 'manual' ? (
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
                    ) : (
                      <Stack spacing={1.5}>
                        {!formType ? (
                          <Alert severity="warning">Attach a form to pick fields.</Alert>
                        ) : (
                          <>
                            <FormControl fullWidth size="small">
                              <InputLabel id="condition-field-label">Form field</InputLabel>
                              <Select
                                labelId="condition-field-label"
                                label="Form field"
                                value={selectedNode.data.fieldCondition?.field || ''}
                                onChange={(event) =>
                                  updateFieldCondition({ field: event.target.value })
                                }
                              >
                                {formMeta?.fields.map((field) => (
                                  <MenuItem key={field.key} value={field.key}>
                                    {field.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                              <InputLabel id="condition-op-label">Operator</InputLabel>
                              <Select
                                labelId="condition-op-label"
                                label="Operator"
                                value={selectedNode.data.fieldCondition?.operator || 'equals'}
                                onChange={(event) =>
                                  updateFieldCondition({
                                    operator: event.target.value as ConditionOperator,
                                  })
                                }
                              >
                                {CONDITION_OPERATORS.map((operator) => (
                                  <MenuItem key={operator.value} value={operator.value}>
                                    {operator.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {needsConditionValue ? (
                              selectedFieldMeta?.options ? (
                                <FormControl fullWidth size="small">
                                  <InputLabel id="condition-value-label">Value</InputLabel>
                                  <Select
                                    labelId="condition-value-label"
                                    label="Value"
                                    value={selectedNode.data.fieldCondition?.value || ''}
                                    onChange={(event) =>
                                      updateFieldCondition({ value: event.target.value })
                                    }
                                  >
                                    {selectedFieldMeta.options.map((option) => (
                                      <MenuItem key={option} value={option}>
                                        {option}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              ) : (
                                <TextField
                                  size="small"
                                  label="Value"
                                  value={selectedNode.data.fieldCondition?.value || ''}
                                  onChange={(event) =>
                                    updateFieldCondition({ value: event.target.value })
                                  }
                                  fullWidth
                                />
                              )
                            ) : null}
                            <Typography variant="caption" color="text.secondary">
                              Yes path runs when the condition is true; No path when false.
                              Evaluated automatically on submit and when advancing.
                            </Typography>
                          </>
                        )}
                      </Stack>
                    )}
                  </>
                )}

                {selectedNode.type === 'step' && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(selectedNode.data.waitForAction)}
                        onChange={(event) =>
                          updateSelectedNode({ waitForAction: event.target.checked })
                        }
                      />
                    }
                    label="Wait for manager approve / reject"
                  />
                )}

                {selectedNode.type !== 'end' &&
                  !(
                    selectedNode.type === 'decision' &&
                    selectedNode.data.decisionMode === 'field'
                  ) && (
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
                  When a request reaches this node, it takes the selected state
                  {selectedNode.type === 'decision'
                    ? selectedNode.data.decisionMode === 'field'
                      ? ' and branches from the field condition'
                      : ' and waits for a Yes/No decision'
                    : selectedNode.data.waitForAction
                      ? ' and waits for manager action'
                      : ''}
                  .
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
