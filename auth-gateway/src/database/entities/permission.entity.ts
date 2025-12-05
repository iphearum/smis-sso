import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AssigningRole } from './assigning-role.entity';
import { PermissionRole } from './permission-role.entity';

@Entity({ name: 'permissions' })
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, unique: true })
  name!: string;

  @Column({ name: 'display_name', length: 255 })
  displayName!: string;

  @OneToMany(() => PermissionRole, (pr) => pr.permission)
  permissionRoles!: PermissionRole[];

  @OneToMany(() => AssigningRole, (ar) => ar.permission)
  assignments!: AssigningRole[];
}
