import type { WorkflowDefinition } from '../types/workflow'

const SHARED_STATES = [
  { id: 'state-draft', name: 'Draft', color: '#757575' },
  { id: 'state-submitted', name: 'Submitted', color: '#1976d2' },
  { id: 'state-in-review', name: 'In Review', color: '#ed6c02' },
  { id: 'state-approved', name: 'Approved', color: '#2e7d32' },
  { id: 'state-rejected', name: 'Rejected', color: '#c62828' },
  { id: 'state-complete', name: 'Complete', color: '#00695c' },
]

/**
 * Canonical Staffing Plan approval flow — mirrors the product behavior:
 * submit → manager review → approve / reject.
 * Includes a field-based company gate so both paths reunite at review
 * (demonstrates form-field decisions without changing who approves).
 */
export const STAFFING_PLAN_WORKFLOW: WorkflowDefinition = {
  id: 'workflow-staffing-plan-approval',
  name: 'Staffing Plan Approval',
  description:
    'Submit a staffing plan position request, optionally route by company, then manager approve or reject',
  formType: 'staffing-plan',
  states: SHARED_STATES,
  nodes: [
    {
      id: 'sp-start',
      type: 'start',
      position: { x: 320, y: 0 },
      data: {
        kind: 'start',
        label: 'Start',
        roleId: 'role-requestor',
        stateId: 'state-draft',
      },
    },
    {
      id: 'sp-submit',
      type: 'step',
      position: { x: 280, y: 120 },
      data: {
        kind: 'step',
        label: 'Submit Position Request',
        roleId: 'role-requestor',
        stateId: 'state-submitted',
        waitForAction: false,
      },
    },
    {
      id: 'sp-hiring-gate',
      type: 'decision',
      position: { x: 290, y: 260 },
      data: {
        kind: 'decision',
        label: 'Bantrel company?',
        decisionQuestion: 'Is company Bantrel?',
        decisionMode: 'field',
        fieldCondition: {
          field: 'company',
          operator: 'equals',
          value: 'Bantrel',
        },
        roleId: '',
        stateId: 'state-submitted',
      },
    },
    {
      id: 'sp-review-bantrel',
      type: 'step',
      position: { x: 40, y: 440 },
      data: {
        kind: 'step',
        label: 'Manager Review (Bantrel)',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-review-other',
      type: 'step',
      position: { x: 480, y: 440 },
      data: {
        kind: 'step',
        label: 'Manager Review',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-decision',
      type: 'decision',
      position: { x: 290, y: 600 },
      data: {
        kind: 'decision',
        label: 'Approved?',
        decisionQuestion: 'Does the manager approve this staffing plan request?',
        decisionMode: 'manual',
        roleId: 'role-manager',
        stateId: 'state-in-review',
      },
    },
    {
      id: 'sp-approved',
      type: 'step',
      position: { x: 80, y: 780 },
      data: {
        kind: 'step',
        label: 'Mark Approved',
        roleId: 'role-manager',
        stateId: 'state-approved',
        waitForAction: false,
      },
    },
    {
      id: 'sp-rejected',
      type: 'step',
      position: { x: 480, y: 780 },
      data: {
        kind: 'step',
        label: 'Mark Rejected',
        roleId: 'role-manager',
        stateId: 'state-rejected',
        waitForAction: false,
      },
    },
    {
      id: 'sp-end-ok',
      type: 'end',
      position: { x: 120, y: 920 },
      data: {
        kind: 'end',
        label: 'Complete',
        roleId: '',
        stateId: 'state-complete',
      },
    },
    {
      id: 'sp-end-reject',
      type: 'end',
      position: { x: 520, y: 920 },
      data: {
        kind: 'end',
        label: 'Ended (Rejected)',
        roleId: '',
        stateId: 'state-rejected',
      },
    },
  ],
  edges: [
    { id: 'sp-e-start-submit', source: 'sp-start', target: 'sp-submit' },
    { id: 'sp-e-submit-gate', source: 'sp-submit', target: 'sp-hiring-gate' },
    {
      id: 'sp-e-gate-yes',
      source: 'sp-hiring-gate',
      sourceHandle: 'yes',
      target: 'sp-review-bantrel',
      label: 'Yes',
    },
    {
      id: 'sp-e-gate-no',
      source: 'sp-hiring-gate',
      sourceHandle: 'no',
      target: 'sp-review-other',
      label: 'No',
    },
    { id: 'sp-e-bantrel-decision', source: 'sp-review-bantrel', target: 'sp-decision' },
    { id: 'sp-e-other-decision', source: 'sp-review-other', target: 'sp-decision' },
    {
      id: 'sp-e-yes',
      source: 'sp-decision',
      sourceHandle: 'yes',
      target: 'sp-approved',
      label: 'Yes',
    },
    {
      id: 'sp-e-no',
      source: 'sp-decision',
      sourceHandle: 'no',
      target: 'sp-rejected',
      label: 'No',
    },
    { id: 'sp-e-approved-end', source: 'sp-approved', target: 'sp-end-ok' },
    { id: 'sp-e-rejected-end', source: 'sp-rejected', target: 'sp-end-reject' },
  ],
  updatedAt: '2026-07-15T12:00:00.000Z',
}

/**
 * Canonical PAF request flow — mirrors the product behavior:
 * submit → manager review → approve / reject.
 * Includes a field-based company gate for Fluor vs other company paths.
 */
export const PAF_APPROVAL_WORKFLOW: WorkflowDefinition = {
  id: 'workflow-paf-approval',
  name: 'PAF Request Flow',
  description:
    'Submit a PAF request against an approved staffing position, route by company, then manager approve or reject',
  formType: 'project-authorization',
  states: SHARED_STATES,
  nodes: [
    {
      id: 'paf-start',
      type: 'start',
      position: { x: 320, y: 0 },
      data: {
        kind: 'start',
        label: 'Start',
        roleId: 'role-requestor',
        stateId: 'state-draft',
      },
    },
    {
      id: 'paf-submit',
      type: 'step',
      position: { x: 280, y: 120 },
      data: {
        kind: 'step',
        label: 'Submit PAF Request',
        roleId: 'role-requestor',
        stateId: 'state-submitted',
        waitForAction: false,
      },
    },
    {
      id: 'paf-class-gate',
      type: 'decision',
      position: { x: 290, y: 260 },
      data: {
        kind: 'decision',
        label: 'Fluor company?',
        decisionQuestion: 'Is company Fluor?',
        decisionMode: 'field',
        fieldCondition: {
          field: 'company',
          operator: 'equals',
          value: 'Fluor',
        },
        roleId: '',
        stateId: 'state-submitted',
      },
    },
    {
      id: 'paf-review-contractor',
      type: 'step',
      position: { x: 40, y: 440 },
      data: {
        kind: 'step',
        label: 'Manager Review (Fluor)',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'paf-review-standard',
      type: 'step',
      position: { x: 480, y: 440 },
      data: {
        kind: 'step',
        label: 'Manager Review',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'paf-decision',
      type: 'decision',
      position: { x: 290, y: 600 },
      data: {
        kind: 'decision',
        label: 'Approved?',
        decisionQuestion: 'Does the manager approve this PAF?',
        decisionMode: 'manual',
        roleId: 'role-manager',
        stateId: 'state-in-review',
      },
    },
    {
      id: 'paf-approved',
      type: 'step',
      position: { x: 80, y: 780 },
      data: {
        kind: 'step',
        label: 'Mark Approved',
        roleId: 'role-manager',
        stateId: 'state-approved',
        waitForAction: false,
      },
    },
    {
      id: 'paf-rejected',
      type: 'step',
      position: { x: 480, y: 780 },
      data: {
        kind: 'step',
        label: 'Mark Rejected',
        roleId: 'role-manager',
        stateId: 'state-rejected',
        waitForAction: false,
      },
    },
    {
      id: 'paf-end-ok',
      type: 'end',
      position: { x: 120, y: 920 },
      data: {
        kind: 'end',
        label: 'Complete',
        roleId: '',
        stateId: 'state-complete',
      },
    },
    {
      id: 'paf-end-reject',
      type: 'end',
      position: { x: 520, y: 920 },
      data: {
        kind: 'end',
        label: 'Ended (Rejected)',
        roleId: '',
        stateId: 'state-rejected',
      },
    },
  ],
  edges: [
    { id: 'paf-e-start-submit', source: 'paf-start', target: 'paf-submit' },
    { id: 'paf-e-submit-gate', source: 'paf-submit', target: 'paf-class-gate' },
    {
      id: 'paf-e-gate-yes',
      source: 'paf-class-gate',
      sourceHandle: 'yes',
      target: 'paf-review-contractor',
      label: 'Yes',
    },
    {
      id: 'paf-e-gate-no',
      source: 'paf-class-gate',
      sourceHandle: 'no',
      target: 'paf-review-standard',
      label: 'No',
    },
    { id: 'paf-e-bechtel-decision', source: 'paf-review-contractor', target: 'paf-decision' },
    { id: 'paf-e-standard-decision', source: 'paf-review-standard', target: 'paf-decision' },
    {
      id: 'paf-e-yes',
      source: 'paf-decision',
      sourceHandle: 'yes',
      target: 'paf-approved',
      label: 'Yes',
    },
    {
      id: 'paf-e-no',
      source: 'paf-decision',
      sourceHandle: 'no',
      target: 'paf-rejected',
      label: 'No',
    },
    { id: 'paf-e-approved-end', source: 'paf-approved', target: 'paf-end-ok' },
    { id: 'paf-e-rejected-end', source: 'paf-rejected', target: 'paf-end-reject' },
  ],
  updatedAt: '2026-07-15T12:00:00.000Z',
}

/** @deprecated Use SAMPLE_WORKFLOWS — kept as alias for the PAF sample */
export const SAMPLE_WORKFLOW = PAF_APPROVAL_WORKFLOW

export const SAMPLE_WORKFLOWS: WorkflowDefinition[] = [
  STAFFING_PLAN_WORKFLOW,
  PAF_APPROVAL_WORKFLOW,
]
