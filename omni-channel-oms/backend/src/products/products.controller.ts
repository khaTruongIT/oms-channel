import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { TenantLimitsService } from '../tenants/tenant-limits.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
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

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly tenantLimitsService: TenantLimitsService,
  ) {}

  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions or limit exceeded',
  })
  @Post()
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async createProduct(
    @Request() req,
    @Body() createProductDto: CreateProductDto,
  ) {
    const schemaName = req.user.schemaName;
    const tenantId = req.user.tenantId;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    // Enforce product limit before creating
    if (tenantId) {
      await this.tenantLimitsService.enforceProductLimit(tenantId);
    }

    return this.productsService.createProduct(createProductDto, schemaName);
  }

  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Returns list of all products' })
  @Get()
  async getAllProducts(@Request() req) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.productsService.getAllProducts(schemaName);
  }

  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Returns the product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @Get(':id')
  async getProduct(@Request() req, @Param('id') id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.productsService.getProductById(id, schemaName);
  }

  @ApiOperation({ summary: 'Update product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product successfully updated' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.WAREHOUSE_MANAGER)
  async updateProduct(
    @Request() req,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    return this.productsService.updateProduct(id, updateProductDto, schemaName);
  }

  @ApiOperation({ summary: 'Delete product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions (Owner only)',
  })
  @Delete(':id')
  @Roles(UserRole.OWNER)
  async deleteProduct(@Request() req, @Param('id') id: string) {
    const schemaName = req.user.schemaName;

    if (!schemaName) {
      throw new NotFoundException('Tenant schema not found');
    }

    await this.productsService.deleteProduct(id, schemaName);
    return { message: 'Product deleted successfully' };
  }
}
