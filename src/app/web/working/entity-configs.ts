import { CrudConfig } from '../../shared/working/entity-crud/entity-crud';
const full = { select: true, insert: true, update: true, delete: true };
const write = { select: true, insert: true, update: true, delete: true };
export const ENTITY_CONFIGS: Record<string, CrudConfig> = {
  b52d40d1: { title: 'Roles Módulos', resource: 'role-modules', operations: full, fields: [{ name: 'ms_8b6bd18a', label: 'Módulo', required: true, relation: { resource: 'table-modules', displayField: 'fd_product' } }, { name: 'tg_2f997592', label: 'Acceso', required: true, relation: { resource: 'role-access', displayField: 'fd_name' } }, { name: 'tg_9a7bbe6f', label: 'Rol', required: true, relation: { resource: 'role-data', displayField: 'fd_name' } }] },
  d8d07776: { title: 'Permisos JWT', resource: 'jwt-permits', operations: full, fields: [{ name: 'fd_name', label: 'Permiso', required: true }] },
  a1fecd50: { title: 'Módulos', resource: 'table-modules', operations: full, fields: [{ name: 'fd_client', label: 'Cliente', required: true }, { name: 'fd_prefix', label: 'Prefijo', required: true }, { name: 'fd_product', label: 'Producto', required: true }] },
  e9cb64fd: { title: 'Recursos de tabla', resource: 'table-resources', operations: full, fields: [{ name: 'fd_client', label: 'Cliente', required: true }, { name: 'fd_entity', label: 'Entidad', required: true }, { name: 'fd_name', label: 'Nombre', required: true }, { name: 'sd_select', label: 'Consultar', required: true, relation: { resource: 'jwt-permits', displayField: 'fd_name' } }, { name: 'sd_insert', label: 'Insertar', required: true, relation: { resource: 'jwt-permits', displayField: 'fd_name' } }, { name: 'sd_update', label: 'Actualizar', required: true, relation: { resource: 'jwt-permits', displayField: 'fd_name' } }, { name: 'sd_delete', label: 'Eliminar', required: true, relation: { resource: 'jwt-permits', displayField: 'fd_name' } }, { name: 'ms_8b6bd18a', label: 'Módulo', required: true, relation: { resource: 'table-modules', displayField: 'fd_product' } }] },
  b602ef28: { title: 'Roles de datos', resource: 'role-data', operations: full, fields: [{ name: 'fd_name', label: 'Rol', required: true }] },
  d02ee146: { title: 'Roles de acceso', resource: 'role-access', operations: full, fields: [{ name: 'fd_name', label: 'Acceso', required: true }] },
  a8dc1924: { title: 'Permisos por rol', resource: 'role-permits', operations: full, fields: [{ name: 'sd_insert', label: 'Insertar', required: true, relation: { resource: 'role-access', displayField: 'fd_name' } }, { name: 'sd_update', label: 'Actualizar', required: true, relation: { resource: 'role-access', displayField: 'fd_name' } }, { name: 'sd_delete', label: 'Eliminar', required: true, relation: { resource: 'role-access', displayField: 'fd_name' } }, { name: 'ms_2e794a8f', label: 'Recurso', required: true, relation: { resource: 'table-resources', displayField: 'fd_name' } }, { name: 'tg_2f997592', label: 'Acceso', required: true, relation: { resource: 'role-access', displayField: 'fd_name' } }, { name: 'tg_9a7bbe6f', label: 'Rol', required: true, relation: { resource: 'role-data', displayField: 'fd_name' } }] },
  a1cc27fb: {
    title: 'Sociedades',
    resource: 'societies',
    operations: full,
    fields: [
      { name: 'fd_company', label: 'Empresa', required: true },
      { name: 'fd_document', label: 'Documento', required: true },
    ],
  },
  a7b95fe8: {
    title: 'Métodos',
    resource: 'methods',
    operations: full,
    fields: [{ name: 'fd_service', label: 'Método', required: true }],
  },
  d35a393b: {
    title: 'Servicios',
    resource: 'services',
    operations: full,
    fields: [
      { name: 'fd_name', label: 'Nombre', required: true },
      { name: 'fd_service', label: 'Servicio', required: true },
    ],
  },
  '8ebaa791': {
    title: 'Recursos',
    resource: 'resources',
    operations: full,
    fields: [
      { name: 'fd_name', label: 'Nombre', required: true },
      { name: 'fd_path', label: 'Ruta', required: true },
      {
        name: 'sd_3a731d00',
        label: 'Método',
        required: true,
        relation: { resource: 'methods', displayField: 'fd_service' },
      },
      {
        name: 'pm_0dfa99e2',
        label: 'Servicio',
        required: true,
        relation: { resource: 'services', displayField: 'fd_name' },
      },
    ],
  },
  e144c860: {
    title: 'Orígenes',
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
      {
        name: 'fd_passd',
        label: 'Contraseña',
        type: 'password',
        required: true,
        showInTable: false,
      },
      { name: 'tg_9a7bbe6f', label: 'Rol', required: true, relation: { resource: 'role-data', displayField: 'fd_name' } },
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
    autoComplete: true,
    questionsManager: true,
    valuesManager: true,
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
    valuesManager: true,
    fields: [
      { name: 'fd_ask', label: 'Pregunta', required: true },
      { name: 'fd_order', label: 'Orden', type: 'number', required: true },
      { name: 'fd_required', label: 'Requerido', type: 'boolean' },
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
