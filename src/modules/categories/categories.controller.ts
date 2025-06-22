import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AllCategoryDto } from './dto/all-category.dto';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Role } from '../../enum/role.enum';
import { Roles } from '../../commons/decorators/roles.decorator';
import { AuthGuard } from '../../commons/guards/auth';
import { RolesGuard } from '../../commons/guards/roles.guard';

@Controller('categories')
@ApiTags('Category')
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findAll(@Query() allCategoryDto: AllCategoryDto) {
    return this.categoriesService.findAll(allCategoryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiParam({ name: 'id', required: true, type: Number })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  remove(@Param('id') id: number) {
    return this.categoriesService.remove(+id);
  }
}
