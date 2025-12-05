import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { Department } from './department.entity';
import { User } from './user.entity';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'name_kh', length: 255, nullable: true })
  nameKh?: string;

  @Column({ name: 'name_latin', length: 255 })
  nameLatin!: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'timestamp', nullable: true })
  birthdate?: Date;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'department_id', nullable: true })
  departmentId?: number;

  @Column({ name: 'branch_id', nullable: true })
  branchId?: number;

  @ManyToOne(() => User, (user) => user.employees, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch;
}
