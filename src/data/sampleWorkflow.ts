import type { WorkflowDefinition } from '../types/workflow'

const SHARED_STATES = [
  { id: 'state-draft', name: 'Draft', color: '#757575' },
  { id: 'state-submitted', name: 'Submitted', color: '#1976d2' },
  { id: 'state-cost-review', name: 'Cost Review', color: '#6a1b9a' },
  { id: 'state-in-review', name: 'In Review', color: '#ed6c02' },
  { id: 'state-pd-review', name: 'Project Director Review', color: '#4527a0' },
  { id: 'state-approved', name: 'Approved', color: '#2e7d32' },
  { id: 'state-rejected', name: 'Rejected', color: '#c62828' },
  { id: 'state-complete', name: 'Complete', color: '#00695c' },
]

/**
 * Staffing Plan approval flow (request stays Pending until the last approval):
 * Submitted (requestor) → Approved by Cost Engineer → Approved by Manager →
 * Approved by Project Director (final) → fully Approved.
 * Reject at any wait step ends the workflow.
 */
export const STAFFING_PLAN_WORKFLOW: WorkflowDefinition = {
  id: 'workflow-staffing-plan-approval',
  name: 'Staffing Plan Approval',
  description:
    'Requestor submits, Cost Engineer approves costing, Manager approves, Project Director gives final approval',
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
      position: { x: 280, y: 110 },
      data: {
        kind: 'step',
        label: 'Submitted — by Requestor',
        roleId: 'role-requestor',
        stateId: 'state-submitted',
        waitForAction: false,
      },
    },
    {
      id: 'sp-cost-review',
      type: 'step',
      position: { x: 280, y: 240 },
      data: {
        kind: 'step',
        label: 'Approved — by Cost Engineer',
        roleId: 'role-cost-engineer',
        stateId: 'state-cost-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-hiring-gate',
      type: 'decision',
      position: { x: 290, y: 380 },
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
        stateId: 'state-cost-review',
      },
    },
    {
      id: 'sp-review-bantrel',
      type: 'step',
      position: { x: 40, y: 520 },
      data: {
        kind: 'step',
        label: 'Approved — by Manager',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-review-other',
      type: 'step',
      position: { x: 480, y: 520 },
      data: {
        kind: 'step',
        label: 'Approved — by Manager',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-project-gate',
      type: 'decision',
      position: { x: 290, y: 660 },
      data: {
        kind: 'decision',
        label: 'JS1 project?',
        decisionQuestion: 'Is this a JS1 project position?',
        decisionMode: 'field',
        fieldCondition: {
          field: 'phase',
          operator: 'equals',
          value: 'JS1',
        },
        roleId: '',
        stateId: 'state-in-review',
      },
    },
    {
      id: 'sp-pd-js1',
      type: 'step',
      position: { x: 40, y: 800 },
      data: {
        kind: 'step',
        label: 'Approved — by Project Director',
        roleId: 'role-project-director',
        stateId: 'state-pd-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-pd-js2',
      type: 'step',
      position: { x: 480, y: 800 },
      data: {
        kind: 'step',
        label: 'Approved — by Project Director',
        roleId: 'role-project-director',
        stateId: 'state-pd-review',
        waitForAction: true,
      },
    },
    {
      id: 'sp-approved',
      type: 'step',
      position: { x: 280, y: 940 },
      data: {
        kind: 'step',
        label: 'Fully Approved',
        roleId: 'role-project-director',
        stateId: 'state-approved',
        waitForAction: false,
      },
    },
    {
      id: 'sp-rejected',
      type: 'step',
      position: { x: 560, y: 940 },
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
      position: { x: 320, y: 1080 },
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
      position: { x: 600, y: 1080 },
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
    { id: 'sp-e-submit-cost', source: 'sp-submit', target: 'sp-cost-review' },
    { id: 'sp-e-cost-hire', source: 'sp-cost-review', target: 'sp-hiring-gate' },
    {
      id: 'sp-e-cost-reject',
      source: 'sp-cost-review',
      sourceHandle: 'no',
      target: 'sp-rejected',
      label: 'Reject',
    },
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
    { id: 'sp-e-bantrel-project', source: 'sp-review-bantrel', target: 'sp-project-gate' },
    { id: 'sp-e-other-project', source: 'sp-review-other', target: 'sp-project-gate' },
    {
      id: 'sp-e-bantrel-reject',
      source: 'sp-review-bantrel',
      sourceHandle: 'no',
      target: 'sp-rejected',
      label: 'Reject',
    },
    {
      id: 'sp-e-other-reject',
      source: 'sp-review-other',
      sourceHandle: 'no',
      target: 'sp-rejected',
      label: 'Reject',
    },
    {
      id: 'sp-e-project-js1',
      source: 'sp-project-gate',
      sourceHandle: 'yes',
      target: 'sp-pd-js1',
      label: 'Yes',
    },
    {
      id: 'sp-e-project-js2',
      source: 'sp-project-gate',
      sourceHandle: 'no',
      target: 'sp-pd-js2',
      label: 'No',
    },
    { id: 'sp-e-pd-js1-ok', source: 'sp-pd-js1', target: 'sp-approved' },
    { id: 'sp-e-pd-js2-ok', source: 'sp-pd-js2', target: 'sp-approved' },
    {
      id: 'sp-e-pd-js1-reject',
      source: 'sp-pd-js1',
      sourceHandle: 'no',
      target: 'sp-rejected',
      label: 'Reject',
    },
    {
      id: 'sp-e-pd-js2-reject',
      source: 'sp-pd-js2',
      sourceHandle: 'no',
      target: 'sp-rejected',
      label: 'Reject',
    },
    { id: 'sp-e-approved-end', source: 'sp-approved', target: 'sp-end-ok' },
    { id: 'sp-e-rejected-end', source: 'sp-rejected', target: 'sp-end-reject' },
  ],
  updatedAt: '2026-07-16T22:05:00.000Z',
}

/**
 * PAF approval flow (request stays Pending until the last approval):
 * Submitted (requestor) → Approved by Manager → Approved by Project Director
 * (JS1 / JS2 for the linked position's project) → fully Approved.
 * Reject at any wait step ends the workflow.
 */
export const PAF_APPROVAL_WORKFLOW: WorkflowDefinition = {
  id: 'workflow-paf-approval',
  name: 'PAF Request Approval',
  description:
    'Requestor submits a PAF, Manager approves, then the Project Director for that project gives final approval',
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
        label: 'Submitted — by Requestor',
        roleId: 'role-requestor',
        stateId: 'state-submitted',
        waitForAction: false,
      },
    },
    {
      id: 'paf-manager-review',
      type: 'step',
      position: { x: 280, y: 260 },
      data: {
        kind: 'step',
        label: 'Approved — by Manager',
        roleId: 'role-manager',
        stateId: 'state-in-review',
        waitForAction: true,
      },
    },
    {
      id: 'paf-project-gate',
      type: 'decision',
      position: { x: 290, y: 400 },
      data: {
        kind: 'decision',
        label: 'JS1 project?',
        decisionQuestion: 'Is this a JS1 project position?',
        decisionMode: 'field',
        fieldCondition: {
          field: 'phase',
          operator: 'equals',
          value: 'JS1',
        },
        roleId: '',
        stateId: 'state-in-review',
      },
    },
    {
      id: 'paf-pd-js1',
      type: 'step',
      position: { x: 40, y: 540 },
      data: {
        kind: 'step',
        label: 'Approved — by Project Director',
        roleId: 'role-project-director',
        stateId: 'state-pd-review',
        waitForAction: true,
      },
    },
    {
      id: 'paf-pd-js2',
      type: 'step',
      position: { x: 480, y: 540 },
      data: {
        kind: 'step',
        label: 'Approved — by Project Director',
        roleId: 'role-project-director',
        stateId: 'state-pd-review',
        waitForAction: true,
      },
    },
    {
      id: 'paf-approved',
      type: 'step',
      position: { x: 280, y: 680 },
      data: {
        kind: 'step',
        label: 'Fully Approved',
        roleId: 'role-project-director',
        stateId: 'state-approved',
        waitForAction: false,
      },
    },
    {
      id: 'paf-rejected',
      type: 'step',
      position: { x: 560, y: 680 },
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
      position: { x: 320, y: 820 },
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
      position: { x: 600, y: 820 },
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
    { id: 'paf-e-submit-manager', source: 'paf-submit', target: 'paf-manager-review' },
    {
      id: 'paf-e-manager-reject',
      source: 'paf-manager-review',
      sourceHandle: 'no',
      target: 'paf-rejected',
      label: 'Reject',
    },
    { id: 'paf-e-manager-project', source: 'paf-manager-review', target: 'paf-project-gate' },
    {
      id: 'paf-e-project-js1',
      source: 'paf-project-gate',
      sourceHandle: 'yes',
      target: 'paf-pd-js1',
      label: 'Yes',
    },
    {
      id: 'paf-e-project-js2',
      source: 'paf-project-gate',
      sourceHandle: 'no',
      target: 'paf-pd-js2',
      label: 'No',
    },
    {
      id: 'paf-e-pd-js1-reject',
      source: 'paf-pd-js1',
      sourceHandle: 'no',
      target: 'paf-rejected',
      label: 'Reject',
    },
    {
      id: 'paf-e-pd-js2-reject',
      source: 'paf-pd-js2',
      sourceHandle: 'no',
      target: 'paf-rejected',
      label: 'Reject',
    },
    { id: 'paf-e-pd-js1-ok', source: 'paf-pd-js1', target: 'paf-approved' },
    { id: 'paf-e-pd-js2-ok', source: 'paf-pd-js2', target: 'paf-approved' },
    { id: 'paf-e-approved-end', source: 'paf-approved', target: 'paf-end-ok' },
    { id: 'paf-e-rejected-end', source: 'paf-rejected', target: 'paf-end-reject' },
  ],
  updatedAt: '2026-07-16T23:30:00.000Z',
}

/** @deprecated Use SAMPLE_WORKFLOWS — kept as alias for the PAF sample */
export const SAMPLE_WORKFLOW = PAF_APPROVAL_WORKFLOW

export const SAMPLE_WORKFLOWS: WorkflowDefinition[] = [
  STAFFING_PLAN_WORKFLOW,
  PAF_APPROVAL_WORKFLOW,
]
