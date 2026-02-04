import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user-tenant-role.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({ status: 201, description: 'Category successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Post()
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async create(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.categoriesService.createCategory(createCategoryDto, schemaName);
  }

  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({ status: 200, description: 'Returns list of all categories' })
  @Get()
  async findAll(@Request() req) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.categoriesService.findAll(schemaName);
  }

  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Returns the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.categoriesService.findOne(id, schemaName);
  }

  @ApiOperation({ summary: 'Update category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category successfully updated' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.categoriesService.update(id, updateCategoryDto, schemaName);
  }

  @ApiOperation({ summary: 'Delete category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category successfully deleted' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async remove(@Request() req, @Param('id') id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    await this.categoriesService.remove(id, schemaName);
    return { message: 'Category deleted successfully' };
  }
}
