import { BadRequestException, Injectable } from '@nestjs/common';

export interface ApplicationDefinition {
  key: string;
  name: string;
  description?: string;
  defaultRoles: string[];
  defaultPermissions: string[];
}

@Injectable()
export class ApplicationsService {
  private readonly applications: ApplicationDefinition[] = [
    {
      key: 'pp-demo-123456',
      name: 'Payroll Portal',
      description: 'Internal payroll and benefits management',
      defaultRoles: ['employee'],
      defaultPermissions: ['payroll:view']
    },
    {
      key: 'tk-gic-987654',
      name: 'Ticketing Portal',
      description: 'IT and facilities ticketing',
      defaultRoles: ['requester'],
      defaultPermissions: ['tickets:create', 'tickets:view']
    },
    {
      key: 'pp-gic-555555',
      name: 'Purchasing Portal',
      description: 'Procurement and purchase approvals',
      defaultRoles: ['purchaser'],
      defaultPermissions: ['purchases:view']
    }
  ];

  getAll(): ApplicationDefinition[] {
    return this.applications;
  }

  findByKey(appKey: string): ApplicationDefinition | undefined {
    return this.applications.find((app) => app.key === appKey);
  }

  requireApplication(appKey: string): ApplicationDefinition {
    const application = this.findByKey(appKey);
    if (!application) {
      throw new BadRequestException(`Unknown application key: ${appKey}`);
    }
    return application;
  }
}
