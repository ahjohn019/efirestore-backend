import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, CreateUserDetailsDto } from './dto/create-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../../commons/guards/auth';
import { RolesGuard } from '../../commons/guards/roles.guard';
import { Roles } from '../../commons/decorators/roles.decorator';
import { Role } from '../../enum/role.enum';
import { AllUserDto } from './dto/all-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('/user-details/create')
  createUserDetails(@Body() createUserDetailsDto: CreateUserDetailsDto) {
    return this.usersService.createUsersDetails(createUserDetailsDto);
  }

  @Put('/user-details/update')
  updateUserDetails(@Body() updateUserDetailsDto: UpdateUserDetailsDto) {
    return this.usersService.updateUsersDetails(updateUserDetailsDto);
  }

  @Post()
  findByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  findAll(@Body() allProductDto: AllUserDto) {
    return this.usersService.findAll(allProductDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
