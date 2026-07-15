import type { WorkflowDefinition } from '../types/workflow'

export const SAMPLE_WORKFLOW: WorkflowDefinition = {
  id: 'workflow-paf-approval',
  name: 'PAF Approval Flow',
  description: 'Example flowchart for submitting and approving a PAF request',
  states: [
    { id: 'state-draft', name: 'Draft', color: '#757575' },
    { id: 'state-submitted', name: 'Submitted', color: '#1976d2' },
    { id: 'state-in-review', name: 'In Review', color: '#ed6c02' },
    { id: 'state-approved', name: 'Approved', color: '#2e7d32' },
    { id: 'state-rejected', name: 'Rejected', color: '#c62828' },
    { id: 'state-complete', name: 'Complete', color: '#00695c' },
  ],
  nodes: [
    {
      id: 'node-start',
      type: 'start',
      position: { x: 280, y: 0 },
      data: {
        kind: 'start',
        label: 'Start',
        roleId: 'role-requestor',
        stateId: 'state-draft',
      },
    },
    {
      id: 'node-submit',
      type: 'step',
      position: { x: 240, y: 120 },
      data: {
        kind: 'step',
        label: 'Submit PAF Request',
        roleId: 'role-requestor',
        stateId: 'state-submitted',
      },
    },
    {
      id: 'node-manager-review',
      type: 'step',
      position: { x: 240, y: 260 },
      data: {
        kind: 'step',
        label: 'Manager Review',
        roleId: 'role-manager',
        stateId: 'state-in-review',
      },
    },
    {
      id: 'node-decision',
      type: 'decision',
      position: { x: 250, y: 420 },
      data: {
        kind: 'decision',
        label: 'Approved?',
        decisionQuestion: 'Does the manager approve this PAF?',
        roleId: 'role-manager',
        stateId: 'state-in-review',
      },
    },
    {
      id: 'node-approved',
      type: 'step',
      position: { x: 40, y: 600 },
      data: {
        kind: 'step',
        label: 'Mark Approved',
        roleId: 'role-manager',
        stateId: 'state-approved',
      },
    },
    {
      id: 'node-rejected',
      type: 'step',
      position: { x: 440, y: 600 },
      data: {
        kind: 'step',
        label: 'Mark Rejected',
        roleId: 'role-manager',
        stateId: 'state-rejected',
      },
    },
    {
      id: 'node-end-ok',
      type: 'end',
      position: { x: 80, y: 740 },
      data: {
        kind: 'end',
        label: 'Complete',
        roleId: '',
        stateId: 'state-complete',
      },
    },
    {
      id: 'node-end-reject',
      type: 'end',
      position: { x: 480, y: 740 },
      data: {
        kind: 'end',
        label: 'Ended (Rejected)',
        roleId: '',
        stateId: 'state-rejected',
      },
    },
  ],
  edges: [
    { id: 'e-start-submit', source: 'node-start', target: 'node-submit' },
    { id: 'e-submit-review', source: 'node-submit', target: 'node-manager-review' },
    { id: 'e-review-decision', source: 'node-manager-review', target: 'node-decision' },
    {
      id: 'e-yes',
      source: 'node-decision',
      sourceHandle: 'yes',
      target: 'node-approved',
      label: 'Yes',
    },
    {
      id: 'e-no',
      source: 'node-decision',
      sourceHandle: 'no',
      target: 'node-rejected',
      label: 'No',
    },
    { id: 'e-approved-end', source: 'node-approved', target: 'node-end-ok' },
    { id: 'e-rejected-end', source: 'node-rejected', target: 'node-end-reject' },
  ],
  updatedAt: '2026-07-15T12:00:00.000Z',
}
