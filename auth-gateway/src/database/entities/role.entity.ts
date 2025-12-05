import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AssigningRole } from './assigning-role.entity';
import { PermissionRole } from './permission-role.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, unique: true })
  name!: string;

  @Column({ default: false })
  all!: boolean;

  @OneToMany(() => PermissionRole, (pr) => pr.role)
  permissionRoles!: PermissionRole[];

  @OneToMany(() => AssigningRole, (ar) => ar.role)
  assignments!: AssigningRole[];
}
