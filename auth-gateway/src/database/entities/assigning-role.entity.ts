import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity({ name: 'assigning_roles' })
export class AssigningRole {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType!: string; // 'role' | 'permission' | other

  @Column({ name: 'entity_id', type: 'bigint' })
  entityId!: string;

  @Column({ name: 'assignable_type', length: 50 })
  assignableType!: string; // 'employee'

  @Column({ name: 'assignable_id', type: 'bigint' })
  assignableId!: string; // employee id

  @Column({ name: 'parent_id', type: 'bigint', nullable: true })
  parentId?: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'entity_id' })
  role?: Role;

  @ManyToOne(() => Permission, { nullable: true })
  @JoinColumn({ name: 'entity_id' })
  permission?: Permission;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assignable_id' })
  employee?: Employee;
}
