import { CrudConfig } from '../../shared/working/entity-crud/entity-crud';
const full = { select: true, insert: true, update: true, delete: true };
const write = { select: true, insert: true, update: true, delete: true };
export const ENTITY_CONFIGS: Record<string, CrudConfig> = {
  e144c860: {
    title: 'Orígenes CORS',
    resource: 'cors-origins',
    operations: full,
    fields: [{ name: 'fd_service', label: 'Servicio', required: true }],
  },
  b64883b6: {
    title: 'Usuarios',
    resource: 'users',
    operations: full,
    passwordChange: true,
    fields: [
      { name: 'fd_login', label: 'Usuario', required: true },
      { name: 'fd_passd', label: 'Contraseña', type: 'password', required: true },
    ],
  },
  e5520e1e: {
    title: 'Anónimos',
    resource: 'anonymous',
    operations: full,
    fields: [
      { name: 'fd_random', label: 'Aleatorio' },
      { name: 'fd_reservation_key', label: 'Clave de reserva', required: true },
      {
        name: 'pm_4d802b91',
        label: 'Encuesta',
        required: true,
        relation: { resource: 'surveys', displayField: 'fd_name' },
      },
    ],
  },
  a6aedeb5: {
    title: 'Alcances',
    resource: 'scopes',
    operations: full,
    fields: [{ name: 'fd_setting', label: 'Formato', required: true }],
  },
  a3b378b4: {
    title: 'Tipos',
    resource: 'types',
    operations: full,
    fields: [{ name: 'fd_format', label: 'Formato', required: true }],
  },
  d5fb87de: {
    title: 'Encuestas',
    resource: 'surveys',
    operations: write,
    fields: [
      { name: 'fd_count', label: 'Permitido', type: 'number', required: true },
      { name: 'fd_name', label: 'Nombre', required: true },
      { name: 'fd_query', label: 'Preguntas', type: 'number', required: true },
      { name: 'fd_since', label: 'Apertura', type: 'date', required: true },
      { name: 'fd_until', label: 'Cierre', type: 'date', required: true },
      {
        name: 'pm_8e417bb2',
        label: 'Alcance',
        required: true,
        relation: { resource: 'scopes', displayField: 'fd_setting' },
      },
    ],
  },
  d2e6ded6: {
    title: 'Preguntas',
    resource: 'questions',
    operations: write,
    fields: [
      { name: 'fd_ask', label: 'Pregunta', required: true },
      { name: 'fd_order', label: 'Orden', type: 'number', required: true },
      {
        name: 'pm_0d3dc00e',
        label: 'Tipo',
        required: true,
        relation: { resource: 'types', displayField: 'fd_format' },
      },
      {
        name: 'pm_4d802b91',
        label: 'Encuesta',
        required: true,
        relation: { resource: 'surveys', displayField: 'fd_name' },
      },
    ],
  },
  d76a0e67: {
    title: 'Valores',
    resource: 'values',
    operations: write,
    fields: [
      { name: 'fd_option', label: 'Opción', required: true },
      { name: 'fd_order', label: 'Orden', type: 'number', required: true },
      {
        name: 'pm_0acc84ae',
        label: 'Pregunta',
        required: true,
        relation: { resource: 'questions', displayField: 'fd_ask', orderBy: 'fd_order' },
      },
    ],
  },
  a5acf579: {
    title: 'Respuestas',
    resource: 'answers',
    operations: write,
    fields: [
      { name: 'fd_repply', label: 'Respuesta', required: true },
      {
        name: 'pm_9a582ff6',
        label: 'Valor',
        required: true,
        relation: { resource: 'values', displayField: 'fd_option' },
      },
      {
        name: 'pm_1a4a8cd7',
        label: 'Anónimo',
        required: true,
        relation: { resource: 'anonymous', displayField: 'fd_random' },
      },
    ],
  },
};
