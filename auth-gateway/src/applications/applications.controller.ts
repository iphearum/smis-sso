import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@ApiTags('applications')
@Controller('/api/apps')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'List applications' })
  findAll() {
    return this.applicationsService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get application by id' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create application' })
  @ApiBody({ type: CreateApplicationDto })
  create(@Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(dto);
  }

  @Get('/generate/key')
  @ApiOperation({ summary: 'Generate unique application key (27 chars)' })
  generateKey() {
    return { key: this.applicationsService.generateKey() };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update application' })
  @ApiBody({ type: UpdateApplicationDto })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateApplicationDto) {
    return this.applicationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete application' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.applicationsService.remove(id);
  }
}
