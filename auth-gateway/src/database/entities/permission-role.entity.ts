import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity({ name: 'permission_role' })
export class PermissionRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Permission, (p) => p.permissionRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;

  @ManyToOne(() => Role, (r) => r.permissionRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}
