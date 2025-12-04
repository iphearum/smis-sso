import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ApplicationDefinition } from '../applications/applications.service';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  employeeId: string;
  email?: string;
  phone?: string;
  rolesByApp: Record<string, string[]>;
  permissionsByApp: Record<string, string[]>;
}

@Injectable()
export class UsersService {
  private readonly users: UserProfile[] = [
    {
      id: 'u-100',
      username: 'sara',
      displayName: 'Sara Chea',
      employeeId: 'emp-001',
      email: 'sara@example.com',
      phone: '+85500000001',
      rolesByApp: {
        'pp-demo-123456': ['employee', 'payroll:viewer'],
        'tk-gic-987654': ['requester']
      },
      permissionsByApp: {
        'pp-demo-123456': ['payroll:view', 'benefits:view'],
        'tk-gic-987654': ['tickets:create', 'tickets:view']
      }
    },
    {
      id: 'u-200',
      username: 'dara',
      displayName: 'Dara Chhouk',
      employeeId: 'emp-002',
      email: 'dara@example.com',
      phone: '+85500000002',
      rolesByApp: {
        'pp-gic-555555': ['purchaser', 'approver'],
        'tk-gic-987654': ['agent']
      },
      permissionsByApp: {
        'pp-gic-555555': ['purchases:view', 'purchases:approve'],
        'tk-gic-987654': ['tickets:view', 'tickets:assign']
      }
    }
  ];

  private readonly passwordLookup: Record<string, string> = {
    sara: 'password123',
    dara: 'password123'
  };

  validateCredentials(username: string, password: string): UserProfile {
    const user = this.users.find((candidate) => candidate.username === username);
    if (!user || this.passwordLookup[username] !== password) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return user;
  }

  getById(userId: string): UserProfile {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new UnauthorizedException('Session user not found');
    }
    return user;
  }

  resolveAuthorizations(user: UserProfile, app: ApplicationDefinition): { roles: string[]; permissions: string[] } {
    const roles = user.rolesByApp[app.key] ?? app.defaultRoles;
    const permissions = user.permissionsByApp[app.key] ?? app.defaultPermissions;
    return { roles, permissions };
  }
}
