import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssigningRole } from './entities/assigning-role.entity';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { Degree } from './entities/degree.entity';
import { Employee } from './entities/employee.entity';
import { Permission } from './entities/permission.entity';
import { PermissionRole } from './entities/permission-role.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? '127.0.0.1',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USER ?? 'smis_auth_sso',
        password: process.env.DB_PASSWORD ?? '123',
        database: process.env.DB_NAME ?? 'smis.pro',
        entities: [User, Employee, Role, Permission, PermissionRole, AssigningRole, Branch, Department, Degree],
        synchronize: false
      })
    }),
    TypeOrmModule.forFeature([User, Employee, Role, Permission, PermissionRole, AssigningRole, Branch, Department, Degree])
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
