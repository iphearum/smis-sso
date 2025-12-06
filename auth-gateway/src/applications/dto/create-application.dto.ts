import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @ApiProperty({ example: 'pp-demo-123456', description: 'Unique key issued to the application' })
  @IsString()
  @MaxLength(64)
  key!: string;

  @ApiProperty({ example: 'Payroll Portal' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Internal payroll and benefits management' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], example: ['employee'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultRoles?: string[];

  @ApiPropertyOptional({ type: [String], example: ['payroll:view'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultPermissions?: string[];
}
