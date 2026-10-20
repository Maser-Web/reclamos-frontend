import { Area, Cliente, Usuario } from '../core/interfaces/models';
export const AREAS_MOCK: Area[] = [
  { id: 'facturacion', nombre: 'Facturación', icono: 'file-text' }, { id: 'logistica', nombre: 'Logística', icono: 'truck' },
  { id: 'ventas', nombre: 'Ventas', icono: 'chart' }, { id: 'calidad', nombre: 'Calidad', icono: 'settings' },
  { id: 'sistemas', nombre: 'Sistemas', icono: 'monitor' }, { id: 'deposito', nombre: 'Depósito', icono: 'package' },
  { id: 'administracion', nombre: 'Administración', icono: 'users' }, { id: 'otro', nombre: 'Otro', icono: 'more-horizontal' }
];
export const USUARIOS_MOCK: Usuario[] = [
  { id: 'maria', nombre: 'María González', email: 'maria@coronel.com.ar', areaId: 'facturacion' },
  { id: 'juan', nombre: 'Juan Pérez', email: 'juan@coronel.com.ar', areaId: 'logistica' },
  { id: 'lucas', nombre: 'Lucas Romero', email: 'lucas@coronel.com.ar', areaId: 'ventas' },
  { id: 'sofia', nombre: 'Sofía Díaz', email: 'sofia@coronel.com.ar', areaId: 'calidad' }
];
export const CLIENTES_MOCK: Cliente[] = [
  { id: 'sanmartin', nombre: 'Ferretería San Martín', cuit: '30-12345678-9', email: 'ventas@sanmartin.com.ar', telefono: '+54 11 4567 8900' },
  { id: 'centro', nombre: 'Distribuidora del Centro', cuit: '30-44556677-2', email: 'compras@centro.com.ar', telefono: '+54 11 4321 0000' },
  { id: 'construmax', nombre: 'ConstruMax', cuit: '30-77554433-1', email: 'info@construmax.com.ar', telefono: '+54 11 4000 2211' },
  { id: 'sol', nombre: 'Autoservicio El Sol', cuit: '30-99887766-5', email: 'contacto@elsol.com.ar', telefono: '+54 11 4111 2233' },
  { id: 'norte', nombre: 'Mayorista Norte', cuit: '30-11998877-4', email: 'ventas@norte.com.ar', telefono: '+54 11 4777 8811' }
];
