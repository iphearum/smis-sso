import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 100 })
  confirmation_code!: string;

  @Column({ length: 60 })
  password!: string;

  @Column({ default: true })
  confirmed!: boolean;

  @Column({ type: 'smallint', default: 1 })
  status!: number;

  @OneToMany(() => Employee, (employee) => employee.user)
  employees!: Employee[];
}
