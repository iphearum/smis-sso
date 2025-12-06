import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from './application.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ApplicationsService {
  constructor(@InjectRepository(Application, 'apps') private readonly repo: Repository<Application>) {}

  async getAll(): Promise<Application[]> {
    return this.repo.find();
  }

  async findByKey(appKey: string): Promise<Application | null> {
    return this.repo.findOne({ where: { key: appKey } });
  }

  async requireApplication(appKey: string): Promise<Application> {
    const application = await this.findByKey(appKey);
    if (!application) {
      throw new BadRequestException(`Unknown application key: ${appKey}`);
    }
    return application;
  }

  async findOne(id: number): Promise<Application> {
    const app = await this.repo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async create(dto: CreateApplicationDto): Promise<Application> {
    const existing = await this.findByKey(dto.key);
    if (existing) {
      throw new BadRequestException('Application key already exists');
    }
    const app = this.repo.create({
      ...dto,
      defaultRoles: dto.defaultRoles ?? [],
      defaultPermissions: dto.defaultPermissions ?? []
    });
    return this.repo.save(app);
  }

  generateKey(): string {
    // 64 characters: base64url, stripped to alphanumeric for compatibility
    return randomBytes(48).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
  }

  async update(id: number, dto: UpdateApplicationDto): Promise<Application> {
    const app = await this.findOne(id);
    if (dto.key && dto.key !== app.key) {
      const exists = await this.findByKey(dto.key);
      if (exists && exists.id !== id) {
        throw new BadRequestException('Application key already exists');
      }
    }
    Object.assign(app, dto);
    if (dto.defaultRoles) app.defaultRoles = dto.defaultRoles;
    if (dto.defaultPermissions) app.defaultPermissions = dto.defaultPermissions;
    return this.repo.save(app);
  }

  async remove(id: number): Promise<void> {
    const app = await this.findOne(id);
    await this.repo.remove(app);
  }
}
