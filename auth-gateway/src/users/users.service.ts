import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { compare } from 'bcryptjs';
import { In, Repository } from 'typeorm';
import { ApplicationDefinition } from '../applications/applications.service';
import { AssigningRole } from '../database/entities/assigning-role.entity';
import { Branch } from '../database/entities/branch.entity';
import { Department } from '../database/entities/department.entity';
import { Degree } from '../database/entities/degree.entity';
import { Employee } from '../database/entities/employee.entity';
import { Permission } from '../database/entities/permission.entity';
import { PermissionRole } from '../database/entities/permission-role.entity';
import { Role } from '../database/entities/role.entity';
import { User } from '../database/entities/user.entity';

export interface UserProfile {
  id: number;
  username: string;
  displayName: string;
  employeeId?: number | null;
  email?: string;
  phone?: string;
}

export interface AssignmentTreeNode {
  id: string;
  entityType: string;
  entityId: number;
  parentId?: string | null;
  details?: Record<string, any>;
  children: AssignmentTreeNode[];
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Employee) private readonly employeesRepo: Repository<Employee>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission) private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(AssigningRole) private readonly assigningRepo: Repository<AssigningRole>,
    @InjectRepository(PermissionRole) private readonly permRoleRepo: Repository<PermissionRole>,
    @InjectRepository(Branch) private readonly branchesRepo: Repository<Branch>,
    @InjectRepository(Department) private readonly departmentsRepo: Repository<Department>,
    @InjectRepository(Degree) private readonly degreesRepo: Repository<Degree>
  ) {}

  async validateCredentials(username: string, password: string): Promise<UserProfile> {
    const user = await this.usersRepo.findOne({ where: { email: username } });
    const ok = user?.password ? await compare(password, user.password) : false;
    if (!ok) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const employee = user ? await this.findEmployeeByUserId(user.id) : undefined;

    const profile: UserProfile = {
      id: user!.id,
      username: user!.email,
      displayName: user!.name,
      email: user!.email,
      employeeId: employee?.id ?? null
    };

    return profile;
  }

  async getById(userId: string): Promise<UserProfile> {
    const user = await this.usersRepo.findOne({ where: { id: Number(userId) } });
    if (!user) {
      throw new UnauthorizedException('Session user not found');
    }

    const employee = await this.findEmployeeByUserId(user.id);
    const profile: UserProfile = {
      id: user.id,
      username: user.email,
      displayName: user.name,
      email: user.email,
      employeeId: employee?.id ?? null
    };

    return profile;
  }

  async resolveAuthorizations(
    user: UserProfile,
    app: ApplicationDefinition
  ): Promise<{ roles: string[]; permissions: string[] }> {
    // If no employee mapped, fall back to defaults.
    if (!user.employeeId) {
      return { roles: app.defaultRoles, permissions: app.defaultPermissions };
    }

    const employeeId = user.employeeId;

    // Roles assigned to employee
    const roleAssignments = await this.assigningRepo.find({
      where: { entityType: 'role', assignableType: 'employee', assignableId: String(employeeId) }
    });
    const roleIds = roleAssignments.map((a) => Number(a.entityId));
    const roles = roleIds.length ? await this.rolesRepo.findBy({ id: In(roleIds) }) : [];
    const roleNames = roles.map((r) => r.name);

    // Permissions through roles
    const permsThroughRoles = roleIds.length
      ? await this.permRoleRepo
          .createQueryBuilder('pr')
          .leftJoinAndSelect('pr.permission', 'p')
          .where('pr.role_id IN (:...roleIds)', { roleIds })
          .getMany()
      : [];

    // Direct permissions assigned to employee
    const directPermAssignments = await this.assigningRepo.find({
      where: { entityType: 'permission', assignableType: 'employee', assignableId: String(employeeId) }
    });
    const directPermIds = directPermAssignments.map((a) => Number(a.entityId));
    const directPerms = directPermIds.length ? await this.permissionsRepo.findBy({ id: In(directPermIds) }) : [];

    const permissionsSet = new Set<string>();
    permsThroughRoles.forEach((pr) => permissionsSet.add(pr.permission.name));
    directPerms.forEach((p) => permissionsSet.add(p.name));

    const permissions = Array.from(permissionsSet);

    // Fallback to configured defaults if nothing is found for this user.
    return {
      roles: roleNames.length > 0 ? roleNames : app.defaultRoles,
      permissions: permissions.length > 0 ? permissions : app.defaultPermissions
    };
  }

  async getPermissionsForRoles(roleNames: string[]): Promise<string[]> {
    if (!roleNames.length) return [];

    const roles = await this.rolesRepo.findBy({ name: In(roleNames) });
    if (!roles.length) return [];

    const roleIds = roles.map((r) => r.id);
    const permsThroughRoles = await this.permRoleRepo
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.permission', 'p')
      .where('pr.role_id IN (:...roleIds)', { roleIds })
      .getMany();

    const permissions = new Set<string>();
    permsThroughRoles.forEach((pr) => permissions.add(pr.permission.name));
    return Array.from(permissions);
  }

  private async findEmployeeByUserId(userId: number): Promise<Employee | undefined> {
    const employee = await this.employeesRepo.findOne({
      where: { user: { id: userId }, active: true }
    });
    return employee ?? undefined;
  }

  async getEmployeeAssignmentTree(employeeId: number): Promise<AssignmentTreeNode[]> {
    const assignments = await this.assigningRepo.find({
      where: { assignableType: 'employee', assignableId: String(employeeId) }
    });

    if (assignments.length === 0) return [];

    // Build node map
    const nodes = new Map<string, AssignmentTreeNode>();
    for (const a of assignments) {
      nodes.set(a.id, {
        id: a.id,
        entityType: a.entityType,
        entityId: Number(a.entityId),
        parentId: a.parentId ?? null,
        children: []
      });
    }

    // Link children
    const roots: AssignmentTreeNode[] = [];
    for (const node of nodes.values()) {
      if (node.parentId && nodes.has(node.parentId)) {
        nodes.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Enrich details
    const idsByType = (type: string) =>
      Array.from(nodes.values())
        .filter((n) => n.entityType === type)
        .map((n) => n.entityId);

    const [branches, departments, degrees, roles, permissions] = await Promise.all([
      idsByType('branch').length ? this.branchesRepo.findBy({ id: In(idsByType('branch')) }) : [],
      idsByType('department').length ? this.departmentsRepo.findBy({ id: In(idsByType('department')) }) : [],
      idsByType('degree').length ? this.degreesRepo.findBy({ id: In(idsByType('degree')) }) : [],
      idsByType('role').length ? this.rolesRepo.findBy({ id: In(idsByType('role')) }) : [],
      idsByType('permission').length ? this.permissionsRepo.findBy({ id: In(idsByType('permission')) }) : []
    ]);

    const detailLookup: Record<string, Map<number, any>> = {
      branch: new Map(branches.map((b) => [b.id, b])),
      department: new Map(departments.map((d) => [d.id, d])),
      degree: new Map(degrees.map((d) => [d.id, d])),
      role: new Map(roles.map((r) => [r.id, r])),
      permission: new Map(permissions.map((p) => [p.id, p]))
    };

    nodes.forEach((node) => {
      const map = detailLookup[node.entityType];
      if (map) {
        node.details = map.get(node.entityId);
      }
    });

    return roots;
  }

  /**
   * Builds a branch -> department -> (roles, permissions, degrees) view for the employee based on assigning_roles.
   */
  async getBranchDepartmentAuthorizations(employeeId: number): Promise<
    Array<{
      branch: Branch | null;
      departments: Array<{
        department: Department | null;
        roles: string[];
        permissions: string[];
        degrees: string[];
      }>;
    }>
  > {
    const tree = await this.getEmployeeAssignmentTree(employeeId);

    const toArray = <T>(iter: Iterable<T>) => Array.from(iter);
    const collect = (nodes: AssignmentTreeNode[], type: string) =>
      nodes.filter((n) => n.entityType === type && n.details) as AssignmentTreeNode[];

    const branches = collect(tree, 'branch');

    // If there is no branch node, treat root as implicit branch=null with departments directly under root.
    const branchNodes = branches.length ? branches : [{ id: 'root', entityType: 'branch', entityId: 0, children: tree, details: null, parentId: null }];

    const result: Array<{
      branch: Branch | null;
      departments: Array<{ department: Department | null; roles: string[]; permissions: string[]; degrees: string[] }>;
    }> = [];

    for (const branchNode of branchNodes) {
      const deptNodes = collect(branchNode.children, 'department');
      const departments = [];
      for (const deptNode of deptNodes) {
        const roles = collect(deptNode.children, 'role').map((r) => (r.details as Role).name);
        const directPerms = collect(deptNode.children, 'permission').map((p) => (p.details as Permission).name);
        const degrees = collect(deptNode.children, 'degree').map(
          (d) => (d.details as Degree).nameEn ?? (d.details as Degree).nameKh ?? (d.details as Degree).nameFr ?? String(d.entityId)
        );

        let permsViaRoles: string[] = [];
        if (roles.length) {
          permsViaRoles = await this.permissionsFromRoleNames(roles);
        }

        const permissions = Array.from(new Set([...directPerms, ...permsViaRoles]));

        departments.push({
          department: deptNode.details as Department,
          roles,
          permissions,
          degrees
        });
      }

      result.push({
        branch: branchNode.details as Branch | null,
        departments
      });
    }

    return result;
  }

  /**
   * Helper: fetch permissions for given role names.
   */
  private async permissionsFromRoleNames(roleNames: string[]): Promise<string[]> {
    if (!roleNames.length) return [];
    const roles = await this.rolesRepo.find({ where: { name: In(roleNames) } });
    if (!roles.length) return [];
    const roleIds = roles.map((r) => r.id);
    const permRoles = await this.permRoleRepo
      .createQueryBuilder('pr')
      .leftJoinAndSelect('pr.permission', 'p')
      .where('pr.role_id IN (:...roleIds)', { roleIds })
      .getMany();
    const set = new Set<string>();
    permRoles.forEach((pr) => set.add(pr.permission.name));
    return Array.from(set);
  }
}
